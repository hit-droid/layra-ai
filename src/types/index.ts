// 角色定义
export interface Character {
  id: string;
  name: string;
  avatar: string;
  personality: string;
  systemPrompt: string;
  isPreset: boolean;
  createdAt: number;
}

// 消息
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

// 对话会话
export interface Conversation {
  id: string;
  characterId: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// 生成的图像
export interface GeneratedImage {
  id: string;
  prompt: string;
  url: string;
  style: string;
  createdAt: number;
}

// 角色扮演场景
export interface RoleplayScenario {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  starterPrompt: string;
}

// 插件定义
export interface Plugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  icon: string;
  category: PluginCategory;
  isInstalled: boolean;
  isActive: boolean;
  rating: number;
  downloads: number;
  size: string;
  sizeBytes?: number;
  permissions: string[];
  screenshots: string[];
  downloadUrl?: string;
  tags?: string[];
  isFeatured?: boolean;
  configSchema?: Record<string, unknown>;
  // 下载状态
  downloadStatus?: 'idle' | 'downloading' | 'paused' | 'completed' | 'installed' | 'failed';
  downloadProgress?: number;
  localPath?: string;
}

export type PluginCategory = 'productivity' | 'creative' | 'entertainment' | 'developer' | 'education' | 'utility';

// 插件注册表
export interface PluginRegistry {
  version: string;
  updated: string;
  plugins: Plugin[];
}

// AI 工具
export interface AITool {
  id: string;
  name: string;
  provider: string;
  description: string;
  icon: string;
  category: ToolCategory;
  pricing: 'free' | 'freemium' | 'paid';
  apiType: 'rest' | 'graphql' | 'sdk';
  docsUrl: string;
  isConnected: boolean;
  apiKey?: string;
  endpoint?: string;
  features: string[];
  rating: number;
  users: number;
}

export type ToolCategory = 'text' | 'image' | 'audio' | 'video' | 'code' | 'data' | 'agent';

// 应用设置
export interface AppSettings {
  openaiKey: string;
  openaiModel: string;
  stabilityKey: string;
  elevenlabsKey: string;
  ttsEnabled: boolean;
  ttsSpeed: number;
  theme: 'dark' | 'light';
  accentColor: string;
  serverUrl: string;
}

// 图像风格
export type ImageStyle = 'photorealistic' | 'anime' | 'digital-art' | 'oil-painting' | '3d-render' | 'pixel-art';
export type ImageSize = '512x512' | '768x768' | '1024x1024';