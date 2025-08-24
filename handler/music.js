const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType } = require("discord.js");

function getControlButtons(isPaused = false, loopMode = "none", queueLength = 0) {
    // loopMode: "none" | "track" | "queue"
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('pause')
            .setLabel(isPaused ? 'Resume' : 'Pause')
            .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('stop').setLabel('Stop').setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('addsong')
            .setLabel('Add Song')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('skip')
            .setLabel('Skip')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(queueLength === 0)
    );
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('loop')
            .setLabel('Loop')
            .setStyle(loopMode !== "none" ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('queue')
            .setLabel('Queue')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('nowplaying')
            .setLabel('Now Playing')
            .setStyle(ButtonStyle.Primary)
    );
    return [row1, row2];
}

function getDisabledControlButtons() {
    const [row1, row2] = getControlButtons();
    row1.components.forEach(btn => btn.setDisabled(true));
    row2.components.forEach(btn => btn.setDisabled(true));
    return [row1, row2];
}

async function handleMusicButtonInteractions(client, interaction) {
    if (interaction.isButton()) {
        const { guild, member, customId, message } = interaction;
        const player = client.manager.players.get(guild.id);

        const validIds = ['pause', 'stop', 'skip', 'loop', 'queue', 'nowplaying', 'addsong'];
        if (!validIds.includes(customId)) return;

        if (!member.voice.channel || (guild.members.me.voice.channel && member.voice.channel.id !== guild.members.me.voice.channel.id)) {
            return interaction.reply({ content: ":x: | You must be in the same voice channel as the bot to use these controls.", flags: 64 });
        }
        if (!player) {
            return interaction.reply({ content: ":x: | No music is playing.", flags: 64 });
        }

        try {
            switch (customId) {
                case 'pause': {
                    let isPaused = !player.paused;
                    player.pause(isPaused);
                    if (interaction.message && interaction.message.editable) {
                        await updateMusicControlButtons(interaction.message, player);
                    }
                    await interaction.reply({ content: isPaused ? "⏸️ | Paused playback." : "▶️ | Resumed playback.", flags: 64 });
                    break;
                }
                case 'stop':
                    player.queue.clear();
                    player.destroy();
                    await interaction.reply({ content: "⏹️ | Stopped and left the voice channel.", flags: 64 });
                    break;
                case 'skip':
                    if (player.queue.size === 0) {
                        await interaction.reply({ content: ":x: | No next song in the queue.", flags: 64 });
                    } else {
                        if (interaction.message && interaction.message.editable) {
                            await interaction.message.edit({
                                components: getDisabledControlButtons()
                            });
                        }
                        
                        player.skip();
                        await interaction.reply({ content: "⏭️ | Skipped the current song.", flags: 64 });
                    }
                    break;
                case 'loop': {
                    let mode = player.loop;
                    mode = mode === "none" ? "track" : mode === "track" ? "queue" : "none";
                    player.setLoop(mode);
                    if (interaction.message && interaction.message.editable) {
                        await updateMusicControlButtons(interaction.message, player);
                    }
                    await interaction.reply({ content: `🔁 | Loop mode set to **${mode === "track" ? "This Song" : mode === "queue" ? "All Queue" : "Off"}**`, flags: 64 });
                    break;
                }
                case 'queue':
                    if (!player.queue.length) {
                        await interaction.reply({ content: ":x: | Queue is empty.", flags: 64 });
                    } else {
                        const queueMsg = player.queue.map((track, i) => `**${i + 1}.** ${track.title} - \`${track.duration}\``).join("\n").slice(0, 2000);
                        await interaction.reply({ content: queueMsg, flags: 64 });
                    }
                    break;
                case 'nowplaying':
                    if (!player.queue.current) {
                        await interaction.reply({ content: ":x: | I am not playing anything.", flags: 64 });
                    } else {
                        const track = player.queue.current;
                        const currentTime = player.position;
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

                        await interaction.reply({ embeds: [embed], flags: 64 });
                    }
                    break;
                case 'addsong': {
                    const modal = new ModalBuilder()
                        .setCustomId('addsong_modal')
                        .setTitle('Add Song to Queue')
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('song_query')
                                    .setLabel('Song name or URL')
                                    .setStyle(TextInputStyle.Short)
                                    .setPlaceholder('Enter song name or link...')
                                    .setRequired(true)
                            )
                        );
                    await interaction.showModal(modal);
                    break;
                }
                default:
                    await interaction.reply({ content: ":x: | Unknown button.", flags: 64 });
            }
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: ":x: | An error occurred while processing the button.", flags: 64 });
        }
    } else if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'addsong_modal') {
        const { guild, member } = interaction;
        const player = client.manager.players.get(guild.id);
        if (!member.voice.channel || (guild.members.me.voice.channel && member.voice.channel.id !== guild.members.me.voice.channel.id)) {
            return interaction.reply({ content: ":x: | You must be in the same voice channel as the bot to use these controls.", flags: 64 });
        }
        if (!player) {
            return interaction.reply({ content: ":x: | No music is playing.", flags: 64 });
        }
        const query = interaction.fields.getTextInputValue('song_query');
        try {
            const searchResult = await client.manager.search(query, { requester: member.user });
            if (!searchResult.tracks.length) {
                return interaction.reply({ content: ":x: | No results found!", flags: 64 });
            }
            if (searchResult.type === "PLAYLIST") {
                player.queue.add(searchResult.tracks);
                await interaction.reply(`Added **${searchResult.tracks.length}** to queue.`);
            } else {
                const track = searchResult.tracks[0];
                player.queue.add(track);
                await interaction.reply(`Added **${track.title}** to queue.`);
            }
            if (interaction.message && interaction.message.editable) {
                await updateMusicControlButtons(interaction.message, player);
            }
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: ":x: | An error occurred while adding the song.", flags: 64 });
        }
    }
}

