const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");

module.exports = {
    name: "invite",
    aliases: ["invite-me"],
    description: "Gives invite link",
    run: async(client, message, args) => {
      const button = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel('Invite me')
                .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=2159036672&scope=bot%20applications.commands`)
                .setStyle("Link"),
        );

    const inviteembed = new EmbedBuilder()
        .setColor('Random')
        .setTitle(`Invite ${client.user.username} now`)
        .setImage(client.user.displayAvatarURL())
        .setFooter({
            text: `${client.user.username}`, 
            iconURL: client.user.displayAvatarURL({dynamic: true})
        });

    message.reply({embeds: [inviteembed], components: [button]}).catch((e) => {
      message.author.send(":x: | I don't have `SEND_MESSAGES` permission.").catch((e) => {

      });
  });
}
}
