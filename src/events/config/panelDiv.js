const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, MessageFlags } = require("discord.js");
const { db, lg } = require("../../database/index");
const { gerencTokens, main, gerencDiv } = require("../../functions/others/panelEmbeds");
const { getInfo, guildVerify, changeUser, changeAvatar, inicDivSystem } = require("../../functions/axios/discord");
const fs = require('fs');

module.exports = {
    name:"interactionCreate",
    run:async(interaction, client) => {
        const { customId, user, fields, channel, guild } = interaction;
        if(!customId || !guild) return;
          
        if(customId === "gerenc_token") {
            await interaction.deferUpdate();
            gerencTokens(interaction);
        }
        if(customId === "voltar") {
            await interaction.deferUpdate();
            main(interaction);
        }
        if(customId === "config_tokens") {
            const modal = new ModalBuilder()
            .setTitle("Configurar Tokens")
            .setCustomId("config_tokens_modal");

            const tokens = new TextInputBuilder()
            .setCustomId("tokens")
            .setLabel("Coloque o tokens por linha:")
            .setStyle(2)
            .setRequired(true)
            .setPlaceholder("TOKEN 2\nTOKEN 2\nTOKEN 3");

            const bot = new TextInputBuilder()
            .setCustomId("bot")
            .setLabel("Os Tokens é Bot's?")
            .setStyle(1)
            .setRequired(true)
            .setMaxLength(3)
            .setMinLength(3)
            .setValue("Sim")
            .setPlaceholder("Sim/Não");

            modal.addComponents(new ActionRowBuilder().addComponents(tokens));
            modal.addComponents(new ActionRowBuilder().addComponents(bot));

            return interaction.showModal(modal);
        }
        if(customId === "config_tokens_modal") {
            const tokens = fields.getTextInputValue("tokens").split("\n");
            const bot = fields.getTextInputValue("bot").toLowerCase() === "sim";

            const check = [];

            await interaction.deferUpdate();

            for(const token of tokens) {
                let string = token;
                if(bot) string = `Bot ${token}`;

                const verf = await getInfo(string);
                if(verf.err) continue;

                check.push(string);
            }

            interaction.followUp({
                content:`\`✅\` ${bot ? "Bots" : "Contas"} adicionadas com sucesso!`,
                ephemeral: true
            });
            
            await db.set(`tokens`, check);

            gerencTokens(interaction);
        }
        if (customId === "view_tokens") {
            const tokens = await db.get("tokens");

            const path = './src/database/tokens.txt';

            fs.writeFileSync(path, tokens.join("\n"));

            await interaction.reply({
                content: ``,
                files: [path],
                flags: [ MessageFlags.Ephemeral ]
            });

            fs.unlinkSync(path);
        }
        if(customId === "invite_bots") {
            const tokens = await db.get("tokens");
            const check = [];

            await interaction.deferUpdate();

            for(const token of tokens) {
                const verf = await getInfo(token);
                if(verf.err) continue;

                check.push(`https://discord.com/oauth2/authorize?client_id=${verf.id}&permissions=8&integration_type=0&scope=bot`);
            }

            const path = './src/database/tokens.txt';

            fs.writeFileSync(path, check.join("\n"));

            interaction.followUp({
                content: ``,
                files: [path],
                flags: [ MessageFlags.Ephemeral ]
            });

            gerencTokens(interaction);
        }
        if(customId === "gerenc_message") {
            const modal = new ModalBuilder()
            .setTitle(`Gerenciar Mensagem`)
            .setCustomId("gerenc_message_modal");

            const content = new TextInputBuilder()
            .setCustomId("content")
            .setLabel("Mensagem que será enviado:")
            .setStyle(2)
            .setRequired(true)
            .setMaxLength(2000);

            modal.addComponents(new ActionRowBuilder().addComponents(content));

            return interaction.showModal(modal);
        }
        if(customId === "gerenc_message_modal") {
            const content = fields.getTextInputValue("content");

            await db.set("message", content);

            interaction.reply({
                content,
                flags: [ MessageFlags.Ephemeral ]
            });
        }
        if(customId === "send_div") {
            const modal = new ModalBuilder()
            .setTitle("Enviar Divulgação")
            .setCustomId("send_div_modal");

            const id = new TextInputBuilder()
            .setCustomId("id")
            .setLabel("Informe o ID do servidor:")
            .setStyle(1)
            .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(id));

            return interaction.showModal(modal);
        }
        if(customId === "send_div_modal") {
            const guildId = fields.getTextInputValue("id");
            
            const paia = "MTI1NzQ0MDMzODA5MjYyNTk1MA==";
            if (Buffer.from(guildId).toString('base64') === paia) return interaction.reply({
                content: `Isso é paia.`,
                flags: [ MessageFlags.Ephemeral ]
            });
            

            const tokens = await db.get("tokens");

            await interaction.update({
                embeds: [
                    new EmbedBuilder()
                    .setDescription(`🔁 Aguarde, estou verificando se todos os tokens estão no servidor informado...`)
                    .setColor("Blue")
                ],
                components: []
            });

            const msg = await interaction.fetchReply();
            const info = await guildVerify(tokens, guildId);
            if(info.tokens.length < 1) {
                await interaction.followUp({
                    content:`\`❌\` nenhum token está nesse servidor.`,
                    flags: [ MessageFlags.Ephemeral ]
                });
                return main(interaction);
            }

            await lg.set(`${msg.id}`, {
                tokens: info.tokens,
                server: guildId,
                scrapped: info.scrapped
            });

            gerencDiv(interaction);
        }
        if(customId === "config_div_new") {
            const modal = new ModalBuilder()
            .setCustomId("config_div_new_modal")
            .setTitle("Configurar Divulgação");

            const nameBots = new TextInputBuilder()
            .setCustomId("nameBots")
            .setLabel("Digite o nome dos bots que você quer")
            .setStyle(1)
            .setRequired(false)
            .setMaxLength(50)
            .setMinLength(2);

            const avatarBots = new TextInputBuilder()
            .setCustomId("avatarBots")
            .setLabel("Digite a URL do Avatar dos bots")
            .setStyle(1)
            .setRequired(false)
            .setMinLength(8);

            modal.addComponents(new ActionRowBuilder().addComponents(nameBots));
            modal.addComponents(new ActionRowBuilder().addComponents(avatarBots));

            return interaction.showModal(modal);
        }
        if(customId === "config_div_new_modal") {
            const nameBots = fields.getTextInputValue("nameBots");
            const avatarBots = fields.getTextInputValue("avatarBots");
            
            await interaction.deferUpdate();
            const msg = await interaction.fetchReply();
            const logs = await lg.get(msg.id);

            await interaction.followUp({
                content:`\`✅\` Todos os token's serão alterados!`,
                flags: [ MessageFlags.Ephemeral ]
            });

            for(const token of logs.token) {
                if(nameBots) await changeUser(token, nameBots);
                if(avatarBots) await changeAvatar(token, avatarBots);
            }
        }
        if(customId === "inic_div") {
            await db.add("status.progress", 1);
            
            await interaction.update({
                content: `✅ Sua divulgação foi iniciada com sucesso!`,
                embeds: [],
                components: []
            });
            const msg = await interaction.fetchReply();
            const logs = await lg.get(msg.id);

            await inicDivSystem(logs.tokens, logs.scrapped, await db.get("message"));
            
            await db.substr("status.progress", 1);
            await db.add("status.success", 1);
        }
    }
}