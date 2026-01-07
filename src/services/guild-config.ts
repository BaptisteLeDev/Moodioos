/**
 * Guild Configuration Service
 * Manages per-guild settings (language, preferences, etc.)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

interface GuildConfig {
  guildId: string;
  language: 'en' | 'fr';
  updatedAt: number;
}

const currentFileDir = path.dirname(fileURLToPath(import.meta.url));
const configFile = path.resolve(currentFileDir, '../data/guild-configs.json');

// In-memory cache
let configCache: Map<string, GuildConfig> = new Map();
let cacheLoaded = false;

/**
 * Load configurations from file into memory
 */
async function loadConfigs(): Promise<void> {
  try {
    if (cacheLoaded) {
      return;
    }

    try {
      const data = await fs.readFile(configFile, 'utf-8');
      const configs = JSON.parse(data) as unknown as GuildConfig[];
      configCache = new Map(configs.map((cfg) => [cfg.guildId, cfg]));
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
      // File doesn't exist yet, that's fine
      configCache = new Map();
    }

    cacheLoaded = true;
  } catch (err: unknown) {
    console.error('Error loading guild configs:', err);
    configCache = new Map();
  }
}

/**
 * Save configurations to file
 */
async function saveConfigs(): Promise<void> {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(configFile);
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw err;
      }
    }

    const configs = Array.from(configCache.values());
    await fs.writeFile(configFile, JSON.stringify(configs, null, 2), 'utf-8');
  } catch (err: unknown) {
    console.error('Error saving guild configs:', err);
  }
}

/**
 * Get language for a specific guild
 */
export async function getGuildLanguage(guildId: string): Promise<'en' | 'fr'> {
  await loadConfigs();
  const config = configCache.get(guildId);
  return config?.language ?? 'en'; // Default to English
}

/**
 * Set language for a specific guild
 */
export async function setGuildLanguage(guildId: string, language: 'en' | 'fr'): Promise<void> {
  await loadConfigs();

  const config: GuildConfig = {
    guildId,
    language,
    updatedAt: Date.now(),
  };

  configCache.set(guildId, config);
  await saveConfigs();
}

/**
 * Get full config for a guild
 */
export async function getGuildConfig(guildId: string): Promise<GuildConfig> {
  await loadConfigs();
  return (
    configCache.get(guildId) ?? {
      guildId,
      language: 'en',
      updatedAt: Date.now(),
    }
  );
}

/**
 * Reset cache (useful for testing)
 */
export function resetCache(): void {
  configCache.clear();
  cacheLoaded = false;
}
