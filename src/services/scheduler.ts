import { Client } from 'discord.js';
import {
  getPendingMessages,
  markSent,
  markFailed,
  ScheduledMessage,
} from './scheduled-messages.js';

const CHECK_INTERVAL_MS = 60 * 1000; // every minute
let intervalRef: NodeJS.Timeout | null = null;

export function startScheduler(client: Client): void {
  if (intervalRef) {
    return;
  } // already running

  console.log('⏰ Starting scheduled messages worker (every minute, UTC)');

  intervalRef = globalThis.setInterval(() => {
    void (async () => {
      try {
        const nowIso = new Date().toISOString();
        const pending = await getPendingMessages(nowIso);

        if (pending.length === 0) {
          return;
        }

        for (const msg of pending) {
          await processMessage(client, msg);
        }
      } catch (err) {
        console.error('Scheduler loop error:', err);
      }
    })();
  }, CHECK_INTERVAL_MS) as unknown as NodeJS.Timeout;
}

async function processMessage(client: Client, msg: ScheduledMessage) {
  try {
    // fetch user and send DM
    const user = await client.users.fetch(msg.targetUserId);
    if (!user) {
      throw new Error('User not found');
    }

    await user.send(msg.content);
    await markSent(msg.id);
    console.log(`✅ Sent scheduled message ${msg.id} to ${msg.targetUserId}`);
  } catch (err) {
    const e = err instanceof Error ? err.message : String(err);
    console.warn(`❌ Failed to send scheduled message ${msg.id} to ${msg.targetUserId}:`, e);
    await markFailed(msg.id, e);
  }
}

export function stopScheduler(): void {
  if (!intervalRef) {
    return;
  }
  globalThis.clearInterval(intervalRef as unknown as number);
  intervalRef = null;
}
