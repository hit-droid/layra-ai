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
  permissions: string[];
  screenshots: string[];
  configSchema?: Record<string, unknown>;
}

export type PluginCategory = 'productivity' | 'creative' | 'entertainment' | 'developer' | 'education' | 'utility';

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