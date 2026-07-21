import { create } from 'zustand';
import type { Plugin, PluginRegistry } from '@/types';
import { storage } from '@/utils/storage';
import { downloadManager } from '@/utils/downloadManager';

interface PluginState {
  plugins: Plugin[];
  isLoading: boolean;
  isRefreshing: boolean;
  registryVersion: string;
  loadPlugins: () => Promise<void>;
  refreshRegistry: () => Promise<void>;
  installPlugin: (id: string) => Promise<void>;
  uninstallPlugin: (id: string) => Promise<void>;
  togglePlugin: (id: string) => void;
  pauseDownload: (id: string) => void;
  getInstalledPlugins: () => Plugin[];
  getActivePlugins: () => Plugin[];
  getDownloadingPlugins: () => Plugin[];
  updatePluginDownloadState: (id: string, status: string, progress: number) => void;
}

export const usePluginStore = create<PluginState>((set, get) => ({
  plugins: [],
  isLoading: true,
  isRefreshing: false,
  registryVersion: '',

  loadPlugins: async () => {
    // 先加载本地缓存
    const saved = await storage.getPlugins<Plugin[]>([]);
    const downloadStates = await downloadManager.getDownloadStates();
    const installedIds = await downloadManager.getInstalledIds();

    // 尝试从远程获取注册表
    try {
      const registry = await downloadManager.fetchRegistry();
      if (registry && registry.plugins.length > 0) {
        const merged = registry.plugins.map((p) => {
          const savedPlugin = saved.find((s: Plugin) => s.id === p.id);
          const downloadState = downloadStates.find((ds) => ds.pluginId === p.id);
          const isInstalled = installedIds.includes(p.id) || savedPlugin?.isInstalled || false;
          return {
            ...p,
            isInstalled,
            isActive: savedPlugin?.isActive ?? isInstalled,
            downloadStatus: downloadState?.status || (isInstalled ? 'installed' : 'idle'),
            downloadProgress: downloadState?.progress || 0,
            localPath: downloadState?.localPath,
          } as Plugin;
        });
        set({
          plugins: merged,
          isLoading: false,
          registryVersion: registry.version,
        });
        return;
      }
    } catch {
      // 网络不可用，使用本地数据
    }

    // 回退到本地数据
    if (saved.length > 0) {
      const withStates = saved.map((p: Plugin) => {
        const ds = downloadStates.find((s) => s.pluginId === p.id);
        return {
          ...p,
          downloadStatus: ds?.status || (p.isInstalled ? 'installed' : 'idle'),
          downloadProgress: ds?.progress || 0,
          localPath: ds?.localPath,
        } as Plugin;
      });
      set({ plugins: withStates, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  refreshRegistry: async () => {
    set({ isRefreshing: true });
    try {
      const registry = await downloadManager.fetchRegistry();
      if (registry && registry.plugins.length > 0) {
        const { plugins } = get();
        const downloadStates = await downloadManager.getDownloadStates();
        const merged = registry.plugins.map((p) => {
          const existing = plugins.find((ep) => ep.id === p.id);
          const ds = downloadStates.find((s) => s.pluginId === p.id);
          return {
            ...p,
            isInstalled: existing?.isInstalled || false,
            isActive: existing?.isActive || false,
            downloadStatus: ds?.status || (existing?.isInstalled ? 'installed' : 'idle'),
            downloadProgress: ds?.progress || 0,
            localPath: ds?.localPath,
          } as Plugin;
        });
        set({ plugins: merged, registryVersion: registry.version });
      }
    } finally {
      set({ isRefreshing: false });
    }
  },

  installPlugin: async (id) => {
    const { plugins } = get();
    const plugin = plugins.find((p) => p.id === id);
    if (!plugin) return;

    // 如果已经安装了，直接标记
    if (plugin.isInstalled) {
      const updated = plugins.map((p) =>
        p.id === id ? { ...p, isInstalled: true, isActive: true } : p
      );
      storage.setPlugins(updated);
      set({ plugins: updated });
      return;
    }

    // 如果有下载链接，开始下载
    if (plugin.downloadUrl) {
      set({
        plugins: plugins.map((p) =>
          p.id === id ? { ...p, downloadStatus: 'downloading', downloadProgress: 0 } : p
        ),
      });

      // 监听下载进度
      downloadManager.onProgress(id, async (progress, status) => {
        const { plugins: current } = get();
        const updated = current.map((p) =>
          p.id === id
            ? {
                ...p,
                downloadStatus: status as Plugin['downloadStatus'],
                downloadProgress: progress,
                isInstalled: status === 'installed',
                isActive: status === 'installed',
              }
            : p
        );
        set({ plugins: updated });

        if (status === 'installed' || status === 'failed') {
          storage.setPlugins(updated);
        }
      });

      await downloadManager.startDownload(plugin);
    } else {
      // 没有下载链接，直接标记为安装
      const updated = plugins.map((p) =>
        p.id === id ? { ...p, isInstalled: true, isActive: true } : p
      );
      storage.setPlugins(updated);
      set({ plugins: updated });
    }
  },

  uninstallPlugin: async (id) => {
    const { plugins } = get();
    await downloadManager.uninstallPlugin(id);
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
    downloadManager.pauseDownload(id);
  },

  getInstalledPlugins: () => {
    return get().plugins.filter((p) => p.isInstalled);
  },

  getActivePlugins: () => {
    return get().plugins.filter((p) => p.isActive);
  },

  getDownloadingPlugins: () => {
    return get().plugins.filter(
      (p) => p.downloadStatus === 'downloading' || p.downloadStatus === 'paused'
    );
  },

  updatePluginDownloadState: (id, status, progress) => {
    const { plugins } = get();
    set({
      plugins: plugins.map((p) =>
        p.id === id
          ? {
              ...p,
              downloadStatus: status as Plugin['downloadStatus'],
              downloadProgress: progress,
            }
          : p
      ),
    });
  },
}));