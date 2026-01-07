/**
 * Stats Command - Display bot statistics and guild information
 */

import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from './types.js';
import { getLocale, t, tp } from '../utils/i18n.js';

export const statsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View Moodioos statistics and impact')
    .setDescriptionLocalizations({
      fr: "Voir les statistiques et l'impact de Moodioos",
    }),

  async execute(interaction: ChatInputCommandInteraction) {
    const locale = getLocale(interaction.locale);
    const client = interaction.client;

    const guildCount = client.guilds.cache.size;
    const userCount = client.users.cache.size;
    const uptime = client.uptime || 0;
    const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
    const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle(t(locale, 'stats.title'))
      .setDescription(t(locale, 'stats.embedDescription'))
      .addFields(
        {
          name: t(locale, 'stats.servers'),
          value: tp(locale, 'stats.serversValue', guildCount, { count: guildCount }),
          inline: true,
        },
        {
          name: t(locale, 'stats.users'),
          value: tp(locale, 'stats.usersValue', userCount, { count: userCount }),
          inline: true,
        },
        {
          name: t(locale, 'stats.uptime'),
          value: t(locale, 'stats.uptimeValue', { hours: uptimeHours, minutes: uptimeMinutes }),
          inline: true,
        },
        {
          name: t(locale, 'stats.impact'),
          value: t(locale, 'stats.impactValue', { count: guildCount }),
          inline: false,
        },
      )
      .setFooter({
        text: t(locale, 'stats.footer'),
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
