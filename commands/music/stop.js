const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "stop",
    description: "Stops the song.",
    aliases: [],

    run: async (client, message, args) => {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription(':x: | You need to be in a voice channel to use this command.')
                    .setColor('Random')]
            });
        }

        const player = client.manager.players.get(message.guild.id);
        if (!player) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription(":x: | There is no music playing.")
                    .setColor('Random')]
            });
        }

        if (message.guild.members.me.voice.channel &&
            message.member.voice.channel.id !== message.guild.members.me.voice.channel.id) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription(':x: | You need to be in the same voice channel as me to stop the music.')
                    .setColor('Random')]
            });
        }

        try {
            player.queue.clear();
            player.destroy();
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription("✅ | Stopped the music and left the voice channel.")
                    .setColor('Random')]
            });
        } catch (error) {
            console.error(error);
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription(`:x: | An error occurred: ${error.message}`)
                    .setColor("Random")]
            });
        }
    }
};