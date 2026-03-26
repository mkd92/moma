const V = 1;
const key = (uid, name) => `moma_v${V}_${uid}_${name}`;

export const cacheGet = (uid, name) => {
  try {
    const raw = localStorage.getItem(key(uid, name));
    return raw ? JSON.parse(raw).data : null;
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
