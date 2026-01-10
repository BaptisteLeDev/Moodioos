import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from './types.js';
import { getLocale, t } from '../utils/i18n.js';

export const mpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('mp')
    .setDescription('Send a private message (DM) to a user')
    .setDescriptionLocalizations({ fr: 'Envoyer un message privé à un utilisateur' })
    .addUserOption((o) => o.setName('target').setDescription('Target user').setRequired(true))
    .addStringOption((o) =>
      o.setName('message').setDescription('Message content').setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const locale = getLocale(interaction.locale);
    const target = interaction.options.getUser('target', true);
    const message = interaction.options.getString('message', true);

    try {
      await target.send(message);
      await interaction.reply({
        content: t(locale, 'mp.sent', { target: target.username }),
        ephemeral: true,
      });
    } catch (err) {
      console.warn('Failed to send DM via /mp:', err);
      await interaction.reply({
        content: t(locale, 'mp.failed', { target: target.username }),
        ephemeral: true,
      });
    }
  },
};
