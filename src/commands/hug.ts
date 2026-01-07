/**
 * Hug Command - Send a random hug GIF to another user
 *
 * Usage: /hug @user
 */

import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from './types.js';
import hugGifsData from '../data/hug-gifs.json' assert { type: 'json' };

export const hugCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('hug')
    .setDescription('Send a warm hug to someone 🤗')
    .addUserOption((option) =>
      option.setName('user').setDescription('Who do you want to hug?').setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser('user', true);

    if (targetUser.id === interaction.user.id) {
      await interaction.reply({
        content: "You are hugging yourself! 🤗 That's self-love, and we love that!",
      });
      return;
    }

    const gifs = hugGifsData.hugs;
    if (!gifs.length) {
      await interaction.reply({
        content: 'No hug GIFs available right now. Please try again later!',
      });
      return;
    }

    const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
    if (!randomGif) {
      await interaction.reply({
        content: 'No hug GIFs available right now. Please try again later!',
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor('#FFB6C1')
      .setTitle(`🤗 ${interaction.user.username} sends a hug to ${targetUser.username}!`)
      .setImage(randomGif)
      .setFooter({ text: 'Warm vibes incoming! 💕' });

    await interaction.reply({ embeds: [embed] });
  },
};
