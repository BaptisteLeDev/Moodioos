/**
 * Discord Bot Client Module
 *
 * Implements a custom Discord.js client with command management and event handling.
 * Uses the Singleton pattern to ensure only one bot instance exists.
 *
 * Design Patterns:
 * - Singleton: Ensures single bot instance
 * - Command Pattern: Encapsulates commands as objects
 * - Observer: Event-driven architecture with Discord.js events
 *
 * @module client
 */

import {
  Client,
  REST,
  Routes,
  GatewayIntentBits,
  Events,
  Collection,
  Interaction,
  ChatInputCommandInteraction,
  ClientOptions,
} from 'discord.js';

const EPHEMERAL_FLAG = 64;
import { config } from './config.js';
import { Command } from './commands/types.js';
import { commands as registeredCommands } from './commands/index.js';

const rest = new REST({ version: '10' }).setToken(config.discord.token);

/**
 * Bot Statistics Interface
 *
 * Represents various statistics about the bot's current state
 */
export interface BotStatistics {
  /** Number of guilds (servers) the bot is in */
  guilds: number;
  /** Number of cached users */
  users: number;
  /** Number of registered commands */
  commands: number;
  /** Bot uptime in seconds */
  uptime: number;
  /** Average ping to Discord WebSocket in milliseconds */
  ping: number;
  /** Bot's username with discriminator */
  username: string;
  /** Bot's user ID */
  userId: string;
  /** Whether bot is ready and connected */
  ready: boolean;
}

/**
 * Custom Discord Bot Client
 *
 * Extends the base Discord.js Client with command management
 * and enhanced error handling.
 *
 * Features:
 * - Automatic command registration
 * - Centralized interaction handling
 * - Comprehensive error handling
 * - Statistics tracking
 *
 * @example
 * ```ts
 * import { bot } from './client';
 *
 * await bot.start();
 * const stats = bot.getStatistics();
 * ```
 */
export class BotClient extends Client {
  /**
   * Collection of registered slash commands
   * Maps command name to command implementation
   */
  public commands: Collection<string, Command>;

  /**
   * Timestamp when bot started (for uptime calculation)
   */
  private startTime: number;

  /**
   * Creates a new BotClient instance
   *
   * Automatically:
   * - Configures intents
   * - Registers commands
   * - Sets up event listeners
   */
  constructor() {
    const options: ClientOptions = {
      intents: [
        GatewayIntentBits.Guilds, // Required for guild information
        GatewayIntentBits.MessageContent, // For DM replies
        GatewayIntentBits.GuildVoiceStates, // For voice state updates & join voice
        GatewayIntentBits.DirectMessages, // For DM functionality
      ],
    };

    super(options);

    this.commands = new Collection();
    this.startTime = Date.now();

    // Initialize bot components
    this.registerCommands();
    this.setupListeners();
  }

  /**
   * Register Commands
   *
   * Loads all commands from the commands directory and registers them
   * in the commands collection.
   *
   * @private
   */
  private registerCommands(): void {
    console.log(`📝 Registering ${registeredCommands.length} commands...`);

    for (const cmd of registeredCommands) {
      this.commands.set(cmd.data.name, cmd);
      console.log(`   ✓ Registered command: /${cmd.data.name}`);
    }

    console.log(`✅ ${this.commands.size} commands registered successfully`);
  }

  /**
   * Setup Event Listeners
   *
   * Registers handlers for Discord.js events.
   * Uses event-driven architecture for loose coupling.
   *
   * @private
   */
  private setupListeners(): void {
    // Bot ready event (fires once when bot connects)
    this.once(Events.ClientReady, this.onReady.bind(this));

    // When the bot joins a new guild, register guild commands so they appear instantly
    if (config.discord.autoDeployCommands) {
      // Use a non-async wrapper so we don't pass an async function where a void-return is expected
      this.on(Events.GuildCreate, (guild) => {
        void this.onGuildCreate(guild);
      });
    }

    // Interaction events (slash commands, buttons, etc.)
    this.on(Events.InteractionCreate, (interaction) => {
      void this.handleInteraction(interaction);
    });

    // Error handling
    this.on(Events.Error, this.onError.bind(this));
    this.on(Events.Warn, this.onWarn.bind(this));
  }

  /**
   * Client Ready Handler
   *
   * Called once when the bot successfully connects to Discord.
   *
   * @param client - The ready client instance
   * @private
   */
  private onReady(client: Client<true>): void {
    console.log(`✅ Discord Bot Ready! Logged in as ${client.user.tag}`);
    console.log(`📊 Connected to ${client.guilds.cache.size} guilds`);
    console.log(`👥 Serving ${this.getTotalUsers()} users`);
    // Start scheduler for scheduled messages (lightweight JSON-based MVP)
    void (async () => {
      try {
        const { startScheduler } = await import('./services/scheduler.js');
        startScheduler(this);
      } catch (err) {
        console.warn('Scheduler not started:', err);
      }
    })();
    // Auto-deploy commands on ready (useful for development / ensuring commands exist)
    if (config.discord.autoDeployCommands) {
      void (async () => {
        try {
          const commandsPayload = this.commands.map((c) => c.data.toJSON());

          if (config.discord.guildId) {
            console.log(
              `🔧 Deploying ${commandsPayload.length} commands to configured guild ${config.discord.guildId} (instant updates)`,
            );
            const data = (await rest.put(
              Routes.applicationGuildCommands(config.discord.applicationId, config.discord.guildId),
              { body: commandsPayload },
            )) as import('discord-api-types/v10').RESTPutAPIApplicationGuildCommandsResult;
            console.log(`✅ Successfully deployed ${data.length} guild commands`);
          } else {
            console.log('🌍 Deploying commands globally (may take up to 1 hour to propagate)');
            const data = (await rest.put(Routes.applicationCommands(config.discord.applicationId), {
              body: commandsPayload,
            })) as import('discord-api-types/v10').RESTPutAPIApplicationCommandsResult;
            console.log(`✅ Successfully deployed ${data.length} global commands`);
          }
        } catch (error) {
          console.error('❌ Error deploying commands on ready:', error);
        }
      })();
    }

    // Set bot presence/activity (optional)
    // client.user.setActivity('Listening to /help', { type: ActivityType.Listening });
  }

