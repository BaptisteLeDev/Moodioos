/**
 * Mood Command - Main command for motivation, music & voice features
 *
 * Subcommands:
 * - want: Send random motivational compliment
 * - music: Get music recommendation
 * - say: Play "I love you" audio
 * - join: Make bot join voice channel
 * - config: Configure bot settings per guild
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
import { getLocale, t } from '../utils/i18n.js';
import { setGuildLanguage } from '../services/guild-config.js';

const require = createRequire(import.meta.url);
type ComplimentsData = { compliments: string[] };
type MusicData = { recommendations: MusicRecommendation[] };
const complimentsData = require('../data/compliments.json') as unknown as ComplimentsData;
const musicData = require('../data/music-recommendations.json') as unknown as MusicData;
import { readdir } from 'fs/promises';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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
    .setDescriptionLocalizations({
      fr: 'Obtenir de la motivation, des recommandations musicales ou des fonctionnalités vocales',
    })
    .addSubcommand((subcommand) =>
      subcommand
        .setName('want')
        .setDescription('Get a random motivational compliment')
        .setDescriptionLocalizations({
          fr: 'Recevoir un compliment motivant aléatoire',
        })
        .addStringOption((option) =>
          option
            .setName('type')
            .setDescription('Type of motivation')
            .setDescriptionLocalizations({
              fr: 'Type de motivation',
            })
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
        .setDescriptionLocalizations({
          fr: 'Obtenir une recommandation musicale',
        })
        .addStringOption((option) =>
          option
            .setName('genre')
            .setDescription('Music genre/vibe')
            .setDescriptionLocalizations({
              fr: 'Genre/ambiance musicale',
            })
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
        .setDescriptionLocalizations({
          fr: 'Faire dire quelque chose de spécial au bot',
        })
        .addStringOption((option) =>
          option
            .setName('message')
            .setDescription('What to say')
            .setDescriptionLocalizations({
              fr: 'Quoi dire',
            })
            .setRequired(true)
            .addChoices(
              { name: '💕 I love you', value: 'love' },
              { name: '💪 Motivation boost', value: 'motivation' },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('play')
        .setDescription('Play a sound from the bot sound library')
        .setDescriptionLocalizations({
          fr: 'Jouer un son de la bibliothèque de sons du bot',
        })
        .addStringOption((option) =>
          option
            .setName('sound')
            .setDescription('Name of the sound to play (leave empty to list)')
            .setDescriptionLocalizations({
              fr: 'Nom du son à jouer (laisser vide pour lister)',
            })
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('join')
        .setDescription('Make bot join your voice channel')
        .setDescriptionLocalizations({
          fr: 'Faire rejoindre le bot dans votre salon vocal',
        }),
    )
    .addSubcommandGroup((group) =>
      group
        .setName('config')
        .setDescription('Configure Moodioos settings for this server')
        .setDescriptionLocalizations({
          fr: 'Configurer les paramètres de Moodioos pour ce serveur',
        })
        .addSubcommand((sub) =>
          sub
            .setName('lang-set')
            .setDescription('Set the bot language for this server')
            .setDescriptionLocalizations({
              fr: 'Définir la langue du bot pour ce serveur',
            })
            .addStringOption((option) =>
              option
                .setName('language')
                .setNameLocalizations({
                  fr: 'langue',
                })
                .setDescription('Language code: en or fr')
                .setDescriptionLocalizations({
                  fr: 'Code de langue : en ou fr',
                })
                .setRequired(true)
                .addChoices(
                  { name: '🇬🇧 English', value: 'en', name_localizations: { fr: '🇬🇧 Anglais' } },
                  {
                    name: '🇫🇷 Français',
                    value: 'fr',
                    name_localizations: { fr: '🇫🇷 Français' },
                  },
                ),
            ),
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand: string = interaction.options.getSubcommand();
    const subcommandGroup: string | null = interaction.options.getSubcommandGroup();

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

      if (subcommandGroup === 'config') {
        if (subcommand === 'lang-set') {
          const language: string = interaction.options.getString('language', true);
          return handleConfigLangSet(interaction, language);
        }
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
  const locale = getLocale(interaction.locale);

  if (type === 'compliment') {
    const compliments = complimentsData.compliments;
    const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];

    const embed = new EmbedBuilder()
      .setColor('#FF69B4')
      .setTitle(t(locale, 'mood.want.embedTitle'))
      .setDescription(randomCompliment ?? t(locale, 'mood.want.embedDefault'))
      .setFooter({ text: t(locale, 'mood.want.footer') });

    await interaction.reply({ embeds: [embed] });
  } else if (type === 'music') {
    return handleMusicSubcommand(interaction, 'lofi');
  }
}

/**
 * Handle /mood music subcommand
 */
