// Product ids the shopper opened recently, newest first (kept on this device only).
const STORAGE_KEY = 'recentlyViewed';
const MAX_ITEMS = 12;

export function readRecentlyViewed(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(id: string) {
  try {
    const next = [id, ...readRecentlyViewed().filter((existing) => existing !== id)].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable — the rail simply stays empty.
  }
}
