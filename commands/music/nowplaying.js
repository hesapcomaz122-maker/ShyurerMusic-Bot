const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "nowplaying",
    description: "Displays the currently playing track.",
    aliases: ["np", "current"],

    run: async (client, message, args) => {
        const player = client.manager.players.get(message.guild.id);
        if (!player || !player.queue.current) {
            return message.reply(":x: | I am not playing anything.");
        }

        const track = player.queue.current;
        const currentTime = player.position;
        // Xử lý trường hợp track.duration không hợp lệ, thử lấy từ các thuộc tính khác
        let rawDuration = track.duration;
        if ((!rawDuration || isNaN(rawDuration) || rawDuration <= 0) && track.info && typeof track.info.length === "number") {
            rawDuration = track.info.length;
        }
        if ((!rawDuration || isNaN(rawDuration) || rawDuration <= 0) && typeof track.length === "number") {
            rawDuration = track.length;
        }

        let duration;
        if (track.isStream) {
            duration = "LIVE";
        } else if (typeof rawDuration === "number" && !isNaN(rawDuration) && rawDuration > 0) {
            duration = formatDuration(rawDuration);
        } else {
            duration = "NaN:NaN";
        }
        const currentDuration = formatDuration(currentTime);

        const embed = new EmbedBuilder()
            .setTitle("🎶 Now Playing")
            .setDescription(`[${track.title}](${track.uri})`)
            .addFields({ name: "Progress", value: `\`${currentDuration} / ${duration}\`` })
            .setColor("Random")
            .setThumbnail(track.thumbnail || "");

        message.channel.send({ embeds: [embed] });
    }
};

// Helper function
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
