const { EmbedBuilder } = require("discord.js");
module.exports = {
    name: "pause",
    description: "Pauses the song.",
    aliases: [],

    run: async(client, message, args) => {
        const voiceChannel = message.member.voice.channel;
        if(!voiceChannel) {
            return message.reply({embeds: [new EmbedBuilder()
                .setDescription(':x: | You have to be in a voice channel to use this command.')
                .setColor('Random')]});
        }

        const player = client.manager.players.get(message.guild.id);
        if(!player || !player.playing) {
            return message.reply(":x: | I am not playing anything.");
        }

        try {
            await player.pause(true);
            return message.reply({embeds: [new EmbedBuilder()
                .setDescription("✅ | Song is paused.")
                .setColor('Random')]});
        } catch (error) {
            console.error(error);
            return message.reply({embeds: [new EmbedBuilder()
                .setDescription(`:x: | An error occurred!`)
                .setColor("Random")]});
        }
    },
};