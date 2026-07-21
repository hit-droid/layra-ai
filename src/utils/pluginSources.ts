// 多源插件聚合器 - 从真实外部平台拉取插件
// 来源: F-Droid (开源安卓应用), GitHub Releases, 内置功能模块

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Plugin } from '@/types';

const CACHE_KEY = '@layra/external-plugins';
const CACHE_TTL = 3600000; // 1小时缓存

// ====== 插件源接口 ======
export interface PluginSource {
  id: string;
  name: string;
  icon: string;
  description: string;
  fetchPlugins: () => Promise<Plugin[]>;
}

// ====== F-Droid 源 (真实开源安卓应用) ======
// API: https://f-droid.org/repo/index-v1.json
const FDROID_REPO_INDEX = 'https://f-droid.org/repo/index-v2.json';

// AI/工具相关的 F-Droid 包名精选列表
const FDROID_AI_PACKAGES = [
  // AI 助手类
  'com.openai.chatgpt',
  // 终端/开发工具
  'com.termux',
  // 笔记/知识管理
  'com.ichi2.anki',
  'org.wikimedia.wikipedia',
  // 效率工具
  'com.simplemobiletools.calendar.pro',
  'com.simplemobiletools.notes.pro',
  // 文件管理
  'com.amaze.filemanager',
  // 浏览器
  'org.mozilla.fennec_fdroid',
  // 图像/创作
  'com.simplemobiletools.gallery.pro',
  'org.koitharu.kotatsu',
  // 音频
  'com.simplemobiletools.musicplayer',
  'org.antennapod.antennapod',
  // 开发工具
  'com.termux.api',
  'com.hipipal.qpyplus',
  // 科学/教育
  'org.kiwix.kiwixmobile',
  'com.dozingcatsoftware.mouse_piano',
  // 系统工具
  'com.simplemobiletools.filemanager.pro',
  'org.fossify.voicerecorder',
  'com.simplemobiletools.clock',
  'com.simplemobiletools.draw.pro',
];

const FDROID_PACKAGE_API = 'https://f-droid.org/api/v1/packages/';

interface FdroidPackage {
  packageName: string;
  name: string;
  summary: string;
  description: string;
  license: string;
  categories: string[];
  icon: string;
  suggestedVersionCode: string;
  suggestedVersionName: string;
  packages: {
    versionCode: number;
    versionName: string;
    apkName: string;
    size: number;
    hash: string;
    hashType: string;
    added: number;
  }[];
}

function mapCategory(categories: string[]): Plugin['category'] {
  const cat = categories[0]?.toLowerCase() || '';
  if (cat.includes('development') || cat.includes('coding')) return 'developer';
  if (cat.includes('graphics') || cat.includes('multimedia')) return 'creative';
  if (cat.includes('games') || cat.includes('entertainment')) return 'entertainment';
  if (cat.includes('science') || cat.includes('education')) return 'education';
  if (cat.includes('office') || cat.includes('productivity')) return 'productivity';
  return 'utility';
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '未知';
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
  return `${(bytes / 1024).toFixed(0)}KB`;
}

const fdroidSource: PluginSource = {
  id: 'fdroid',
  name: 'F-Droid',
  icon: '🤖',
  description: '开源安卓应用市场 · 真实可下载',
  fetchPlugins: async () => {
    try {
      const results: Plugin[] = [];
      // 并行获取包信息
      const batchSize = 5;
      for (let i = 0; i < FDROID_AI_PACKAGES.length; i += batchSize) {
        const batch = FDROID_AI_PACKAGES.slice(i, i + batchSize);
        const promises = batch.map(async (pkgName) => {
          try {
            const response = await fetch(`${FDROID_PACKAGE_API}${pkgName}`, {
              headers: { 'Accept': 'application/json' },
            });
            if (!response.ok) return null;
            const data: FdroidPackage = await response.json();
            const latestPkg = data.packages?.[0];
            const pkg = data.packages?.find(
              (p) => String(p.versionCode) === data.suggestedVersionCode
            ) || latestPkg;

            const downloadUrl = pkg
              ? `https://f-droid.org/repo/${pkg.apkName}`
              : undefined;

            return {
              id: `fdroid:${data.packageName}`,
              name: data.name || pkgName,
              version: data.suggestedVersionName || pkg?.versionName || '1.0',
              author: data.license || 'Open Source',
              description: data.summary || data.description?.slice(0, 200) || '',
              icon: data.icon ? '📱' : '📦',
              category: mapCategory(data.categories || []),
              isInstalled: false,
              isActive: false,
              rating: 4.0,
              downloads: 0,
              size: pkg?.size ? formatBytes(pkg.size) : '未知',
              sizeBytes: pkg?.size || 0,
              permissions: [],
              screenshots: [],
              downloadUrl,
              tags: data.categories || [],
              isFeatured: false,
              downloadStatus: 'idle' as const,
              downloadProgress: 0,
              // 标记来源
              source: 'F-Droid',
            } as Plugin;
          } catch {
            return null;
          }
        });
        const batchResults = await Promise.all(promises);
        results.push(...batchResults.filter(Boolean) as Plugin[]);
      }
      return results;
    } catch {
      return [];
    }
  },
};

