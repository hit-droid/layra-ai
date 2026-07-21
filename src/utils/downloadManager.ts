import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Plugin, PluginRegistry } from '@/types';

const REGISTRY_URL = 'https://raw.githubusercontent.com/hit-droid/layra-ai/main/plugin-registry.json';
const REGISTRY_CACHE_KEY = '@layra/plugin-registry-cache';
const DOWNLOAD_STATE_KEY = '@layra/plugin-downloads';
const INSTALLED_KEY = '@layra/plugin-installed';

interface DownloadState {
  pluginId: string;
  status: 'idle' | 'downloading' | 'paused' | 'completed' | 'installed' | 'failed';
  progress: number;
  localPath?: string;
  error?: string;
}

class DownloadManager {
  private activeDownloads: Map<string, { timer: NodeJS.Timeout | null; cancelled: boolean }> = new Map();
  private listeners: Map<string, Set<(progress: number, status: string) => void>> = new Map();

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

  async getDownloadStates(): Promise<DownloadState[]> {
    try {
      const raw = await AsyncStorage.getItem(DOWNLOAD_STATE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // 获取已安装的插件 ID 列表
  async getInstalledIds(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(INSTALLED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

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

  private async markInstalled(pluginId: string): Promise<void> {
    const ids = await this.getInstalledIds();
    if (!ids.includes(pluginId)) {
      ids.push(pluginId);
      await AsyncStorage.setItem(INSTALLED_KEY, JSON.stringify(ids));
    }
  }

  async unmarkInstalled(pluginId: string): Promise<void> {
    const ids = await this.getInstalledIds();
    const filtered = ids.filter((id) => id !== pluginId);
    await AsyncStorage.setItem(INSTALLED_KEY, JSON.stringify(filtered));
  }

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

  async startDownload(plugin: Plugin): Promise<void> {
    const sizeMB = plugin.sizeBytes ? plugin.sizeBytes / (1024 * 1024) : 100;
    // 模拟下载速度：5-10 MB/s，加上随机波动
    const speedMBps = 5 + Math.random() * 5;
    const totalSeconds = sizeMB / speedMBps;
    const steps = 50; // 50步动画
    const intervalMs = (totalSeconds * 1000) / steps;

    const download = { timer: null as NodeJS.Timeout | null, cancelled: false };
    this.activeDownloads.set(plugin.id, download);

    await this.saveDownloadState({
      pluginId: plugin.id,
      status: 'downloading',
      progress: 0,
    });
    this.notify(plugin.id, 0, 'downloading');

    let step = 0;

    return new Promise((resolve) => {
      download.timer = setInterval(async () => {
        if (download.cancelled) {
          clearInterval(download.timer!);
          this.activeDownloads.delete(plugin.id);
          resolve();
          return;
        }

        step++;
        // 进度不均匀增长，模拟真实下载（前期快，后期慢，偶尔卡顿）
        let progress: number;
        if (step <= 5) {
          progress = step * 3 + Math.random() * 5; // 前5步：快速加速到 ~20%
        } else if (step <= 30) {
          progress = 20 + ((step - 5) / 25) * 55 + (Math.random() - 0.5) * 8; // 中期稳步增长
        } else if (step <= 45) {
          progress = 75 + ((step - 30) / 15) * 20 + (Math.random() - 0.5) * 3; // 后期缓慢
        } else {
          progress = 95 + ((step - 45) / 5) * 5; // 最后 5%
        }

        progress = Math.min(Math.round(progress), 100);

        if (step >= steps || progress >= 100) {
          clearInterval(download.timer!);
          this.activeDownloads.delete(plugin.id);

          // 下载完成 → 安装
          await this.saveDownloadState({
            pluginId: plugin.id,
            status: 'completed',
            progress: 100,
            localPath: `file:///data/plugins/${plugin.id}.apk`,
          });
          this.notify(plugin.id, 100, 'completed');

          // 短暂延迟后安装完成
          setTimeout(async () => {
            await this.markInstalled(plugin.id);
            await this.saveDownloadState({
              pluginId: plugin.id,
              status: 'installed',
              progress: 100,
              localPath: `file:///data/plugins/${plugin.id}.apk`,
            });
            this.notify(plugin.id, 100, 'installed');
          }, 500);

          resolve();
        } else {
          this.notify(plugin.id, progress, 'downloading');
        }
      }, intervalMs);
    });
  }

  async pauseDownload(pluginId: string): Promise<void> {
    const download = this.activeDownloads.get(pluginId);
    if (download) {
      download.cancelled = true;
      if (download.timer) {
        clearInterval(download.timer);
      }
      this.activeDownloads.delete(pluginId);

      // 保存当前进度
      const states = await this.getDownloadStates();
      const current = states.find((s) => s.pluginId === pluginId);
      await this.saveDownloadState({
        pluginId,
        status: 'paused',
        progress: current?.progress || 0,
      });
      this.notify(pluginId, current?.progress || 0, 'paused');
    }
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    await this.unmarkInstalled(pluginId);
    const states = await this.getDownloadStates();
    const filtered = states.filter((s) => s.pluginId !== pluginId);
    await AsyncStorage.setItem(DOWNLOAD_STATE_KEY, JSON.stringify(filtered));
    this.notify(pluginId, 0, 'idle');
  }

  async clearAll(): Promise<void> {
    this.activeDownloads.forEach((d) => {
      d.cancelled = true;
      if (d.timer) clearInterval(d.timer);
    });
    this.activeDownloads.clear();
    await AsyncStorage.removeItem(DOWNLOAD_STATE_KEY);
  }
}

export const downloadManager = new DownloadManager();