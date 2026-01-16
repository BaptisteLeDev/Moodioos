import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { Command } from './types.js';
import { getLocale, t } from '../utils/i18n.js';
import { addScheduledMessage } from '../services/scheduled-messages.js';

export const scheduleCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('Schedule a DM to a user at a specific UTC date/time (ISO 8601)')
    .setDescriptionLocalizations({ fr: 'Planifier un MP à une date/heure UTC précise (ISO 8601)' })
    .addUserOption((o) => o.setName('target').setDescription('Target user').setRequired(true))
    .addStringOption((o) =>
      o
        .setName('datetime')
        .setDescription('Send date/time in ISO 8601 UTC (e.g. 2026-01-15T09:00:00Z)')
        .setRequired(true),
    )
    .addStringOption((o) =>
      o.setName('message').setDescription('Message content').setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const locale = getLocale(interaction.locale);
    const target = interaction.options.getUser('target', true);
    const datetime = interaction.options.getString('datetime', true);
    const message = interaction.options.getString('message', true);

    // Validate ISO date
    const parsed = Date.parse(datetime);
    if (Number.isNaN(parsed)) {
      await interaction.reply({ content: t(locale, 'schedule.invalidDate'), flags: MessageFlags.Ephemeral });
      return;
    }

    // Enforce UTC value via ISO string
    const iso = new Date(parsed).toISOString();

    // For MVP we store in lightweight JSON file (UTC)
    try {
      const record = await addScheduledMessage({
        targetUserId: target.id,
        content: message,
        sendAt: iso,
        creatorId: interaction.user.id,
      });
      await interaction.reply({
        content: t(locale, 'schedule.scheduled', { id: record.id, when: iso }),
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      console.error('Failed to schedule message:', err);
      await interaction.reply({ content: t(locale, 'schedule.failed'), flags: MessageFlags.Ephemeral });
    }
  },
};
