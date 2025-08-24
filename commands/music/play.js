const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getControlButtons, updateMusicControlButtons } = require("../../handler/music.js");
const config = require("../../config.json");

function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
        hours > 0 ? String(hours).padStart(2, '0') : null,
        String(minutes).padStart(2, '0'),
        String(seconds).padStart(2, '0')
    ].filter(Boolean).join(":");
}

module.exports = {
    name: "play",
    aliases: ["p"],
    description: "Play a song",

    run: async (client, message, args) => {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription(":x: | You must join a voice channel first!")
                    .setColor("Random")]
            });
        }

        const query = args.join(" ");
        if (!query) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription(":x: | Please provide a song name or URL!")
                    .setColor("Random")]
            });
        }

        try {
            const searchResult = await client.manager.search(query, { requester: message.author });
            if (!searchResult.tracks.length) {
                return message.reply({
                    embeds: [new EmbedBuilder()
                        .setDescription(":x: | No results found!")
                        .setColor("Random")]
                });
            }

            const player = await client.manager.createPlayer({
                guildId: message.guild.id,
                voiceId: voiceChannel.id,
                textId: message.channel.id,
                selfDeaf: true,
            });

            const isFirstPlay = !player.playing && !player.paused && !player.queue.current;

            if (searchResult.type === "PLAYLIST") {
                if (!isFirstPlay) {
                    return message.reply({
                        embeds: [new EmbedBuilder()
                            .setDescription("Music is already playing. Please use the **Add Song** button in the player to add more songs to the queue.")
                            .setColor("Yellow")]
                    });
                }
                player.queue.add(searchResult.tracks);
                await new Promise(res => setTimeout(res, 100));
                const replyMsg = await message.reply({
                    embeds: [new EmbedBuilder()
                        .setDescription(`✅ | Added playlist **${searchResult.playlistName}** with ${searchResult.tracks.length} songs to the queue.`)
                        .setColor("Random")],
                    components: getControlButtons(
                        false,
                        player.loop,
                        player.queue.size
                    )
                });
                setTimeout(async () => {
                    try {
                        await replyMsg.delete();
                    } catch {}
                }, !isFirstPlay ? 15000 : undefined);
                await updateMusicControlButtons(replyMsg, player);
            } else {
                if (!isFirstPlay) {
                    return message.reply({
                        embeds: [new EmbedBuilder()
                            .setDescription("Music is already playing. Please use the **Add Song** button in the player to add more songs to the queue.")
                            .setColor("Yellow")]
                    });
                }
                player.queue.add(searchResult.tracks[0]);
                await new Promise(res => setTimeout(res, 100));
                let track = player.queue.current || player.queue[0] || searchResult.tracks[0];
                // Ensure duration is calculated from track.info.length if needed
                let rawDuration = track.duration;
                if ((!rawDuration || isNaN(rawDuration) || rawDuration <= 0) && track.info && typeof track.info.length === "number") {
                    rawDuration = track.info.length;
                }
                if ((!rawDuration || isNaN(rawDuration) || rawDuration <= 0) && typeof track.length === "number") {
                    rawDuration = track.length;
                }
                const duration = formatDuration(rawDuration);
                const replyMsg = await message.reply({
                    embeds: [new EmbedBuilder()
                        .setDescription(`✅ | Music playback started with **${track.title}** . Duration: \`${duration}\``)
                        .setColor("Random")],
                });
            }

            if (!player.playing && !player.paused && !player.queue.size) player.play();
        } catch (error) {
            console.error(error);
            message.reply({
                embeds: [new EmbedBuilder()
                    .setDescription(":x: | An error occurred while trying to play the song!")
                    .setColor("Random")]
            });
        }
    }
};
