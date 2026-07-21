import { create } from 'zustand';
import type { Plugin } from '@/types';
import { storage } from '@/utils/storage';
import { pluginManager } from '@/utils/downloadManager';
import { fetchAllPlugins, PLUGIN_SOURCES, getSourcePlugins } from '@/utils/pluginSources';

interface PluginState {
  plugins: Plugin[];
  isLoading: boolean;
  isRefreshing: boolean;
  sources: typeof PLUGIN_SOURCES;
  loadPlugins: () => Promise<void>;
  refreshAll: () => Promise<void>;
  enablePlugin: (id: string) => Promise<void>;
  disablePlugin: (id: string) => Promise<void>;
  togglePlugin: (id: string) => void;
  pauseDownload: (id: string) => void;
  updatePluginState: (id: string, updates: Partial<Plugin>) => void;
  getEnabledPlugins: () => Plugin[];
  getActivePlugins: () => Plugin[];
}

export const usePluginStore = create<PluginState>((set, get) => ({
  plugins: [],
  isLoading: true,
  isRefreshing: false,
  sources: PLUGIN_SOURCES,

  loadPlugins: async () => {
    set({ isLoading: true });
    const enabledIds = await pluginManager.getEnabledIds();

    try {
      const all = await fetchAllPlugins();
      const merged = await Promise.all(all.map(async (p) => {
        const isEnabled = enabledIds.includes(p.id);
        const isDownloaded = await pluginManager.isPluginDownloaded(p.id);
        return {
          ...p,
          isInstalled: isEnabled,
          isActive: isEnabled,
          downloadStatus: isDownloaded ? 'installed' : (isEnabled ? 'installed' : 'idle'),
          downloadProgress: isDownloaded ? 100 : 0,
        } as Plugin;
      }));
      set({ plugins: merged, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  refreshAll: async () => {
    set({ isRefreshing: true });
    try {
      const enabledIds = await pluginManager.getEnabledIds();
      const all = await fetchAllPlugins();
      const merged = await Promise.all(all.map(async (p) => {
        const isEnabled = enabledIds.includes(p.id);
        const isDownloaded = await pluginManager.isPluginDownloaded(p.id);
        return {
          ...p,
          isInstalled: isEnabled,
          isActive: isEnabled,
          downloadStatus: isDownloaded ? 'installed' : (isEnabled ? 'installed' : 'idle'),
          downloadProgress: isDownloaded ? 100 : 0,
        } as Plugin;
      }));
      set({ plugins: merged, isRefreshing: false });
    } catch {
      set({ isRefreshing: false });
    }
  },

  enablePlugin: async (id) => {
    const { plugins } = get();
    const plugin = plugins.find((p) => p.id === id);
    if (!plugin) return;

    // 有 downloadUrl 的外部插件 → 真实下载
    if (plugin.downloadUrl) {
      set({
        plugins: plugins.map((p) =>
          p.id === id ? { ...p, downloadStatus: 'downloading', downloadProgress: 0 } : p
        ),
      });

      const success = await pluginManager.startDownload(plugin, (progress, status) => {
        const { plugins: current } = get();
        set({
          plugins: current.map((p) =>
            p.id === id
              ? {
                  ...p,
                  downloadStatus: status as Plugin['downloadStatus'],
                  downloadProgress: progress,
                  isInstalled: status === 'installed',
                  isActive: status === 'installed',
                }
              : p
          ),
        });
      });

      if (success) {
        await pluginManager.enablePlugin(id);
        const { plugins: current } = get();
        const updated = current.map((p) =>
          p.id === id ? { ...p, isInstalled: true, isActive: true, downloadStatus: 'installed', downloadProgress: 100 } : p
        );
        storage.setPlugins(updated);
        set({ plugins: updated });
      }
      return;
    }

    // 内置功能 → 即时启用
    await pluginManager.enablePlugin(id);
    const updated = plugins.map((p) =>
      p.id === id ? { ...p, isInstalled: true, isActive: true } : p
    );
    storage.setPlugins(updated);
    set({ plugins: updated });
  },

  disablePlugin: async (id) => {
    const { plugins } = get();
    await pluginManager.uninstallPlugin(id);
    const updated = plugins.map((p) =>
      p.id === id
        ? { ...p, isInstalled: false, isActive: false, downloadStatus: 'idle', downloadProgress: 0 }
        : p
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

  pauseDownload: (id) => {
    pluginManager.pauseDownload(id);
    const { plugins } = get();
    set({
      plugins: plugins.map((p) =>
        p.id === id ? { ...p, downloadStatus: 'paused' } : p
      ),
    });
  },

  updatePluginState: (id, updates) => {
    const { plugins } = get();
    set({
      plugins: plugins.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    });
  },

  getEnabledPlugins: () => get().plugins.filter((p) => p.isInstalled),
  getActivePlugins: () => get().plugins.filter((p) => p.isActive),
}));