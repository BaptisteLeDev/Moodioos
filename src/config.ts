/**
 * Configuration Module
 *
 * Centralizes all application configuration with type-safe validation using Zod.
 * Loads environment variables from .env file and validates them against a schema.
 *
 * @module config
 */

import { config as loadEnv } from 'dotenv';
import { z } from 'zod';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
loadEnv({ path: resolve(__dirname, '../.env') });

/**
 * Environment variable schema using Zod for type-safe validation
 */
const envSchema = z.object({
  // Discord Configuration
  DISCORD_TOKEN: z.string().min(1, 'Discord token is required'),
  // Discord snowflakes are numeric strings ~17-19 digits
  DISCORD_APPLICATION_ID: z
    .string()
    .regex(/^\d{17,19}$/u, 'Discord application ID must be a numeric snowflake (17–19 digits)'),
  DISCORD_GUILD_ID: z
    .string()
    .regex(/^\d{17,19}$/u, 'Discord guild ID must be a numeric snowflake (17–19 digits)')
    .optional(),
  // Whether the bot should automatically deploy slash commands at startup and on guild join
  DISCORD_AUTO_DEPLOY_COMMANDS: z
    .preprocess((val) => {
      // Convert string env values to boolean, default to true unless explicitly 'false'
      if (typeof val === 'string') {
        return val.toLowerCase() !== 'false';
      }
      return !!val;
    }, z.boolean())
    .default(true),
  // API Configuration
  PORT: z.string().default('3001').transform(Number),
  HOST: z.string().default('0.0.0.0'),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

/**
 * Parse and validate environment variables
 */
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    throw new Error('Environment validation failed. Check your .env file.');
  }

  return result.data;
};

const env = parseEnv();

/**
 * Application Configuration
 *
 * Typed configuration object with all application settings.
 * All values are validated and type-safe.
 *
 * @example
 * ```ts
 * import { config } from './config';
 *
 * const token = config.discord.token;
 * const port = config.api.port;
 * ```
 */
export const config = {
  /**
   * Discord Bot Configuration
   */
  discord: {
    /**
     * Discord bot token from Discord Developer Portal
     */
    token: env.DISCORD_TOKEN,

    /**
     * Discord application ID from Discord Developer Portal
     */
    applicationId: env.DISCORD_APPLICATION_ID,

    /**
     * Optional guild ID for faster command deployment during development
     * If set, commands are deployed to this guild only (instant)
     * If not set, commands are deployed globally (can take up to 1 hour)
     */
    guildId: env.DISCORD_GUILD_ID,

    /**
     * Whether to automatically deploy slash commands on bot ready and on guild join
     * Useful to make command deployment opt-in for production environments
     */
    autoDeployCommands: env.DISCORD_AUTO_DEPLOY_COMMANDS,
  },

  /**
   * API Server Configuration
   */
  api: {
    /**
     * Port for the Fastify API server
     * @default 3001
     */
    port: env.PORT,

    /**
     * Host address for the API server
     * @default '0.0.0.0'
     */
    host: env.HOST,
  },

  /**
   * Application Environment
   */
  env: env.NODE_ENV,

  /**
   * Logging Configuration
   */
  logging: {
    /**
     * Log level for application logging
     * @default 'info'
     */
    level: env.LOG_LEVEL,
  },

  /**
   * Feature Flags
   */
  features: {
    /**
     * Whether to enable API server
     * @default true
     */
    enableApi: true,

    /**
     * Whether to enable Swagger UI
     * @default true in development, false in production
     */
    enableSwagger: env.NODE_ENV === 'development',
  },

  /**
   * Check if running in development mode
   */
  isDevelopment: env.NODE_ENV === 'development',

  /**
   * Check if running in production mode
   */
  isProduction: env.NODE_ENV === 'production',

  /**
   * Check if running in test mode
   */
  isTest: env.NODE_ENV === 'test',
} as const;

/**
 * Type of the configuration object
 */
export type Config = typeof config;

/**
 * Validate that all required configuration is present
 * Throws an error if configuration is invalid
 */
export const validateConfig = (): void => {
  if (!config.discord.token) {
    throw new Error('DISCORD_TOKEN is required in .env file');
  }

  if (!config.discord.applicationId) {
    throw new Error('DISCORD_APPLICATION_ID is required in .env file');
  }

  console.log('✅ Configuration validated successfully');
};