async function handleMusicSubcommand(interaction: ChatInputCommandInteraction, genre: string) {
  const locale = getLocale(interaction.locale);
  const recommendations = musicData.recommendations.filter((rec) =>
    rec.name.toLowerCase().includes(genre.toLowerCase()),
  );

  if (recommendations.length === 0) {
    await interaction.reply({
      content: t(locale, 'mood.music.noRecommendations', { genre }),
      flags: EPHEMERAL_FLAG,
    });
    return;
  }

  const randomRec = recommendations[Math.floor(Math.random() * recommendations.length)];
  if (!randomRec) {
    await interaction.reply({
      content: t(locale, 'mood.music.noAvailable'),
      flags: EPHEMERAL_FLAG,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor('#1DB954')
    .setTitle(
      t(locale, 'mood.music.embedTitle', {
        emoji: randomRec.emoji,
        name: randomRec.name.toUpperCase(),
      }),
    )
    .setDescription(randomRec.description)
    .addFields(
      {
        name: t(locale, 'mood.music.fieldArtists'),
        value: randomRec.artists.join(', '),
        inline: false,
      },
      { name: t(locale, 'mood.music.fieldVibe'), value: randomRec.vibe, inline: false },
    )
    .setFooter({ text: t(locale, 'mood.music.footer') });

  await interaction.reply({ embeds: [embed] });
}

/**
 * Handle /mood say subcommand
 * Plays a random sound from the specified folder (love or motivation)
 */
async function handleSaySubcommand(interaction: ChatInputCommandInteraction, message: string) {
  const locale = getLocale(interaction.locale);

  const embed = new EmbedBuilder()
    .setColor('#FF1493')
    .setTitle("Je t'aime")
    .setFooter({ text: t(locale, 'mood.say.footer') });

  await interaction.reply({ embeds: [embed] });

  // Play random sound from the specified folder (love or motivation)
  try {
    const member = interaction.member;
    const voiceChannel = member && 'voice' in member ? member.voice?.channel : null;
    if (!voiceChannel) {
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
      const currentFileDir = path.dirname(fileURLToPath(import.meta.url));
      const distRoot = path.resolve(currentFileDir, '..');
      const soundsDist = path.join(distRoot, 'assets', 'sounds', message);
      const soundsSrc = path.join(distRoot, '..', 'src', 'assets', 'sounds', message);
      const soundsDir = fs.existsSync(soundsDist) ? soundsDist : soundsSrc;

      if (!fs.existsSync(soundsDir)) {
        await interaction.followUp({
          content: t(locale, 'mood.say.noSoundsInFolder', { folder: message }),
          flags: EPHEMERAL_FLAG,
        });
        return;
      }

      const files = await readdir(soundsDir);
      const soundFiles = files.filter((f) => {
        const ext = path.extname(f).toLowerCase();
        return ['.opus', '.ogg', '.oga'].includes(ext);
      });

      if (soundFiles.length === 0) {
        await interaction.followUp({
          content: t(locale, 'mood.say.noSoundsInFolder', { folder: message }),
          flags: EPHEMERAL_FLAG,
        });
        return;
      }

      const randomSound = soundFiles[Math.floor(Math.random() * soundFiles.length)]!;
      const soundPath = path.join(soundsDir, randomSound);
      playFileInGuild(interaction.guildId, soundPath);
    }
  } catch (err: unknown) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error('Error during playFile:', e);
    try {
      await interaction.followUp({
        content: t(locale, 'mood.say.audioError', { error: e.message }),
        flags: EPHEMERAL_FLAG,
      });
    } catch (followErr) {
      console.error('Failed to followUp after play error:', followErr);
    }
  }
}

/**
 * Handle /mood play subcommand
 * - If `soundName` is provided, attempt to play it
 * - Otherwise list available sounds
 */
async function handlePlaySubcommand(interaction: ChatInputCommandInteraction, soundName?: string) {
  const locale = getLocale(interaction.locale);
  // Defer immediately to avoid interaction timeout
  await interaction.deferReply({ flags: EPHEMERAL_FLAG });

  const currentFileDir = path.dirname(fileURLToPath(import.meta.url));
  const distRoot = path.resolve(currentFileDir, '..');
  const soundsDist = path.join(distRoot, 'assets', 'sounds');
  const soundsSrc = path.join(distRoot, '..', 'src', 'assets', 'sounds');
  const soundsDir = fs.existsSync(soundsDist) ? soundsDist : soundsSrc;

  try {
    const files = await readdir(soundsDir);
    const soundFiles = files.filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return ['.opus', '.ogg', '.oga'].includes(ext);
    });

    if (soundFiles.length === 0) {
      await interaction.editReply({
        content: t(locale, 'mood.play.noSounds'),
      });
      return;
    }

    if (!soundName) {
      // list available sounds
      const list = soundFiles.map((f) => `- ${f}`).join('\n');
      await interaction.editReply({ content: t(locale, 'mood.play.availableSounds', { list }) });
      return;
    }

    // Attempt to find matching file (allow name without extension)
    const match = soundFiles.find((f) => f === soundName || path.parse(f).name === soundName);
    if (!match) {
      await interaction.editReply({
        content: t(locale, 'mood.play.soundNotFound', { sound: soundName }),
      });
      return;
    }

    // Ensure user is in voice
    const member = interaction.member;
    if (!member || !('voice' in member)) {
      await interaction.editReply({
        content: t(locale, 'mood.play.noVoiceState'),
      });
      return;
    }

    const voiceChannel = member.voice?.channel;
    if (!voiceChannel) {
      await interaction.editReply({
        content: t(locale, 'mood.play.notInVoice'),
      });
      return;
    }

    const filePath = path.join(soundsDir, match);
    const ext = path.extname(filePath).toLowerCase();
    if (!['.opus', '.ogg', '.oga'].includes(ext)) {
      await interaction.editReply({
        content: t(locale, 'mood.play.unsupportedFormat', { ext }),
      });
      return;
    }

    await joinVoiceChannelSafe(voiceChannel as VoiceChannel);
    playFileInGuild(interaction.guildId as string, filePath);
    await interaction.editReply({
      content: t(locale, 'mood.play.nowPlaying', { sound: match, channel: voiceChannel.name }),
    });
  } catch (err: unknown) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error('Error in handlePlaySubcommand:', e);
    try {
      await interaction.editReply({
        content: t(locale, 'mood.play.playError', { error: e.message }),
      });
    } catch (replyErr: unknown) {
      console.error('Failed to notify user after play error:', replyErr);
    }
  }
}

