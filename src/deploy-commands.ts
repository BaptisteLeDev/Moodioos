/**
 * Script to deploy slash commands to Discord.
 * Can deploy to a specific guild (instant) or globally (cached).
 */
import { REST, Routes } from 'discord.js';
import type {
  RESTPutAPIApplicationCommandsResult,
  RESTPutAPIApplicationGuildCommandsResult,
} from 'discord-api-types/v10';
import { config, validateConfig } from './config.js';
import { commands as registeredCommands } from './commands/index.js';

type CommandJson = { name?: string; integration_types?: unknown } & Record<string, unknown>;

const commands = registeredCommands.map((c) => {
  // Cast to unknown first to avoid a possibly incompatible conversion from the discord-api types
  const json = c.data.toJSON() as unknown as CommandJson;
  // Ensure commands are available when the app is installed to a user (USER_INSTALL)
  json.integration_types = ['USER_INSTALL'];
  return json;
});

const rest = new REST({ version: '10' }).setToken(config.discord.token);

const deploy = async () => {
  try {
    // Fail fast with helpful config validation before hitting the Discord API
    validateConfig();
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    if (config.discord.guildId) {
      console.log(`🔧 Deploying to guild ${config.discord.guildId} (instant updates for testing)`);
      const data = (await rest.put(
        Routes.applicationGuildCommands(config.discord.applicationId, config.discord.guildId),
        { body: commands },
      )) as RESTPutAPIApplicationGuildCommandsResult;
      console.log(`✅ Successfully reloaded ${data.length} guild command(s).`);
    } else {
      console.log(`🌍 Deploying globally (may take up to 1 hour to propagate to all servers)`);
      const data = (await rest.put(Routes.applicationCommands(config.discord.applicationId), {
        body: commands,
      })) as RESTPutAPIApplicationCommandsResult;
      console.log(`✅ Successfully reloaded ${data.length} global command(s).`);
    }
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
};

void deploy();
