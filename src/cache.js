const V = 1;
const key = (uid, name) => `moma_v${V}_${uid}_${name}`;

const TTL_MS = 24 * 60 * 60 * 1000;

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