/**
 * Handle /mood join subcommand
 */
async function handleJoinSubcommand(interaction: ChatInputCommandInteraction) {
  const locale = getLocale(interaction.locale);
  // Defer immediately to avoid interaction timeout
  await interaction.deferReply({ flags: EPHEMERAL_FLAG });

  try {
    const member = interaction.member;
    // Ensure the interaction has a guild member with voice state
    if (!member || !('voice' in member)) {
      await interaction.editReply({
        content: t(locale, 'mood.join.noVoiceState'),
      });
      return;
    }

    const voiceChannel = member.voice?.channel;

    if (!voiceChannel) {
      await interaction.editReply({
        content: t(locale, 'mood.join.notInVoice'),
      });
      return;
    }

    if (
      voiceChannel.type !== ChannelType.GuildVoice &&
      voiceChannel.type !== ChannelType.GuildStageVoice
    ) {
      throw new Error('Target channel is not a voice/stage channel');
    }

    await joinVoiceChannelSafe(voiceChannel as VoiceChannel);
    await interaction.editReply({
      content: t(locale, 'mood.join.joined', { channel: voiceChannel.name ?? 'voice channel' }),
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error joining voice channel:', err);
    try {
      await interaction.editReply({
        content: t(locale, 'mood.join.joinError'),
      });
    } catch (replyErr: unknown) {
      console.error('Failed to notify user about join error:', replyErr);
    }
  }
}

/**
 * Handle /mood config lang set subcommand
 * Allows admins to set the guild's language
 */
async function handleConfigLangSet(interaction: ChatInputCommandInteraction, language: string) {
  const locale = getLocale(interaction.locale);

  // Defer immediately to avoid interaction timeout
  await interaction.deferReply({ flags: EPHEMERAL_FLAG });

  try {
    // Check if user has admin permission
    if (!interaction.memberPermissions?.has('Administrator')) {
      await interaction.editReply({
        content: t(locale, 'mood.config.lang.noPermission'),
      });
      return;
    }

    // Validate language input
    if (language !== 'en' && language !== 'fr') {
      await interaction.editReply({
        content: t(locale, 'mood.config.lang.invalidLanguage'),
      });
      return;
    }

    // Set the guild language
    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.editReply({
        content: 'Error: This command must be used in a server.',
      });
      return;
    }

    await setGuildLanguage(guildId, language);

    const languageDisplay = language === 'en' ? '🇬🇧 English' : '🇫🇷 Français';
    await interaction.editReply({
      content: t(locale, 'mood.config.lang.success', { language: languageDisplay }),
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error setting guild language:', err);
    try {
      await interaction.editReply({
        content: '❌ An error occurred while setting the language.',
      });
    } catch (replyErr: unknown) {
      console.error('Failed to notify user about config error:', replyErr);
    }
  }
}
