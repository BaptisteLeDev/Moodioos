/**
 * Mood Command - Main command for motivation, music & voice features
 *
 * Subcommands:
 * - want: Send random motivational compliment
 * - music: Get music recommendation
 * - say: Play "I love you" audio
 * - join: Make bot join voice channel
 */

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  VoiceChannel,
  ChannelType,
} from 'discord.js';

const EPHEMERAL_FLAG = 64;
import { Command } from './types.js';
import complimentsData from '../data/compliments.json' assert { type: 'json' };
import musicData from '../data/music-recommendations.json' assert { type: 'json' };
import { joinVoiceChannelSafe, playFileInGuild } from '../services/index.js';

type MusicRecommendation = {
  name: string;
  description: string;
  artists: string[];
  vibe: string;
  emoji: string;
};

export const moodCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('mood')
    .setDescription('Get motivation, music recommendations, or voice features')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('want')
        .setDescription('Get a random motivational compliment')
        .addStringOption((option) =>
          option
            .setName('type')
            .setDescription('Type of motivation')
            .setRequired(true)
            .addChoices(
              { name: '💪 Compliment', value: 'compliment' },
              { name: '🎵 Music Recommendation', value: 'music' },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('music')
        .setDescription('Get a music recommendation')
        .addStringOption((option) =>
          option
            .setName('genre')
            .setDescription('Music genre/vibe')
            .setRequired(false)
            .addChoices(
              { name: 'Lofi Hip Hop', value: 'lofi' },
              { name: 'Lo-Fi Jazz', value: 'lo-fi jazz' },
              { name: 'Indie Pop', value: 'indie pop' },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('say')
        .setDescription('Make bot say something special')
        .addStringOption((option) =>
          option
            .setName('message')
            .setDescription('What to say')
            .setRequired(true)
            .addChoices({ name: "💕 Je t'aime", value: 'love' }),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('join').setDescription('Make bot join your voice channel'),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === 'want') {
        const type = interaction.options.getString('type', true);
        return handleWantSubcommand(interaction, type);
      }

      if (subcommand === 'music') {
        const genre = interaction.options.getString('genre') ?? 'lofi';
        return handleMusicSubcommand(interaction, genre);
      }

      if (subcommand === 'say') {
        const message = interaction.options.getString('message', true);
        return handleSaySubcommand(interaction, message);
      }

      if (subcommand === 'join') {
        return handleJoinSubcommand(interaction);
      }
    } catch (error: unknown) {
      const e = error instanceof Error ? error : new Error(String(error));
      console.error(`Error executing mood subcommand "${subcommand}":`, e);
      await interaction.reply({
        content: 'An error occurred while processing your request. 😢',
        // use numeric flag for ephemeral response
        flags: EPHEMERAL_FLAG,
      });
    }
  },
};

/**
 * Handle /mood want subcommand
 */
async function handleWantSubcommand(interaction: ChatInputCommandInteraction, type: string) {
  if (type === 'compliment') {
    const compliments = complimentsData.compliments;
    const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];

    const embed = new EmbedBuilder()
      .setColor('#FF69B4')
      .setTitle('💪 Here is your Compliment!')
      .setDescription(randomCompliment ?? 'You are awesome! 🌟')
      .setFooter({ text: 'Remember, you are amazing!' });

    await interaction.reply({ embeds: [embed] });
  } else if (type === 'music') {
    return handleMusicSubcommand(interaction, 'lofi');
  }
}

/**
 * Handle /mood music subcommand
 */