// ====== GitHub 源 (AI 工具) ======
const GITHUB_AI_TOOLS = [
  { owner: 'AUTOMATIC1111', repo: 'stable-diffusion-webui', name: 'Stable Diffusion WebUI', desc: 'AI 图像生成界面', icon: '🎨' },
  { owner: 'oobabooga', repo: 'text-generation-webui', name: 'Text Generation WebUI', desc: '大语言模型本地运行', icon: '🤖' },
  { owner: 'lllyasviel', repo: 'Fooocus', name: 'Fooocus', desc: 'AI 图像生成 (简化版)', icon: '🖼️' },
  { owner: 'Mozilla-Ocho', repo: 'llamafile', name: 'llamafile', desc: '一键运行 LLM 模型', icon: '🦙' },
  { owner: 'open-webui', repo: 'open-webui', name: 'Open WebUI', desc: '自托管 AI 聊天界面', icon: '💬' },
  { owner: 'invoke-ai', repo: 'InvokeAI', name: 'InvokeAI', desc: '专业 AI 图像创作工具', icon: '🎯' },
  { owner: 'suno-ai', repo: 'bark', name: 'Bark', desc: 'AI 文本转语音', icon: '🎙️' },
  { owner: 'nocodb', repo: 'nocodb', name: 'NocoDB', desc: '智能数据库平台', icon: '📊' },
  { owner: 'n8n-io', repo: 'n8n', name: 'n8n', desc: 'AI 工作流自动化', icon: '⚡' },
  { owner: 'langgenius', repo: 'dify', name: 'Dify', desc: 'LLM 应用开发平台', icon: '🔧' },
];

const githubSource: PluginSource = {
  id: 'github',
  name: 'GitHub',
  icon: '🐙',
  description: 'GitHub 开源 AI 工具',
  fetchPlugins: async () => {
    try {
      const results = await Promise.all(
        GITHUB_AI_TOOLS.map(async (tool) => {
          try {
            const response = await fetch(
              `https://api.github.com/repos/${tool.owner}/${tool.repo}`,
              { headers: { 'Accept': 'application/vnd.github.v3+json' } }
            );
            if (!response.ok) return null;
            const data = await response.json();

            // 获取最新 Release
            let downloadUrl: string | undefined;
            let size = '未知';
            try {
              const releaseResp = await fetch(
                `https://api.github.com/repos/${tool.owner}/${tool.repo}/releases/latest`,
                { headers: { 'Accept': 'application/vnd.github.v3+json' } }
              );
              if (releaseResp.ok) {
                const release = await releaseResp.json();
                const asset = release.assets?.[0];
                if (asset) {
                  downloadUrl = asset.browser_download_url;
                  size = formatBytes(asset.size || 0);
                }
              }
            } catch {}

            return {
              id: `github:${tool.owner}/${tool.repo}`,
              name: tool.name,
              version: data.default_branch || 'main',
              author: tool.owner,
              description: tool.desc,
              icon: tool.icon,
              category: 'developer' as const,
              isInstalled: false,
              isActive: false,
              rating: data.stargazers_count ? Math.min(5, Math.round(data.stargazers_count / 10000 * 2) / 10 + 3) : 4.0,
              downloads: data.stargazers_count || 0,
              size,
              permissions: [],
              screenshots: [],
              downloadUrl,
              tags: data.topics || [],
              isFeatured: data.stargazers_count > 10000,
              downloadStatus: 'idle' as const,
              downloadProgress: 0,
              source: 'GitHub',
            } as Plugin;
          } catch {
            return null;
          }
        })
      );
      return results.filter(Boolean) as Plugin[];
    } catch {
      return [];
    }
  },
};

// ====== 内置源 (功能模块) ======
const builtinSource: PluginSource = {
  id: 'builtin',
  name: '内置',
  icon: '⚡',
  description: 'App 内置功能模块',
  fetchPlugins: async () => {
    // 从 registry 加载
    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/hit-droid/layra-ai/main/plugin-registry.json',
        { headers: { 'Cache-Control': 'no-cache' } }
      );
      if (response.ok) {
        const registry = await response.json();
        return (registry.plugins || []).map((p: any) => ({
          ...p,
          source: '内置',
          downloadStatus: 'idle' as const,
          downloadProgress: 0,
        }));
      }
    } catch {}
    return [];
  },
};

// ====== 聚合器 ======
export const PLUGIN_SOURCES: PluginSource[] = [fdroidSource, githubSource, builtinSource];

export async function fetchAllPlugins(): Promise<Plugin[]> {
  const all: Plugin[] = [];

  // 先尝试缓存
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        return data;
      }
    }
  } catch {}

  // 并行拉取所有源
  const results = await Promise.allSettled(
    PLUGIN_SOURCES.map((source) => source.fetchPlugins())
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      all.push(...result.value);
    }
  }

  // 缓存
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
      data: all,
      timestamp: Date.now(),
    }));
  } catch {}

  return all;
}

export async function getSourcePlugins(sourceId: string): Promise<Plugin[]> {
  const source = PLUGIN_SOURCES.find((s) => s.id === sourceId);
  if (!source) return [];
  return source.fetchPlugins();
}