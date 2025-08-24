const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "skip",
  description: "Skips the current song.",
  aliases: [],

  run: async (client, message, args) => {
    try {
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
            .setDescription(':x: | You need to be in the same voice channel as me to skip the song.')
            .setColor('Random')]
        });
      }

      if (!player.queue.current) {
        return message.reply({
          embeds: [new EmbedBuilder()
            .setDescription(':x: | There is no song currently playing.')
            .setColor('Random')]
        });
      }

      if (player.queue.size === 0) {
        return message.reply({
          embeds: [new EmbedBuilder()
            .setDescription(':x: | There is no next song in the queue to skip to.')
            .setColor('Random')]
        });
      }

      player.skip();
      return message.reply({
        embeds: [new EmbedBuilder()
          .setDescription('✅ | Skipped the current song.')
          .setColor('Random')]
      });
    } catch (error) {
      console.error(error);
      return message.reply({
        embeds: [new EmbedBuilder()
          .setDescription(`:x: | An error occurred: ${error.message}`)
          .setColor('Random')]
      });
    }
  },
};