const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "help",
    aliases: ["h"],
    run: async (client, message, args) => {
        if (!args[0]) {
            const BotInfo = new EmbedBuilder()
                .setTitle('Commands Help')
                .setDescription(`
                    **Prefix:** \`${client.config.prefix}\`
                    For more info about a command, type \`${client.config.prefix}help <command>\`
                `)
                .addFields([
                    { name: '🎵 Music', value: '`play`, `skip`, `stop`, `queue`, `pause`, `resume`' },
                    { name: '📜 Information', value: '`help`, `ping`, `about`' }
                ])
                .setColor('Random')
                .setTimestamp();

            return message.channel.send({ embeds: [BotInfo] });
        }

        const commandName = args[0].toLowerCase();
        const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        if (!command) {
            return message.reply('Invalid command name!');
        }

        const helpEmbed = new EmbedBuilder()
            .setTitle(`Help - ${command.name}`)
            .setDescription(`
                **Description:** ${command.description || 'No description available.'}
                **Usage:** \`${client.config.prefix}${command.name} ${command.usage || ''}\`
                **Aliases:** ${command.aliases ? command.aliases.join(', ') : 'None'}
            `)
            .setColor('Random')
            .setTimestamp();

        message.channel.send({ embeds: [helpEmbed] });
    }
};
