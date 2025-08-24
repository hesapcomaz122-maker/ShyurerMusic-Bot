const { EmbedBuilder } = require("discord.js");
module.exports = {
    name: "queue",
    description: "Shows queue in the server.",
    aliases: ["q"],

    run: async(client, message, args) => {
        const player = client.manager.players.get(message.guild.id);
        if(!player || !player.queue.length) {
            return message.reply(":x: | I am not playing anything.");
        }

        const queue = player.queue.map((track, i) => {
            return `**${i + 1}.** ${track.title} - \`${track.duration}\``;
        }).join("\n");

        return message.reply({embeds: [new EmbedBuilder()
            .setDescription(queue)
            .setColor('Random')]});
    },
};