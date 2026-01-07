/**
 * Love Command - Send a random love GIF to another user
 *
 * Usage: /love @user
 */

import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from './types.js';
import { createRequire } from 'module';
import { getLocale, t } from '../utils/i18n.js';

const require = createRequire(import.meta.url);
type GifsData = { love: string[] };
const gifsData = require('../data/gifs.json') as unknown as GifsData;

export const loveCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('love')
    .setDescription('Send love to someone 💕')
    .addUserOption((option) =>
      option
        .setName('user')
        .setNameLocalizations({
          fr: 'utilisateur',
        })
        .setDescription('Who do you want to send love to?')
        .setDescriptionLocalizations({
          fr: "À qui veux-tu envoyer de l'amour ?",
        })
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const locale = getLocale(interaction.locale);
    const targetUser = interaction.options.getUser('user', true);

    const gifs = gifsData.love;
    const randomGif = gifs.length > 0 ? gifs[Math.floor(Math.random() * gifs.length)] : undefined;

    if (targetUser.id === interaction.user.id) {
      await interaction.reply({
        content: t(locale, 'love.selfLove'),
      });
      return;
    }

    if (!randomGif) {
      await interaction.reply({
        content: t(locale, 'love.noGifs'),
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor('#FF1493')
      .setTitle(
        t(locale, 'love.embedTitle', {
          sender: interaction.user.username,
          receiver: targetUser.username,
        }),
      )
      .setImage(randomGif)
      .setFooter({ text: t(locale, 'love.footer') });

    await interaction.reply({ embeds: [embed] });
  },
};
