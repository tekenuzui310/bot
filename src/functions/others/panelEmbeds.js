const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { db, lg } = require("../../database/index");
const { getInfo, guildVerify } = require("../axios/discord");

async function main(interaction) {
    const status = await db.get("status");
    const { guild, user } = interaction;

    interaction.editReply({
        embeds: [
            new EmbedBuilder()
            .setAuthor({ name: `${guild.name} - Divulgação Tools`, iconURL: guild.iconURL() })
            .setDescription(`Boa tarde **${user.username}**, seja bem-vindo(a) ao nosso sistema de divulgação! Nosso sistema foi criado para impulsionar seu servidor automaticamente, alcançando mais membros sem esforço manual, Totalmente automizado, ele garante divulgação constante e eficaz em nossos canais parceiros. Ideal para quem quer crescer com facilidade e apoio completo em cada etapa.`)
            .setColor("#00FFFF")
            .addFields(
                {
                    name: "Informações",
                    value: `-# Creditos: \`whitex0424\`\n-# Discord: discord.gg/exemplo`,
                    inline: true
                },
                {
                    name: "Divulgações",
                    value: `-# Sucesso: ${status.success}\n-# Em Progresso: ${status.progress}`,
                    inline: true
                }
            )
            .setFooter({ text: `${guild.name} - Simplicadade e Eficiência ao seu alcance`, iconURL: guild.iconURL() })
        ],
        components: [
            new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setCustomId("send_div")
                .setLabel("Enviar Divulgação")
                .setStyle(3)
                .setEmoji("🚀"),
                new ButtonBuilder()
                .setCustomId("gerenc_message")
                .setLabel("Gerenciar Mensagem")
                .setStyle(2)
                .setEmoji("✏"),
                new ButtonBuilder()
                .setCustomId("gerenc_token")
                .setLabel("Gerenciar Tokens")
                .setStyle(2)
                .setEmoji("🚀"),
            )
        ]
    });
}

async function gerencTokens(interaction) {
    const tokens = await db.get("tokens");
    const { guild, user } = interaction;

    let verified = 0;
    for(const token of tokens) {
        const verf = await getInfo(token);
        if(verf.err) continue;
        verified++;
    }
    
    interaction.editReply({
        embeds: [
            new EmbedBuilder()
            .setAuthor({ name: `${guild.name} - Divulgação Tools`, iconURL: guild.iconURL() })
            .setDescription(`Boa tarde **${user.username}**, seja bem-vindo(a) ao nosso sistema de divulgação! Nosso sistema foi criado para impulsionar seu servidor automaticamente, alcançando mais membros sem esforço manual, Totalmente automizado, ele garante divulgação constante e eficaz em nossos canais parceiros. Ideal para quem quer crescer com facilidade e apoio completo em cada etapa.`)
            .setColor("#00FFFF")
            .addFields(
                {
                    name: "Tutorial Bot",
                    value: `1. Acesse o [Portal do Desenvolvedor](https://discord.dev)\n2. Crie um bot.\n3. Vá na aba BOT e reset o token`
                },
                {
                    name: "Tutorial Conta",
                    value: `1. Acesse o [site oficial do Discord](https://discord.com/)\n2. Clique em "Registrar"\n3. Preencha suas informações\n4. Logue na conta.\n5. Pegue seu token de Discord [Tutorial](https://www.youtube.com/watch?v=bMjXRDG3aHA&pp=ygUeQ29tbyBwZWdhciBvIHRva2VuIGRvIGRpc2NvcmQg)`
                },
                {
                    name: "Informações",
                    value: `-# Tokens Totais: \`${tokens.length}\`\n-# Tokens Válidos: \`${verified}\``
                }
            )
            .setFooter({ text: `${guild.name} - Simplicadade e Eficiência ao seu alcance`, iconURL: guild.iconURL() })
        ],
        components: [
            new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setCustomId("config_tokens")
                .setLabel("Gerenciar Tokens")
                .setStyle(1)
                .setEmoji("⚙"),
                new ButtonBuilder()
                .setCustomId("view_tokens")
                .setLabel("Ver Tokens")
                .setStyle(2)
                .setDisabled(tokens.length < 1)
                .setEmoji("📋"),
                new ButtonBuilder()
                .setCustomId("invite_bots")
                .setLabel("Convidar Bots")
                .setStyle(2)
                .setDisabled(tokens.filter(a => a.startsWith("Bot")).length < 1)
                .setEmoji("⚙"),
            ),
            new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setCustomId("voltar")
                .setLabel("Voltar")
                .setStyle(2)
                .setEmoji("⬅")
            )
        ]
    })
}

async function gerencDiv(interaction) {
    const { user, guild } = interaction;
    const msg = await interaction.fetchReply();
    const logs = await lg.get(msg.id);
    const status = await guildVerify(logs.tokens, logs.server);

    interaction.editReply({
        embeds: [
            new EmbedBuilder()
            .setAuthor({ name: `${guild.name} - Divulgação Tools`, iconURL: guild.iconURL() })
            .setColor("#00FFFF")
            .setDescription(`Olá! Abaixo estão algumas informações importantes sobre a divulgação que será realizada. Revise com atenção e configure tudo corretamente para evitar erros durante o processo!`)
            .addFields(
                {
                    name:"Informações",
                    value: `-# \`${logs.tokens.length}\` tokens disponiveis para uso neste servidor.`,
                    inline: true
                },
                {
                    name: "Informações do Servidor",
                    value: `-# Online: \`${status.Online.total}\`\n-# ├ Disponíveis: \`${status.Online.Disponiveis}\`\n-# ├ Ausentes: \`${status.Online.ausentes}\`\n-# └ Disponíveis: \`${status.Online["Não perturbe"]}\`\n-# Offlines: \`${status.Offlines}\`\n-# Total de membros: \`${status.membros}\``,
                    inline: true
                }
            )
            .setFooter({ text: `${guild.name} - Simplicadade e Eficiência ao seu alcance`, iconURL: guild.iconURL() })
        ],
        components: [
            new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setCustomId("inic_div")
                .setLabel("Iniciar Divulgação")
                .setStyle(3)
                .setEmoji("▶"),
                new ButtonBuilder()
                .setCustomId("config_div_new")
                .setLabel("Configurar Divulgação")
                .setStyle(2)
                .setEmoji("🔧")
            )
        ]
    });
}

module.exports = {
    main,
    gerencTokens,
    gerencDiv
}