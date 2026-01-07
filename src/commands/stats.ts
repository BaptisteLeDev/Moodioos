/**
 * Stats Command - Display bot statistics and guild information
 */

import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from './types.js';

export const statsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View Moodioos statistics and impact'),

  async execute(interaction: ChatInputCommandInteraction) {
    const client = interaction.client;

    const guildCount = client.guilds.cache.size;
    const userCount = client.users.cache.size;
    const uptime = client.uptime || 0;
    const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
    const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('📊 Moodioos Statistics')
      .setDescription('Live bot performance and impact metrics')
      .addFields(
        {
          name: '🏘️ Servers',
          value: `${guildCount} server${guildCount !== 1 ? 's' : ''}`,
          inline: true,
        },
        {
          name: '👥 Users',
          value: `${userCount} user${userCount !== 1 ? 's' : ''}`,
          inline: true,
        },
        {
          name: '⏱️ Uptime',
          value: `${uptimeHours}h ${uptimeMinutes}m`,
          inline: true,
        },
        {
          name: '🌍 Impact',
          value: `Spreading positivity across ${guildCount} communities! 💕`,
          inline: false,
        },
      )
      .setFooter({
        text: `Current Guild: ${interaction.guildId ?? 'DM'} | Spread the vibes! 🌟`,
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
