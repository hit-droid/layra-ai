import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Plugin, PluginRegistry } from '@/types';

const REGISTRY_URL = 'https://raw.githubusercontent.com/hit-droid/layra-ai/main/plugin-registry.json';
const REGISTRY_CACHE_KEY = '@layra/plugin-registry-cache';
const INSTALLED_KEY = '@layra/plugin-enabled';

class PluginManager {
  private listeners: Map<string, Set<() => void>> = new Map();

  // 获取远程插件注册表（从 GitHub 拉取最新插件列表）
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

  // 获取已启用的插件 ID 列表
  async getEnabledIds(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(INSTALLED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // 启用插件（即时生效，无需下载）
  async enablePlugin(pluginId: string): Promise<void> {
    const ids = await this.getEnabledIds();
    if (!ids.includes(pluginId)) {
      ids.push(pluginId);
      await AsyncStorage.setItem(INSTALLED_KEY, JSON.stringify(ids));
    }
    this.listeners.get(pluginId)?.forEach((cb) => cb());
  }

  // 禁用插件
  async disablePlugin(pluginId: string): Promise<void> {
    const ids = await this.getEnabledIds();
    const filtered = ids.filter((id) => id !== pluginId);
    await AsyncStorage.setItem(INSTALLED_KEY, JSON.stringify(filtered));
    this.listeners.get(pluginId)?.forEach((cb) => cb());
  }

  // 监听插件启用/禁用变化
  onChange(pluginId: string, callback: () => void): () => void {
    if (!this.listeners.has(pluginId)) {
      this.listeners.set(pluginId, new Set());
    }
    this.listeners.get(pluginId)!.add(callback);
    return () => {
      this.listeners.get(pluginId)?.delete(callback);
    };
  }
}

export const pluginManager = new PluginManager();