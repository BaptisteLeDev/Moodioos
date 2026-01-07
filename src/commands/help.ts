/**
 * Help Command - Display bot information and available commands
 */

import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from './types.js';

export const helpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get help about Moodioos and available commands'),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🌟 Welcome to Moodioos!')
      .setDescription('Your personal wellness & motivation bot for Discord servers')
      .addFields(
        {
          name: '💪 /mood want <type>',
          value:
            'Get motivational content\n' +
            '  • `compliment` - Random motivational message\n' +
            '  • `music` - Music recommendation',
          inline: false,
        },
        {
          name: '🎵 /mood music [genre]',
          value:
            'Get a music recommendation\n' +
            '  • `lofi` - Lofi Hip Hop\n' +
            '  • `lo-fi jazz` - Smooth Jazz\n' +
            '  • `indie pop` - Feel-good tracks',
          inline: false,
        },
        {
          name: '💕 /mood say <message>',
          value: "Make the bot say something special\n  • `love` - Je t'aime message",
          inline: false,
        },
        {
          name: '🎧 /mood join',
          value: 'Make the bot join your voice channel',
          inline: false,
        },
        {
          name: '🤗 /hug @user',
          value: 'Send a warm hug with a cute GIF to someone',
          inline: false,
        },
        {
          name: '📊 /stats',
          value: 'View bot statistics and server information',
          inline: false,
        },
        {
          name: '❓ /help',
          value: 'Show this help message',
          inline: false,
        },
      )
      .setFooter({
        text: 'Made with 💕 for positive communities | /stats to see impact',
      });

    await interaction.reply({ embeds: [embed] });
  },
};
