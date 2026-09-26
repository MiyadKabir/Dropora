// storage.js — small localStorage-backed settings & folder metadata store.
// Note: actual file contents live only in memory for this session (see files.js).
// That keeps the app dependency-free; a real deployment could swap this for IndexedDB
// to persist file bytes across reloads without changing any other module.
const Store = (() => {
  const KEYS = { theme: 'dropora.theme', view: 'dropora.view', folders: 'dropora.folders',
    settings: 'dropora.settings' };

  function get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  return {
    getTheme: () => get(KEYS.theme, 'dark'),
    setTheme: (t) => set(KEYS.theme, t),
    getViewMode: () => get(KEYS.view, 'grid'),
    setViewMode: (v) => set(KEYS.view, v),
    getFolders: () => get(KEYS.folders, []),
    setFolders: (f) => set(KEYS.folders, f),
    getSettings: () => get(KEYS.settings, { confirmDelete: true, defaultView: 'grid', themeMode: 'dark' }),
    setSettings: (s) => set(KEYS.settings, s),
  };
})();
