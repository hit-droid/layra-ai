import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  CHARACTERS: '@layra/characters',
  SETTINGS: '@layra/settings',
  ACTIVE_CHARACTER: '@layra/active-character',
  CONVERSATIONS: '@layra/conversations',
  IMAGES: '@layra/images',
  PLUGINS: '@layra/plugins',
  TOOLS: '@layra/tools',
} as const;

async function safeGet<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function safeSet(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable
  }
}

export const storage = {
  getCharacters: <T>(fallback: T) => safeGet(KEYS.CHARACTERS, fallback),
  setCharacters: (value: unknown) => safeSet(KEYS.CHARACTERS, value),
  getSettings: <T>(fallback: T) => safeGet(KEYS.SETTINGS, fallback),
  setSettings: (value: unknown) => safeSet(KEYS.SETTINGS, value),
  getActiveCharacter: <T>(fallback: T) => safeGet(KEYS.ACTIVE_CHARACTER, fallback),
  setActiveCharacter: (value: unknown) => safeSet(KEYS.ACTIVE_CHARACTER, value),
  getConversations: <T>(fallback: T) => safeGet(KEYS.CONVERSATIONS, fallback),
  setConversations: (value: unknown) => safeSet(KEYS.CONVERSATIONS, value),
  getImages: <T>(fallback: T) => safeGet(KEYS.IMAGES, fallback),
  setImages: (value: unknown) => safeSet(KEYS.IMAGES, value),
  getPlugins: <T>(fallback: T) => safeGet(KEYS.PLUGINS, fallback),
  setPlugins: (value: unknown) => safeSet(KEYS.PLUGINS, value),
  getTools: <T>(fallback: T) => safeGet(KEYS.TOOLS, fallback),
  setTools: (value: unknown) => safeSet(KEYS.TOOLS, value),
};