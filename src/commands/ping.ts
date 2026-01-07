/**
 * Simple ping command to verify bot is responsive.
 */
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
} from 'discord.js';
import { Command } from './types.js';
import { getLocale, t } from '../utils/i18n.js';

export const pingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setNameLocalizations({
      fr: 'ping',
    })
    .setDescription('Test bot latency and response time')
    .setDescriptionLocalizations({
      fr: 'Tester la latence et le temps de réponse du bot',
    }),

  async execute(interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction) {
    if (interaction.isChatInputCommand()) {
      const locale = getLocale(interaction.locale);
      const sent = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });
      const latency = sent.createdTimestamp - interaction.createdTimestamp;
      const apiLatency = Math.round(interaction.client.ws.ping);

      await interaction.editReply(t(locale, 'ping.response', { latency, apiLatency }));
    }
  },
};
