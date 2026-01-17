const { ApplicationCommandType, MessageFlags } = require("discord.js");
const { db, lg, owner } = require("../../database/index");
const { main } = require("../../functions/others/panelEmbeds");


module.exports = {
    name:"painel", 
    description:"[🤖] Utilize esse comando para gerenciar o seu painel de divulgação.", 
    type: ApplicationCommandType.ChatInput,
    run: async(client, interaction) => { 
        const { user, guild, channel } = interaction;
        if(user.id !== owner) return interaction.reply({
            content: `\`❌\` Você não tem permissão de usar este comando.`,
            flags: [ MessageFlags.Ephemeral ]
        });

        await interaction.deferReply({ flags: [ MessageFlags.Ephemeral ] });
        main(interaction);
    }
}