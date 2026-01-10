import fs from 'fs/promises';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

export type ScheduledMessage = {
  id: string;
  targetUserId: string;
  content: string;
  sendAt: string; // ISO string in UTC
  creatorId: string | null;
  status: 'pending' | 'sent' | 'failed';
  retries: number;
  lastError?: string | null;
  createdAt: string;
};

// __dirname replacement for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data', 'scheduled-messages.json');

async function ensureDataFile(): Promise<void> {
  try {
    await fs.access(DATA_FILE);
  } catch {
    // If missing or inaccessible, create the directory and an empty array file
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, '[]', 'utf8');
  }
}

async function readAll(): Promise<ScheduledMessage[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw) as ScheduledMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to parse scheduled messages file, resetting to empty array', err);
    return [];
  }
}

async function writeAll(items: ScheduledMessage[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), 'utf8');
}

export async function addScheduledMessage(opts: {
  targetUserId: string;
  content: string;
  sendAt: string; // ISO
  creatorId?: string;
}): Promise<ScheduledMessage> {
  const items = await readAll();
  const msg: ScheduledMessage = {
    id: crypto.randomUUID(),
    targetUserId: opts.targetUserId,
    content: opts.content,
    sendAt: opts.sendAt,
    creatorId: opts.creatorId ?? null,
    status: 'pending',
    retries: 0,
    lastError: null,
    createdAt: new Date().toISOString(),
  };
  items.push(msg);
  await writeAll(items);
  return msg;
}

export async function getPendingMessages(nowIso?: string): Promise<ScheduledMessage[]> {
  const now = nowIso ?? new Date().toISOString();
  const items = await readAll();
  return items.filter((m) => m.status === 'pending' && m.sendAt <= now);
}

export async function markSent(id: string): Promise<void> {
  const items = await readAll();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) {
    return;
  }
  const entry = items[idx];
  if (!entry) {
    return;
  }
  entry.status = 'sent';
  await writeAll(items);
}

export async function markFailed(id: string, errorMsg?: string): Promise<void> {
  const items = await readAll();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) {
    return;
  }
  const entry = items[idx];
  if (!entry) {
    return;
  }
  entry.status = 'failed';
  entry.retries = (entry.retries ?? 0) + 1;
  entry.lastError = errorMsg ?? null;
  await writeAll(items);
}

export async function getAll(): Promise<ScheduledMessage[]> {
  return readAll();
}