async function updateMusicControlButtons(message, player) {
    try {
        await message.edit({
            components: getControlButtons(
                player.paused,
                player.loop,
                player.queue.size
            )
        });
    } catch (e) {
        // ignore
    }
}

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

function registerPlayerTrackStartListener(client) {
    client.manager.on("playerStart", async (player, track) => {
        const channel = client.channels.cache.get(player.textId);
        if (!channel) return;

        try {
            const info = track.info || track;
            const requester = info.requester ? `<@${info.requester.id || info.requester}>` : "Unknown";

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: 'Playing ...',
                    iconURL: "https://cdn.discordapp.com/emojis/763415718271385610.gif",
                    url: client.config?.SupportServer || "https://discord.com"
                })
                .setFooter({ text: `ShyurerMusic`, iconURL: "https://cdn.discordapp.com/emojis/900257798003240961.gif" })
                .setTimestamp()
                .setDescription(
                    `- **Title:** [${info.title || "Unknown"}](${info.uri || ""})\n` +
                    `- **Artist:** ${info.author || 'Unknown Artist'}\n` +
                    `- **Time:** ${track.isStream ? "LIVE" : formatDuration(info.length || 0)}\n` +
                    `- **Requester:** ${requester}`
                )
                .setThumbnail(info.thumbnail || "")
                .setColor('Random');

            await channel.send({
                embeds: [embed],
                components: getControlButtons(player.paused, player.loop, player.queue.size)
            });
        } catch (err) {
            console.error("Failed to send embed on track start:", err);
        }
    });

    client.manager.on("playerEnd", async (player) => {
        const channel = client.channels.cache.get(player.textId);
        if (!channel) return;
        try {
            const messages = await channel.messages.fetch({ limit: 5 });
            const controlMsg = messages.find(m => m.author.id === client.user.id && m.components?.length);
            if (!controlMsg) return;
            await controlMsg.edit({
                components: getDisabledControlButtons()
            });
        } catch (err) {
            // ignore
        }
    });

    client.manager.on("playerDestroy", async (player) => {
        const channel = client.channels.cache.get(player.textId);
        if (!channel) return;
        try {
            const messages = await channel.messages.fetch({ limit: 5 });
            const controlMsg = messages.find(m => m.author.id === client.user.id && m.components?.length);
            if (!controlMsg) return;
            await controlMsg.edit({
                components: getDisabledControlButtons()
            });
        } catch (err) {
            // ignore
        }
    });
}

module.exports = { getControlButtons, handleMusicButtonInteractions, updateMusicControlButtons, registerPlayerTrackStartListener };
