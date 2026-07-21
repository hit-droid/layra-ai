import { create } from 'zustand';
import type { AppSettings } from '@/types';
import { storage } from '@/utils/storage';

const DEFAULT_SETTINGS: AppSettings = {
  openaiKey: '',
  openaiModel: 'gpt-4o-mini',
  stabilityKey: '',
  elevenlabsKey: '',
  ttsEnabled: true,
  ttsSpeed: 1.0,
  theme: 'dark',
  accentColor: '#a855f7',
  serverUrl: '',
};

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: true,

  loadSettings: async () => {
    const saved = await storage.getSettings<AppSettings>(DEFAULT_SETTINGS);
    set({ settings: { ...DEFAULT_SETTINGS, ...saved }, isLoading: false });
  },

  updateSettings: (updates) => {
    const { settings } = get();
    const newSettings = { ...settings, ...updates };
    storage.setSettings(newSettings);
    set({ settings: newSettings });
  },
}));