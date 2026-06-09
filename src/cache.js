const V = 1;
const key = (uid, name) => `moma_v${V}_${uid}_${name}`;

// 5-minute TTL: stale-while-revalidate pattern — cache pre-populates the UI
// on load, then a fresh fetch immediately replaces it. 24h was too long for
// multi-device use where another device adds transactions.
const TTL_MS = 5 * 60 * 1000;

export const cacheGet = (uid, name) => {
  try {
    const raw = localStorage.getItem(key(uid, name));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.ts && Date.now() - parsed.ts > TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
};

export const cacheSet = (uid, name, data) => {
  try {
    localStorage.setItem(key(uid, name), JSON.stringify({ data, ts: Date.now() }));
  } catch {}
};

export const cacheClear = (uid) => {
  const prefix = `moma_v${V}_${uid}_`;
  Object.keys(localStorage)
    .filter(k => k.startsWith(prefix))
    .forEach(k => localStorage.removeItem(k));
};
