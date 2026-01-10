/**
 * Exports all registered slash commands.
 * New commands should be added to the array.
 */
import { pingCommand } from './ping.js';
import { moodCommand } from './mood.js';
import { hugCommand } from './hug.js';
import { loveCommand } from './love.js';
import { helpCommand } from './help.js';
import { statsCommand } from './stats.js';
import { mpCommand } from './mp.js';
import { scheduleCommand } from './schedule.js';
import { Command } from './types.js';

export const commands: Command[] = [
  pingCommand,
  moodCommand,
  hugCommand,
  loveCommand,
  helpCommand,
  statsCommand,
  mpCommand,
  scheduleCommand,
];

export default commands;
