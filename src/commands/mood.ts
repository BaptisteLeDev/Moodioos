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
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
type ComplimentsData = { compliments: string[] };
type MusicData = { recommendations: MusicRecommendation[] };
const complimentsData = require('../data/compliments.json') as unknown as ComplimentsData;
const musicData = require('../data/music-recommendations.json') as unknown as MusicData;
import { readdir } from 'fs/promises';
import fs from 'fs';
import path from 'path';
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
      subcommand
        .setName('play')
        .setDescription('Play a sound from the bot sound library')
        .addStringOption((option) =>
          option
            .setName('sound')
            .setDescription('Name of the sound to play (leave empty to list)')
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('join').setDescription('Make bot join your voice channel'),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand: string = interaction.options.getSubcommand();

    try {
      if (subcommand === 'want') {
        const type: string = interaction.options.getString('type', true);
        return handleWantSubcommand(interaction, type);
      }

      if (subcommand === 'music') {
        const genre: string = interaction.options.getString('genre') ?? 'lofi';
        return handleMusicSubcommand(interaction, genre);
      }

      if (subcommand === 'say') {
        const message: string = interaction.options.getString('message', true);
        return handleSaySubcommand(interaction, message);
      }

      if (subcommand === 'play') {
        const sound: string | null = interaction.options.getString('sound');
        return handlePlaySubcommand(interaction, sound ?? undefined);
      }

      if (subcommand === 'join') {
        return handleJoinSubcommand(interaction);
      }
    } catch (error: unknown) {
      const e: Error = error instanceof Error ? error : new Error(String(error));
      console.error(`Error executing mood subcommand "${subcommand}":`, e);
      await interaction.reply({
        content: 'An error occurred while processing your request. 😢',
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
  const recommendations = musicData.recommendations.filter((rec) =>
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
        const soundsDir = path.join(process.cwd(), 'src', 'assets', 'sounds');
        const opusPath = path.join(soundsDir, 'love.opus');
        if (!fs.existsSync(opusPath)) {
          await interaction.followUp({
            content:
              "Aucun fichier '.opus' trouvé pour 'love' — ajoutez 'src/assets/sounds/love.opus'.",
            flags: EPHEMERAL_FLAG,
          });
          return;
        }

        playFileInGuild(interaction.guildId, opusPath);
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
 * Handle /mood play subcommand
 * - If `soundName` is provided, attempt to play it
 * - Otherwise list available sounds
 */
async function handlePlaySubcommand(interaction: ChatInputCommandInteraction, soundName?: string) {
  const soundsDir = path.join(process.cwd(), 'src', 'assets', 'sounds');

  try {
    const files = await readdir(soundsDir);
    const soundFiles = files.filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return ['.opus', '.ogg', '.oga'].includes(ext);
    });

    if (soundFiles.length === 0) {
      await interaction.reply({
        content: 'Aucun son trouvé dans le dossier sounds.',
        flags: EPHEMERAL_FLAG,
      });
      return;
    }

    if (!soundName) {
      // list available sounds
      const list = soundFiles.map((f) => `- ${f}`).join('\n');
      await interaction.reply({ content: `Fichiers disponibles:\n${list}`, flags: EPHEMERAL_FLAG });
      return;
    }

    // Attempt to find matching file (allow name without extension)
    const match = soundFiles.find((f) => f === soundName || path.parse(f).name === soundName);
    if (!match) {
      await interaction.reply({ content: `Son non trouvé: ${soundName}`, flags: EPHEMERAL_FLAG });
      return;
    }

    // Ensure user is in voice
    const member = interaction.member;
    if (!member || !('voice' in member)) {
      await interaction.reply({
        content: "Impossible d'accéder à l'état vocal.",
        flags: EPHEMERAL_FLAG,
      });
      return;
    }

    const voiceChannel = member.voice?.channel;
    if (!voiceChannel) {
      await interaction.reply({
        content: 'Vous devez être dans un salon vocal pour que je joue un son.',
        flags: EPHEMERAL_FLAG,
      });
      return;
    }

    await interaction.deferReply({ flags: EPHEMERAL_FLAG });
    await joinVoiceChannelSafe(voiceChannel as VoiceChannel);
    const filePath = path.join(soundsDir, match);
    const ext = path.extname(filePath).toLowerCase();
    if (!['.opus', '.ogg', '.oga'].includes(ext)) {
      await interaction.editReply({
        content: `Format non supporté: ${ext}. Seuls .opus/.ogg sont pris en charge.`,
      });
      return;
    }

    playFileInGuild(interaction.guildId as string, filePath);
    await interaction.editReply({ content: `Lecture de **${match}** dans ${voiceChannel.name}` });
  } catch (err: unknown) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error('Error in handlePlaySubcommand:', e);
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: `Erreur lors de la lecture: ${e.message}` });
      } else {
        await interaction.reply({
          content: `Erreur lors de la lecture: ${e.message}`,
          flags: EPHEMERAL_FLAG,
        });
      }
    } catch (replyErr: unknown) {
      console.error('Failed to notify user after play error:', replyErr);
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
