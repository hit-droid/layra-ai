import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Plugin, PluginRegistry } from '@/types';

const REGISTRY_URL = 'https://raw.githubusercontent.com/hit-droid/layra-ai/main/plugin-registry.json';
const REGISTRY_CACHE_KEY = '@layra/plugin-registry-cache';
const DOWNLOAD_STATE_KEY = '@layra/plugin-downloads';

interface DownloadState {
  pluginId: string;
  status: 'idle' | 'downloading' | 'paused' | 'completed' | 'installed' | 'failed';
  progress: number;
  localPath?: string;
  error?: string;
}

class DownloadManager {
  private activeDownloads: Map<string, AbortController> = new Map();
  private listeners: Map<string, Set<(progress: number, status: string) => void>> = new Map();

  // 获取远程插件注册表
  async fetchRegistry(): Promise<PluginRegistry | null> {
    try {
      const response = await fetch(REGISTRY_URL, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const registry: PluginRegistry = await response.json();
      // 缓存到本地
      await AsyncStorage.setItem(REGISTRY_CACHE_KEY, JSON.stringify(registry));
      return registry;
    } catch (err) {
      // 网络失败时使用缓存
      const cached = await AsyncStorage.getItem(REGISTRY_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached) as PluginRegistry;
      }
      return null;
    }
  }

  // 获取已保存的下载状态
  async getDownloadStates(): Promise<DownloadState[]> {
    try {
      const raw = await AsyncStorage.getItem(DOWNLOAD_STATE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // 保存下载状态
  private async saveDownloadState(state: DownloadState): Promise<void> {
    const states = await this.getDownloadStates();
    const idx = states.findIndex((s) => s.pluginId === state.pluginId);
    if (idx >= 0) {
      states[idx] = state;
    } else {
      states.push(state);
    }
    await AsyncStorage.setItem(DOWNLOAD_STATE_KEY, JSON.stringify(states));
  }

  // 监听下载进度
  onProgress(pluginId: string, callback: (progress: number, status: string) => void): () => void {
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

  // 开始下载
  async startDownload(plugin: Plugin): Promise<void> {
    const url = plugin.downloadUrl;
    if (!url) {
      await this.saveDownloadState({
        pluginId: plugin.id,
        status: 'failed',
        progress: 0,
        error: '无下载链接',
      });
      this.notify(plugin.id, 0, 'failed');
      return;
    }

    const controller = new AbortController();
    this.activeDownloads.set(plugin.id, controller);

    try {
      // 更新状态：开始下载
      await this.saveDownloadState({
        pluginId: plugin.id,
        status: 'downloading',
        progress: 0,
      });
      this.notify(plugin.id, 0, 'downloading');

      // 使用 XMLHttpRequest 来跟踪下载进度
      const response = await fetch(url, {
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : plugin.sizeBytes || 0;

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        received += value.length;

        const progress = total > 0 ? Math.round((received / total) * 100) : 0;
        // 每 5% 或每 1MB 通知一次
        if (progress % 5 === 0 || received % (1024 * 1024) === 0) {
          this.notify(plugin.id, progress, 'downloading');
        }
      }

      // 下载完成
      const blob = new Blob(chunks);
      const localPath = `file:///data/local/tmp/${plugin.id}.apk`;

      await this.saveDownloadState({
        pluginId: plugin.id,
        status: 'completed',
        progress: 100,
        localPath,
      });
      this.notify(plugin.id, 100, 'completed');

      // 自动安装
      await this.installPlugin(plugin.id, localPath);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        await this.saveDownloadState({
          pluginId: plugin.id,
          status: 'paused',
          progress: 0,
        });
        this.notify(plugin.id, 0, 'paused');
      } else {
        await this.saveDownloadState({
          pluginId: plugin.id,
          status: 'failed',
          progress: 0,
          error: err.message || '下载失败',
        });
        this.notify(plugin.id, 0, 'failed');
      }
    } finally {
      this.activeDownloads.delete(plugin.id);
    }
  }

  // 暂停下载
  async pauseDownload(pluginId: string): Promise<void> {
    const controller = this.activeDownloads.get(pluginId);
    if (controller) {
      controller.abort();
    }
  }

  // 安装插件
  private async installPlugin(pluginId: string, localPath: string): Promise<void> {
    await this.saveDownloadState({
      pluginId,
      status: 'installed',
      progress: 100,
      localPath,
    });
    this.notify(pluginId, 100, 'installed');
  }

  // 卸载插件
  async uninstallPlugin(pluginId: string): Promise<void> {
    const states = await this.getDownloadStates();
    const filtered = states.filter((s) => s.pluginId !== pluginId);
    await AsyncStorage.setItem(DOWNLOAD_STATE_KEY, JSON.stringify(filtered));
    this.notify(pluginId, 0, 'idle');
  }

  // 清除所有下载
  async clearAll(): Promise<void> {
    // 取消所有活跃下载
    this.activeDownloads.forEach((controller) => controller.abort());
    this.activeDownloads.clear();
    await AsyncStorage.removeItem(DOWNLOAD_STATE_KEY);
  }
}

export const downloadManager = new DownloadManager();