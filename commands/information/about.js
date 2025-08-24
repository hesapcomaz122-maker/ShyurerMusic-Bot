const { version: djsversion, EmbedBuilder } = require("discord.js");
const moment = require('moment');

module.exports = {
    name: "about",
    aliases: ["info"],
    description: "Shows Bot's information",

    run: async (client, message, args) => {
        function numberWithCommas(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
          let totalSeconds = (client.uptime / 1000);
          let days = Math.floor(totalSeconds / 86400);
          totalSeconds %= 86400;
          let hours = Math.floor(totalSeconds / 3600);
          totalSeconds %= 3600;
          let minutes = Math.floor(totalSeconds / 60);
          let seconds = Math.floor(totalSeconds % 60);
          let uptime = `${days} days, ${hours} hours, ${minutes} minutes and ${seconds} seconds`;
            
        const embed = new EmbedBuilder()
            .setColor('#8112df')
            .setTitle(`${client.user.username}'s Information`)
            .setThumbnail(client.user.displayAvatarURL())
            .addFields([
                { name: `🤖・${client.user.username}'s Tag:`, value: client.user.tag },
                { name: `🤖・${client.user.username}'s ID:`, value: client.user.id },
                { name: "🤖・Node.js:", value: process.version },
                { name: "🤖・Discord.js:", value: `v${djsversion}` },
                { name: "🤖・Uptime:", value: uptime },
                { name: "🤖・Commands Count:", value: `${client.commands.size}` },
                { name: "🤖・Servers Count:", value: numberWithCommas(client.guilds.cache.size) },
                { name: "🤖・Users Count:", value: numberWithCommas(client.guilds.cache.reduce((a,b) => a + b.memberCount, 0)) },
                { name: "🤖・Created at:", value: `${moment(client.user.createdTimestamp).format('LT')} ${moment(client.user.createdTimestamp).format('LL')} - (${moment(client.user.createdTimestamp).fromNow()})` },
                { name: "🤖・Website:", value: "[Shyur](https://www.shyur.xyz/)" },
                { name: "🤖・My Server", value: "[Derank](https://discord.gg/sBp5nZMJWe)\n[黄家](https://discord.gg/b3rPC24qE7)" }
            ])
            .setFooter({
                text: `Requested by ${message.author.username}`
            })
            .setTimestamp();

        message.reply({ embeds: [embed] }).catch((e) => {
            message.author.send(":x: | I don't have `SEND_MESSAGES` permission.").catch((e) => {

            });
        });
    },
};
