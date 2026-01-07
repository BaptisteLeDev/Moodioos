/**
 * Exports all registered slash commands.
 * New commands should be added to the array.
 */
import { pingCommand } from './ping.js';
import { moodCommand } from './mood.js';
import { hugCommand } from './hug.js';
import { helpCommand } from './help.js';
import { statsCommand } from './stats.js';
import { Command } from './types.js';

export const commands: Command[] = [
  pingCommand,
  moodCommand,
  hugCommand,
  helpCommand,
  statsCommand,
];

export default commands;
