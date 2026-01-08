const requests = new Map<string, Set<string>>();

export function addHugRequest(guildId: string, userId: string) {
  const set = requests.get(guildId) ?? new Set<string>();
  set.add(userId);
  requests.set(guildId, set);
}

export function removeHugRequest(guildId: string, userId: string) {
  const set = requests.get(guildId);
  if (!set) {
    return;
  }
  set.delete(userId);
  if (set.size === 0) {
    requests.delete(guildId);
  }
}

export function hasHugRequest(guildId: string, userId: string) {
  const set = requests.get(guildId);
  return !!set && set.has(userId);
}

export function listHugRequests(guildId: string) {
  const set = requests.get(guildId);
  return set ? Array.from(set) : [];
}
