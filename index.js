const { Client, Collection, GatewayIntentBits, ActivityType } = require("discord.js");
const { Shoukaku, Connectors } = require('shoukaku');
const { Kazagumo, Plugins } = require('kazagumo');
const fs = require('fs');
const path = require('path');
const { handleMusicButtonInteractions, registerPlayerTrackStartListener } = require("./handler/music.js");

const Shyurer = new Client({ 
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ] 
});

Shyurer.commands = new Collection();
Shyurer.aliases = new Collection();
Shyurer.config = require("./config.json");

const loadCommands = () => {
    const commandFolders = fs.readdirSync('./commands');
    for (const folder of commandFolders) {
        const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`./commands/${folder}/${file}`);
            if (command.name) {
                Shyurer.commands.set(command.name, command);
                if (command.aliases && Array.isArray(command.aliases)) {
                    command.aliases.forEach(alias => Shyurer.aliases.set(alias, command.name));
                }
            }
        }
    }
    console.log(`Loaded ${Shyurer.commands.size} commands`);
};

const Nodes = Shyurer.config.nodes;
let reconnectTimeout = null;
const RECONNECT_INTERVAL = 10000; // 10s, có thể chỉnh

function reconnectLavalink() {
    if (reconnectTimeout) return; // tránh reconnect nhiều lần
    console.warn('🔄 Attempting to reconnect Lavalink node...');
    reconnectTimeout = setTimeout(() => {
        Shyurer.manager.shoukaku.nodes.forEach(node => node.disconnect());
        Shyurer.manager.shoukaku.nodes.clear();
        // Tạo lại node
        Nodes.forEach(node => {
            Shyurer.manager.shoukaku.addNode(node);
        });
        reconnectTimeout = null;
    }, RECONNECT_INTERVAL);
}

Shyurer.manager = new Kazagumo({
    defaultSearchEngine: "youtube", 
    send: (guildId, payload) => {
    const guild = Shyurer.guilds.cache.get(guildId);
    if (guild) guild.shard.send(payload);
    },
    plugins: [new Plugins.PlayerMoved(Shyurer)],
}, new Connectors.DiscordJS(Shyurer), Nodes);

Shyurer.manager.shoukaku.on('ready', (name) => {
    console.log(`🟢 Node Connected: ${name}`);
    Shyurer.isLavalinkConnected = true;
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
});
Shyurer.manager.shoukaku.on('disconnect', (name, reason) => {
    console.warn(`🔴 Node Disconnected: ${reason}`);
    Shyurer.isLavalinkConnected = false;
    reconnectLavalink();
});
Shyurer.manager.shoukaku.on('error', (name, error) => {
    console.error(`🟡 Node Error [${name}]:`, error);
    Shyurer.isLavalinkConnected = false;
    reconnectLavalink();
});

Shyurer.manager.on("playerEmpty", (player) => {
    if (!player.destroyed) {
        const channel = Shyurer.channels.cache.get(player.textId);
        if (channel) {
            channel.send("✅ |  No more music - bot leaving the voice channel.");
        }
        player.destroy();
    }
});
Shyurer.manager.on("queueEnd", (player) => {
    if (!player.destroyed) {
        const channel = Shyurer.channels.cache.get(player.textId);
        if (channel) {
            channel.send("✅ | No more music - bot leaving the voice channel.");
        }
        player.destroy();
    }
});

Shyurer.on("ready", async () => {
    console.log(" ____  _                               ");
    console.log("/ ___|| |__  _   _ _   _ _ __ ___ _ __ ");
    console.log("\\___ \\| '_ \\| | | | | | | '__/ _ \\ '__|");
    console.log(" ___) | | | | |_| | |_| | | |  __/ |   ");
    console.log("|____/|_| |_|\\__, |\\__,_|_|  \\___|_|   ");
    console.log("             |___/                     ");
    console.log(`${Shyurer.user.tag} is now online!`);

    loadCommands();
    
    registerPlayerTrackStartListener(Shyurer);
    
    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } 

    let serverIn = numberWithCommas(Shyurer.guilds.cache.size);
    let totalMembers = numberWithCommas(Shyurer.guilds.cache.reduce((a,b) => a + b.memberCount, 0));

    Shyurer.user?.setPresence({
        status: "idle",
        activities: [
            {
                name: `${Shyurer.config.prefix}help || ${totalMembers} users in ${serverIn} servers`,
                type: ActivityType.Listening
            }
        ]
    });
});

Shyurer.on("messageCreate", async (message) => {
    try {
        if (message.channel.type === "dm") return;
        if (message.author.bot) return;
        if (!message.guild) return;
        if (!message.member) message.member = await message.guild.fetchMember(message);
        
    if (!message.content.startsWith(Shyurer.config.prefix)) return;
        
    const args = message.content.slice(Shyurer.config.prefix.length).trim().split(/ +/g);
        const cmd = args.shift().toLowerCase();
        
        if (cmd.length === 0) return;
        
        const command = Shyurer.commands.get(cmd) || Shyurer.commands.get(Shyurer.aliases.get(cmd));
        if (!command) return;

        // Kiểm tra node lavalink online trước khi chạy lệnh nhạc
        const musicCommands = ['play', 'skip', 'stop', 'pause', 'resume', 'queue', 'np', 'remove', 'seek', 'volume'];
        if (musicCommands.includes(cmd) && !Shyurer.isLavalinkConnected) {
            return message.reply('❌ | Không thể kết nối tới máy chủ nhạc (Lavalink). Vui lòng thử lại sau!');
        }

        await command.run(Shyurer, message, args);
    } catch (error) {
        console.error(`Error executing command: ${error}`);
        message.reply('There was an error executing that command!').catch(console.error);
    }
});

Shyurer.on('raw', (d) => {
    if (d.t === "VOICE_STATE_UPDATE" || d.t === "VOICE_SERVER_UPDATE") {
    const player = Shyurer.manager.players.get(d.d.guild_id);
        if (!player) return;
        try {
            if (player.connection) {
                player.connection.setStateUpdate(d);
            }
        } catch (error) {
            console.error('Error updating voice state:', error);
        }
    }
});

Shyurer.on('voiceStateUpdate', async (oldState, newState) => {
    try {
    const player = Shyurer.manager.players.get(oldState.guild.id);
        if (!player) return;

    if (oldState.id === Shyurer.user.id && !newState.channelId) {
            if (!player.destroyed) {
                try {
                    await player.destroy();
                } catch (err) {
                }
            }
            return;
        }

        if (oldState.channel && oldState.channel.id === player.voiceId) {
            const members = oldState.channel.members.filter(m => !m.user.bot);
            if (members.size === 0 && !player.destroyed) {
                try {
                    await player.destroy();
                } catch (err) {
                }
            }
        }
    } catch (error) {
        console.error('Voice state update error:', error);
    }
});

Shyurer.on('interactionCreate', async (interaction) => {
    await handleMusicButtonInteractions(Shyurer, interaction);
});

Shyurer.login("MTQ2MjQ2NDI1MjkwMzQyNDE4NA.GqxiEH.eFVJyHzpgPyweRNPerSBeIdDcnQmE6oE3wYC5o");


