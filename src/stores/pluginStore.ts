import { create } from 'zustand';
import type { Plugin } from '@/types';
import { storage } from '@/utils/storage';
import { pluginManager } from '@/utils/downloadManager';

interface PluginState {
  plugins: Plugin[];
  isLoading: boolean;
  isRefreshing: boolean;
  registryVersion: string;
  loadPlugins: () => Promise<void>;
  refreshRegistry: () => Promise<void>;
  enablePlugin: (id: string) => Promise<void>;
  disablePlugin: (id: string) => Promise<void>;
  togglePlugin: (id: string) => void;
  getEnabledPlugins: () => Plugin[];
  getActivePlugins: () => Plugin[];
}

export const usePluginStore = create<PluginState>((set, get) => ({
  plugins: [],
  isLoading: true,
  isRefreshing: false,
  registryVersion: '',

  loadPlugins: async () => {
    const saved = await storage.getPlugins<Plugin[]>([]);
    const enabledIds = await pluginManager.getEnabledIds();

    try {
      const registry = await pluginManager.fetchRegistry();
      if (registry && registry.plugins.length > 0) {
        const merged = registry.plugins.map((p) => {
          const savedPlugin = saved.find((s: Plugin) => s.id === p.id);
          const isEnabled = enabledIds.includes(p.id) || savedPlugin?.isInstalled || false;
          return {
            ...p,
            isInstalled: isEnabled,
            isActive: savedPlugin?.isActive ?? isEnabled,
          } as Plugin;
        });
        set({ plugins: merged, isLoading: false, registryVersion: registry.version });
        return;
      }
    } catch {}

    if (saved.length > 0) {
      const withStates = saved.map((p: Plugin) => ({
        ...p,
        isInstalled: enabledIds.includes(p.id) || p.isInstalled || false,
      } as Plugin));
      set({ plugins: withStates, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  refreshRegistry: async () => {
    set({ isRefreshing: true });
    try {
      const registry = await pluginManager.fetchRegistry();
      if (registry && registry.plugins.length > 0) {
        const { plugins } = get();
        const enabledIds = await pluginManager.getEnabledIds();
        const merged = registry.plugins.map((p) => {
          const existing = plugins.find((ep) => ep.id === p.id);
          const isEnabled = enabledIds.includes(p.id) || existing?.isInstalled || false;
          return { ...p, isInstalled: isEnabled, isActive: existing?.isActive ?? isEnabled } as Plugin;
        });
        set({ plugins: merged, registryVersion: registry.version });
      }
    } finally {
      set({ isRefreshing: false });
    }
  },

  enablePlugin: async (id) => {
    await pluginManager.enablePlugin(id);
    const { plugins } = get();
    const updated = plugins.map((p) =>
      p.id === id ? { ...p, isInstalled: true, isActive: true } : p
    );
    storage.setPlugins(updated);
    set({ plugins: updated });
  },

  disablePlugin: async (id) => {
    await pluginManager.disablePlugin(id);
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

  getEnabledPlugins: () => get().plugins.filter((p) => p.isInstalled),
  getActivePlugins: () => get().plugins.filter((p) => p.isActive),
}));