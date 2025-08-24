const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "disconnect",
    aliases: ["leave", "dc"],
    description: "Leaves the voice channel.",

    run: async (client, message, args) => {
        const voiceChannel = message.member?.voice?.channel;
        if (!voiceChannel) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription(":x: | You must be in a voice channel!")
                    .setColor("Random")]
            });
        }

        const player = client.manager.players.get(message.guild.id);
        if (!player) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription(":x: | I am not connected to a voice channel!")
                    .setColor("Random")]
            });
        }

        if (message.guild.members.me.voice.channel &&
            message.member.voice.channel.id !== message.guild.members.me.voice.channel.id) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription(":x: | You need to be in the same voice channel as me to disconnect me!")
                    .setColor("Random")]
            });
        }

        try {
            player.destroy();
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription("✅ | Left the voice channel.")
                    .setColor("Random")]
            });
        } catch (error) {
            console.error(error);
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription(":x: | An error occurred while trying to leave the voice channel!")
                    .setColor("Random")]
            });
        }
    }
};