  /**
   * Guild Create Handler
   *
   * Registers commands for the newly joined guild so commands appear instantly.
   *
   * @param guild - The guild that was added
   * @private
   */
  private async onGuildCreate(guild: import('discord.js').Guild): Promise<void> {
    try {
      const commandsPayload = this.commands.map((c) => c.data.toJSON());
      console.log(
        `📥 Joined new guild: ${guild.name} (${guild.id}) - registering ${commandsPayload.length} commands...`,
      );

      const data = (await rest.put(
        Routes.applicationGuildCommands(config.discord.applicationId, guild.id),
        { body: commandsPayload },
      )) as import('discord-api-types/v10').RESTPutAPIApplicationGuildCommandsResult;

      console.log(`✅ Registered ${data.length} commands for ${guild.name}`);
    } catch (err) {
      console.error(`❌ Failed to register commands for guild ${guild.id}:`, err);
    }
  }

  /**
   * Error Handler
   *
   * Handles Discord.js client errors
   *
   * @param error - The error that occurred
   * @private
   */
  private onError(error: Error): void {
    console.error('❌ Discord Client Error:', error);
  }

  /**
   * Warning Handler
   *
   * Handles Discord.js client warnings
   *
   * @param warning - The warning message
   * @private
   */
  private onWarn(warning: string): void {
    console.warn('⚠️  Discord Client Warning:', warning);
  }

  /**
   * Handle Interaction
   *
   * Central handler for all Discord interactions (commands, buttons, modals, etc.)
   * Currently handles slash commands only.
   *
   * @param interaction - The interaction to handle
   * @private
   */
  private async handleInteraction(interaction: Interaction): Promise<void> {
    // Only handle chat input commands (slash commands)
    if (!interaction.isChatInputCommand()) {
      return;
    }

    await this.handleChatInputCommand(interaction);
  }

  /**
   * Handle Chat Input Command
   *
   * Executes a slash command with proper error handling.
   *
   * @param interaction - The command interaction
   * @private
   */
  private async handleChatInputCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const command = this.commands.get(interaction.commandName);

    if (!command) {
      console.error(`❌ Command not found: /${interaction.commandName}`);
      await this.replyError(interaction, 'Command not found.');
      return;
    }

    console.log(
      `🎯 Executing /${interaction.commandName} by ${interaction.user.tag} in ${interaction.guild?.name ?? 'DM'}`,
    );

    try {
      // Execute the command
      await command.execute(interaction);
    } catch (error) {
      // Log the error
      console.error(`❌ Error executing /${interaction.commandName}:`, error);

      // Reply to user
      await this.replyError(interaction, 'There was an error while executing this command!');
    }
  }

  /**
   * Reply with Error Message
   *
   * Helper method to reply to interactions with error messages.
   * Handles both replied and non-replied interactions.
   *
   * @param interaction - The interaction to reply to
   * @param message - The error message to send
   * @private
   */
  private async replyError(
    interaction: ChatInputCommandInteraction,
    message: string,
  ): Promise<void> {
    const reply = {
      content: `❌ ${message}`,
      flags: EPHEMERAL_FLAG,
    };

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    } catch (err) {
      console.error('Failed to send error reply:', err);
    }
  }

  /**
   * Get Bot Statistics
   *
   * Returns comprehensive statistics about the bot's current state.
   *
   * @returns Bot statistics object
   */
  public getStatistics(): BotStatistics {
    return {
      guilds: this.guilds.cache.size,
      users: this.getTotalUsers(),
      commands: this.commands.size,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      ping: this.ws.ping,
      username: this.user?.tag ?? 'Unknown',
      userId: this.user?.id ?? 'Unknown',
      ready: this.isReady(),
    };
  }

  /**
   * Get Total Users
   *
   * Calculates the total number of unique users across all guilds.
   * Note: This only counts cached members.
   *
   * @returns Total user count
   * @private
   */
  private getTotalUsers(): number {
    return this.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
  }

  /**
   * Start Bot
   *
   * Logs in to Discord with the configured token.
   *
   * @throws {Error} If login fails
   */
  public async start(): Promise<void> {
    console.log('🔐 Logging in to Discord...');
    await this.login(config.discord.token);
  }
}

/**
 * Singleton Bot Instance
 *
 * Global bot instance used throughout the application.
 * Use this instead of creating new BotClient instances.
 *
 * @example
 * ```ts
 * import { bot } from './client';
 *
 * const stats = bot.getStatistics();
 * console.log(`Bot is in ${stats.guilds} guilds`);
 * ```
 */
export const bot = new BotClient();
