/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  joinVoiceChannel as joinVoiceInternal,
  createAudioPlayer,
  createAudioResource,
  AudioPlayer,
  AudioPlayerStatus,
  VoiceConnection,
  VoiceConnectionStatus,
  entersState,
} from '@discordjs/voice';
import type { VoiceAdapterCreator } from '@discordjs/voice';
import { VoiceChannel, PermissionFlagsBits, ChannelType } from 'discord.js';

type GuildVoiceState = {
  connection: VoiceConnection;
  player?: AudioPlayer;
};

const connections = new Map<string, GuildVoiceState>();

/**
 * Join a voice channel with checks and timeouts. Throws on failure.
 */
export async function joinVoiceChannelSafe(voiceChannel: VoiceChannel) {
  if (
    !voiceChannel ||
    (voiceChannel.type !== ChannelType.GuildVoice &&
      voiceChannel.type !== ChannelType.GuildStageVoice)
  ) {
    throw new Error('Target channel is not a guild voice channel (voice or stage)');
  }

  const botMember = voiceChannel.guild.members.me;
  if (!botMember) {
    throw new Error('Unable to resolve bot member in guild');
  }

  const perms = voiceChannel.permissionsFor(botMember);
  if (!perms || !perms.has(PermissionFlagsBits.Connect) || !perms.has(PermissionFlagsBits.Speak)) {
    throw new Error('Missing Connect/Speak permissions for this channel');
  }

  // If already connected in this guild, reuse connection
  const guildId = voiceChannel.guild.id;
  const existing = connections.get(guildId);
  if (existing && !existing.connection.destroyed) {
    return existing.connection;
  }

  const adapter = (voiceChannel.guild as unknown as { voiceAdapterCreator?: VoiceAdapterCreator })
    .voiceAdapterCreator;
  if (!adapter) {
    throw new Error('Guild does not expose voiceAdapterCreator (unable to join voice)');
  }

  const connection = joinVoiceInternal({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,

    adapterCreator: adapter,
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
  } catch (err: unknown) {
    try {
      connection.destroy();
    } catch (destroyErr: unknown) {
      console.error(
        'Error destroying connection after failed ready:',
        destroyErr instanceof Error ? destroyErr.message : String(destroyErr),
      );
    }
    const msg = err instanceof Error ? err.message : String(err);
    // Provide clearer guidance when DAVE protocol dependency is missing
    if (msg.includes('@snazzah/davey') || msg.toLowerCase().includes('dave protocol')) {
      console.error('DAVE protocol missing. Install @snazzah/davey to enable DAVE networking.');
      throw new Error(
        'Failed to establish voice connection: DAVE protocol unavailable. Install @snazzah/davey (pnpm add @snazzah/davey) and restart the bot',
      );
    }

    throw new Error('Failed to establish voice connection (timeout): ' + msg);
  }

  const player = createAudioPlayer();

  player.on('error', (err: unknown) => {
    console.error('AudioPlayer error:', err instanceof Error ? err.message : String(err));
  });

  connections.set(guildId, { connection, player });

  return connection;
}

/**
 * Play a local file (path) in the guild's current voice connection.
 */
export function playFileInGuild(guildId: string, filePath: string) {
  const state = connections.get(guildId);
  if (!state?.connection) {
    throw new Error('No active voice connection for guild');
  }

  const resource = createAudioResource(filePath);
  const player = state.player ?? createAudioPlayer();

  player.play(resource);
  state.connection.subscribe(player);

  player.on('stateChange', (_oldState, newState) => {
    if (newState.status === AudioPlayerStatus.Idle) {
      // finished
    }
  });

  player.on('error', (err: unknown) => {
    console.error('Audio player playback error:', err instanceof Error ? err.message : String(err));
  });

  state.player = player;
}

/**
 * Destroy all active voice connections and stop players.
 */
export function destroyAllVoiceConnections() {
  for (const [guildId, state] of connections.entries()) {
    try {
      if (state.player) {
        try {
          state.player.stop();
        } catch (stopErr) {
          console.error(`Error stopping player for guild ${guildId}:`, stopErr);
        }
      }

      try {
        state.connection.destroy();
      } catch (destroyErr) {
        console.error(`Error destroying connection for guild ${guildId}:`, destroyErr);
      }
    } catch (err: unknown) {
      console.error(
        `Error destroying voice resources for guild ${guildId}:`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }
  connections.clear();
}

export function isConnectedInGuild(guildId: string) {
  const s = connections.get(guildId);
  return !!s && !s.connection.destroyed;
}