async function handleMusicSubcommand(interaction: ChatInputCommandInteraction, genre: string) {
  const recommendations = (musicData.recommendations as MusicRecommendation[]).filter((rec) =>
    rec.name.toLowerCase().includes(genre.toLowerCase()),
  );

  if (recommendations.length === 0) {
    await interaction.reply({
      content: `No recommendations found for genre: ${genre}`,
      flags: EPHEMERAL_FLAG,
    });
    return;
  }

  const randomRec = recommendations[Math.floor(Math.random() * recommendations.length)];
  if (!randomRec) {
    await interaction.reply({
      content: 'No music recommendations available right now. Please try again later!',
      flags: EPHEMERAL_FLAG,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor('#1DB954')
    .setTitle(`${randomRec.emoji} ${randomRec.name.toUpperCase()} RECOMMENDATION`)
    .setDescription(randomRec.description)
    .addFields(
      { name: '🎤 Artists', value: randomRec.artists.join(', '), inline: false },
      { name: '✨ Vibe', value: randomRec.vibe, inline: false },
    )
    .setFooter({ text: 'Enjoy the music! 🎧' });

  await interaction.reply({ embeds: [embed] });
}

/**
 * Handle /mood say subcommand
 *
 * Note: MP3 playback requires voice connection
 * TODO: Implement actual MP3 playback via discord.js voice
 */
async function handleSaySubcommand(interaction: ChatInputCommandInteraction, message: string) {
  if (message === 'love') {
    const embed = new EmbedBuilder()
      .setColor('#FF1493')
      .setTitle('💕 The Bot Says:')
      .setDescription("**Je t'aime... 💕**")
      .setFooter({ text: 'A message full of love for you!' });

    await interaction.reply({ embeds: [embed] });
    // Try to play the MP3 file: join if needed then play
    try {
      const member = interaction.member;
      const voiceChannel = member && 'voice' in member ? member.voice?.channel : null;
      if (!voiceChannel) {
        // nothing to do, user not in voice
        return;
      }

      if (
        voiceChannel.type !== ChannelType.GuildVoice &&
        voiceChannel.type !== ChannelType.GuildStageVoice
      ) {
        return;
      }

      await joinVoiceChannelSafe(voiceChannel as VoiceChannel);
      if (interaction.guildId) {
        playFileInGuild(interaction.guildId, './src/assets/sounds/love.mp3');
      }
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      console.error('Error during playFile:', e);
      try {
        await interaction.followUp({
          content: '❌ Unable to play audio: ' + e.message,
          flags: EPHEMERAL_FLAG,
        });
      } catch (followErr) {
        console.error('Failed to followUp after play error:', followErr);
      }
    }
  }
}

/**
 * Handle /mood join subcommand
 */
async function handleJoinSubcommand(interaction: ChatInputCommandInteraction) {
  const member = interaction.member;
  // Ensure the interaction has a guild member with voice state
  if (!member || !('voice' in member)) {
    await interaction.reply({
      content: '❌ Unable to access voice state!',
      flags: EPHEMERAL_FLAG,
    });
    return;
  }

  const voiceChannel = member.voice?.channel;

  if (!voiceChannel) {
    await interaction.reply({
      content: '❌ You need to be in a voice channel for me to join!',
      flags: EPHEMERAL_FLAG,
    });
    return;
  }

  try {
    await interaction.deferReply({ flags: EPHEMERAL_FLAG });
    if (
      voiceChannel.type !== ChannelType.GuildVoice &&
      voiceChannel.type !== ChannelType.GuildStageVoice
    ) {
      throw new Error('Target channel is not a voice/stage channel');
    }

    await joinVoiceChannelSafe(voiceChannel as VoiceChannel);
    await interaction.editReply({
      content: `✅ Joined **${voiceChannel.name ?? 'voice channel'}**! 🎵`,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error joining voice channel:', err);
    // If already deferred/replied, edit reply; otherwise send a new ephemeral reply
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content: '❌ Failed to join voice channel. Make sure I have permission!',
        });
      } else {
        await interaction.reply({
          content: '❌ Failed to join voice channel. Make sure I have permission!',
          flags: EPHEMERAL_FLAG,
        });
      }
    } catch (replyErr: unknown) {
      console.error('Failed to notify user about join error:', replyErr);
    }
  }
}
