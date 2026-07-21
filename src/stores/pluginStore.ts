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
  // 启用插件：有downloadUrl则下载，否则即时启用
  enablePlugin: (id: string) => Promise<void>;
  disablePlugin: (id: string) => Promise<void>;
  togglePlugin: (id: string) => void;
  pauseDownload: (id: string) => void;
  getEnabledPlugins: () => Plugin[];
  getActivePlugins: () => Plugin[];
  updatePluginState: (id: string, updates: Partial<Plugin>) => void;
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
        const merged = await Promise.all(registry.plugins.map(async (p) => {
          const savedPlugin = saved.find((s: Plugin) => s.id === p.id);
          const isEnabled = enabledIds.includes(p.id) || savedPlugin?.isInstalled || false;
          const isDownloaded = await pluginManager.isPluginDownloaded(p.id);
          return {
            ...p,
            isInstalled: isEnabled,
            isActive: savedPlugin?.isActive ?? isEnabled,
            downloadStatus: isDownloaded ? 'installed' : (isEnabled ? 'installed' : 'idle'),
            downloadProgress: isDownloaded ? 100 : 0,
          } as Plugin;
        }));
        set({ plugins: merged, isLoading: false, registryVersion: registry.version });
        return;
      }
    } catch {}

    if (saved.length > 0) {
      set({ plugins: saved, isLoading: false });
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
        const merged = await Promise.all(registry.plugins.map(async (p) => {
          const existing = plugins.find((ep) => ep.id === p.id);
          const isEnabled = enabledIds.includes(p.id) || existing?.isInstalled || false;
          const isDownloaded = await pluginManager.isPluginDownloaded(p.id);
          return {
            ...p,
            isInstalled: isEnabled,
            isActive: existing?.isActive ?? isEnabled,
            downloadStatus: isDownloaded ? 'installed' : (isEnabled ? 'installed' : 'idle'),
            downloadProgress: isDownloaded ? 100 : 0,
          } as Plugin;
        }));
        set({ plugins: merged, registryVersion: registry.version });
      }
    } finally {
      set({ isRefreshing: false });
    }
  },

  enablePlugin: async (id) => {
    const { plugins } = get();
    const plugin = plugins.find((p) => p.id === id);
    if (!plugin) return;

    // 如果有 downloadUrl，先下载
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

    // 无 downloadUrl = 即时启用功能模块
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

  getEnabledPlugins: () => get().plugins.filter((p) => p.isInstalled),
  getActivePlugins: () => get().plugins.filter((p) => p.isActive),

  updatePluginState: (id, updates) => {
    const { plugins } = get();
    set({
      plugins: plugins.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    });
  },
}));