const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "loop",
    description: "Toggle loop mode.",
    aliases: ["l"],

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
                    .setDescription(':x: | There is no music playing.')
                    .setColor('Random')]
            });
        }

        if (message.guild.members.me.voice.channel &&
            message.member.voice.channel.id !== message.guild.members.me.voice.channel.id) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription(':x: | You need to be in the same voice channel as me to toggle loop mode.')
                    .setColor('Random')]
            });
        }

        try {
            let mode = player.loop;
            mode = mode === "none" ? "track" : mode === "track" ? "queue" : "none";
            player.setLoop(mode);

            return message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription(`✅ | Loop mode set to **${mode === "track" ? "This Song" : mode === "queue" ? "All Queue" : "Off"}**`)
                    .setColor('Random')]
            });
        } catch (error) {
            console.error(error);
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription(':x: | An error occurred while setting loop mode!')
                    .setColor('Random')]
            });
        }
    },
};