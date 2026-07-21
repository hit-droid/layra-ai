import { create } from 'zustand';
import type { Plugin } from '@/types';
import { storage } from '@/utils/storage';
import { MARKETPLACE_PLUGINS } from '@/data/plugins';

interface PluginState {
  plugins: Plugin[];
  isLoading: boolean;
  loadPlugins: () => Promise<void>;
  installPlugin: (id: string) => void;
  uninstallPlugin: (id: string) => void;
  togglePlugin: (id: string) => void;
  getInstalledPlugins: () => Plugin[];
  getActivePlugins: () => Plugin[];
}

export const usePluginStore = create<PluginState>((set, get) => ({
  plugins: [],
  isLoading: true,

  loadPlugins: async () => {
    const saved = await storage.getPlugins<Plugin[]>([]);
    const merged = MARKETPLACE_PLUGINS.map((p) => {
      const savedPlugin = saved.find((s: Plugin) => s.id === p.id);
      if (savedPlugin) {
        return { ...p, isInstalled: savedPlugin.isInstalled, isActive: savedPlugin.isActive };
      }
      return p;
    });
    set({ plugins: merged, isLoading: false });
  },

  installPlugin: (id) => {
    const { plugins } = get();
    const updated = plugins.map((p) =>
      p.id === id ? { ...p, isInstalled: true, isActive: true } : p
    );
    storage.setPlugins(updated);
    set({ plugins: updated });
  },

  uninstallPlugin: (id) => {
    const { plugins } = get();
    const updated = plugins.map((p) =>
      p.id === id ? { ...p, isInstalled: false, isActive: false } : p
    );
    storage.setPlugins(updated);
    set({ plugins: updated });
  },

  togglePlugin: (id) => {
    const { plugins } = get();
    const updated = plugins.map((p) =>
      p.id === id ? { ...p, isActive: !p.isActive } : p
    );
    storage.setPlugins(updated);
    set({ plugins: updated });
  },

  getInstalledPlugins: () => {
    return get().plugins.filter((p) => p.isInstalled);
  },

  getActivePlugins: () => {
    return get().plugins.filter((p) => p.isActive);
  },
}));