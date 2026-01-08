/**
 * Hug Command - Send a random hug GIF to another user
 *
 * Usage: /hug @user
 */

import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from './types.js';
import { createRequire } from 'module';
import { getLocale, t } from '../utils/i18n.js';
import { addHugRequest, hasHugRequest, removeHugRequest } from '../services/hug-requests.js';

const require = createRequire(import.meta.url);
type HugGifsData = { hugs: string[] };
const hugGifsData = require('../data/gifs.json') as unknown as HugGifsData;

export const hugCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('hug')
    .setDescription('Send a warm hug to someone 🤗')
    .setDescriptionLocalizations({
      fr: "Envoyer un câlin chaleureux à quelqu'un 🤗",
    })
    .addUserOption((option) =>
      option
        .setName('user')
        .setNameLocalizations({
          fr: 'utilisateur',
        })
        .setDescription('Who do you want to hug?')
        .setDescriptionLocalizations({
          fr: 'Qui veux-tu câliner ?',
        })
        .setRequired(false),
    )
    .addRoleOption((option) =>
      option
        .setName('role')
        .setNameLocalizations({
          fr: 'rôle',
        })
        .setDescription('Mention a role to request a hug')
        .setDescriptionLocalizations({
          fr: 'Mentionner un rôle pour demander un câlin',
        })
        .setRequired(false),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const locale = getLocale(interaction.locale);
    const targetUser = interaction.options.getUser('user');
    const targetRole = interaction.options.getRole('role');

    // Validate immediately and respond fast
    const gifs = hugGifsData.hugs;
    const randomGif = gifs.length > 0 ? gifs[Math.floor(Math.random() * gifs.length)] : undefined;

    if (!randomGif) {
      await interaction.reply({
        content: t(locale, 'hug.noGifs'),
      });
      return;
    }

    // If role is specified, send a request message
    if (targetRole) {
      const embed = new EmbedBuilder()
        .setColor('#FFB6C1')
        .setTitle(t(locale, 'hug.roleRequest', { user: interaction.user.username }))
        .setImage(randomGif)
        .setFooter({ text: t(locale, 'hug.footer') });

      await interaction.reply({ content: `<@&${targetRole.id}>`, embeds: [embed] });
      return;
    }

    // If user targets themselves
    if (targetUser?.id === interaction.user.id) {
      await interaction.reply({
        content: t(locale, 'hug.selfHug'),
      });
      return;
    }

    // If no user and no role specified -> announce that the user is ready for a hug
    if (!targetUser && !targetRole) {
      // register hug request
      const guildId = interaction.guildId;
      if (guildId) {
        addHugRequest(guildId, interaction.user.id);
      }

      const embed = new EmbedBuilder()
        .setColor('#FFB6C1')
        .setDescription(t(locale, 'hug.requestAnnouncement', { user: interaction.user.username }))
        .setImage(randomGif)
        .setFooter({ text: t(locale, 'hug.footer') });

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // Send hug to user
    if (targetUser) {
      const guildId = interaction.guildId;
      if (guildId) {
        if (hasHugRequest(guildId, targetUser.id)) {
          // Accept the pending request
          removeHugRequest(guildId, targetUser.id);

          const embedAccepted = new EmbedBuilder()
            .setColor('#FFB6C1')
            .setTitle(t(locale, 'hug.acceptedTitle'))
            .setDescription(
              t(locale, 'hug.acceptedDescription', {
                sender: interaction.user.username,
                receiver: targetUser.username,
              }),
            )
            .setImage(randomGif)
            .setFooter({ text: t(locale, 'hug.footer') });

          await interaction.reply({ embeds: [embedAccepted] });
          return;
        }
      }

      // Regular hug when target didn't previously request one
      const embed = new EmbedBuilder()
        .setColor('#FFB6C1')
        .setTitle(
          t(locale, 'hug.embedTitle', {
            sender: interaction.user.username,
            receiver: targetUser.username,
          }),
        )
        .setImage(randomGif)
        .setFooter({ text: t(locale, 'hug.footer') });

      await interaction.reply({ embeds: [embed] });
      return;
    }
  },
};
