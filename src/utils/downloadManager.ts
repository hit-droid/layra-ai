import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import type { Plugin, PluginRegistry } from '@/types';

const REGISTRY_URL = 'https://raw.githubusercontent.com/hit-droid/layra-ai/main/plugin-registry.json';
const REGISTRY_CACHE_KEY = '@layra/plugin-registry-cache';
const ENABLED_KEY = '@layra/plugin-enabled';
const DOWNLOAD_DIR = `${FileSystem.documentDirectory}plugins/`;

type DownloadCallback = (progress: number, status: string) => void;

interface ActiveDownload {
  resumable: FileSystem.DownloadResumable;
  callback: DownloadCallback;
}

class PluginManager {
  private activeDownloads: Map<string, ActiveDownload> = new Map();
  private listeners: Map<string, Set<DownloadCallback>> = new Map();

  async fetchRegistry(): Promise<PluginRegistry | null> {
    try {
      const response = await fetch(REGISTRY_URL, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const registry: PluginRegistry = await response.json();
      await AsyncStorage.setItem(REGISTRY_CACHE_KEY, JSON.stringify(registry));
      return registry;
    } catch {
      const cached = await AsyncStorage.getItem(REGISTRY_CACHE_KEY);
      if (cached) return JSON.parse(cached) as PluginRegistry;
      return null;
    }
  }

  async getEnabledIds(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(ENABLED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // 检查插件文件是否已下载
  async isPluginDownloaded(pluginId: string): Promise<boolean> {
    const dir = `${DOWNLOAD_DIR}${pluginId}/`;
    try {
      const info = await FileSystem.getInfoAsync(dir);
      return info.exists;
    } catch {
      return false;
    }
  }

  // 获取已下载插件的大小
  async getPluginSize(pluginId: string): Promise<number> {
    const dir = `${DOWNLOAD_DIR}${pluginId}/`;
    try {
      const files = await FileSystem.readDirectoryAsync(dir);
      let total = 0;
      for (const file of files) {
        const info = await FileSystem.getInfoAsync(`${dir}${file}`);
        if (info.exists && info.size) total += info.size;
      }
      return total;
    } catch {
      return 0;
    }
  }

  // 监听下载进度
  onProgress(pluginId: string, callback: DownloadCallback): () => void {
    if (!this.listeners.has(pluginId)) {
      this.listeners.set(pluginId, new Set());
    }
    this.listeners.get(pluginId)!.add(callback);
    return () => {
      this.listeners.get(pluginId)?.delete(callback);
    };
  }

  private notify(pluginId: string, progress: number, status: string): void {
    this.listeners.get(pluginId)?.forEach((cb) => cb(progress, status));
  }

  // 真正下载插件文件（使用 expo-file-system，支持进度跟踪和断点续传）
  async startDownload(plugin: Plugin, callback: DownloadCallback): Promise<boolean> {
    const url = plugin.downloadUrl;
    if (!url) {
      // 无下载链接 = 纯功能启用插件，直接标记完成
      callback(100, 'installed');
      return true;
    }

    const pluginDir = `${DOWNLOAD_DIR}${plugin.id}/`;
    const filePath = `${pluginDir}plugin.apk`;

    // 确保目录存在
    await FileSystem.makeDirectoryAsync(pluginDir, { intermediates: true });

    try {
      // 先检查是否已下载过
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists && fileInfo.size && fileInfo.size > 0) {
        callback(100, 'installed');
        return true;
      }

      // 创建可恢复下载
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        filePath,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesExpectedToWrite > 0
            ? Math.round((downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100)
            : 0;
          callback(progress, 'downloading');
        }
      );

      this.activeDownloads.set(plugin.id, {
        resumable: downloadResumable,
        callback,
      });

      const result = await downloadResumable.downloadAsync();
      this.activeDownloads.delete(plugin.id);

      if (result && result.uri) {
        callback(100, 'installed');
        return true;
      } else {
        callback(0, 'failed');
        return false;
      }
    } catch (error: any) {
      this.activeDownloads.delete(plugin.id);
      if (error.message?.includes('cancelled')) {
        // 用户暂停，保留部分下载文件以便恢复
        callback(0, 'paused');
      } else {
        callback(0, 'failed');
      }
      return false;
    }
  }

  // 暂停下载
  async pauseDownload(pluginId: string): Promise<void> {
    const download = this.activeDownloads.get(pluginId);
    if (download) {
      try {
        await download.resumable.pauseAsync();
      } catch {}
      this.activeDownloads.delete(pluginId);
      this.notify(pluginId, 0, 'paused');
    }
  }

  // 恢复下载
  async resumeDownload(plugin: Plugin, callback: DownloadCallback): Promise<boolean> {
    return this.startDownload(plugin, callback);
  }

  // 启用插件功能
  async enablePlugin(pluginId: string): Promise<void> {
    const ids = await this.getEnabledIds();
    if (!ids.includes(pluginId)) {
      ids.push(pluginId);
      await AsyncStorage.setItem(ENABLED_KEY, JSON.stringify(ids));
    }
  }

  // 禁用插件功能
  async disablePlugin(pluginId: string): Promise<void> {
    const ids = await this.getEnabledIds();
    const filtered = ids.filter((id) => id !== pluginId);
    await AsyncStorage.setItem(ENABLED_KEY, JSON.stringify(filtered));
  }

  // 删除已下载的插件文件
  async deletePluginFiles(pluginId: string): Promise<void> {
    const dir = `${DOWNLOAD_DIR}${pluginId}/`;
    try {
      await FileSystem.deleteAsync(dir, { idempotent: true });
    } catch {}
  }

  // 卸载插件（禁用 + 删文件）
  async uninstallPlugin(pluginId: string): Promise<void> {
    await this.disablePlugin(pluginId);
    await this.deletePluginFiles(pluginId);
  }

  // 获取下载目录总大小
  async getTotalDownloadSize(): Promise<number> {
    try {
      const info = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
      if (!info.exists) return 0;
      const dirs = await FileSystem.readDirectoryAsync(DOWNLOAD_DIR);
      let total = 0;
      for (const dir of dirs) {
        total += await this.getPluginSize(dir);
      }
      return total;
    } catch {
      return 0;
    }
  }
}

export const pluginManager = new PluginManager();