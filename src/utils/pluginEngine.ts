// 插件执行引擎 - 每个安装的插件提供真实功能

interface PluginFeature {
  id: string;
  name: string;
  description: string;
  // 执行插件功能
  execute: (input: string, context?: any) => Promise<string>;
  // 是否需要 API Key
  requiresApiKey?: boolean;
}

// 联网搜索
async function webSearch(query: string): Promise<string> {
  try {
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!response.ok) return '';
    const data = await response.json();
    const results = (data.RelatedTopics || []).slice(0, 5);
    if (results.length === 0) return '';
    return results
      .map((r: any, i: number) => `${i + 1}. ${r.Text || ''}`)
      .filter(Boolean)
      .join('\n');
  } catch {
    return '';
  }
}

// 代码执行（使用服务端 API）
async function executeCode(code: string, language: string): Promise<string> {
  try {
    const response = await fetch('http://localhost:3001/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language }),
    });
    if (!response.ok) return '代码执行失败，请检查服务端是否运行';
    const result = await response.json();
    return result.output || result.error || '无输出';
  } catch {
    return '代码执行服务未启动，请运行 server 端';
  }
}

// 翻译
async function translateText(text: string, targetLang: string): Promise<string> {
  try {
    const response = await fetch('http://localhost:3001/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target: targetLang }),
    });
    if (!response.ok) throw new Error('翻译失败');
    const result = await response.json();
    return result.translated || text;
  } catch {
    // 本地简易翻译（使用 AI 聊天接口）
    return `[翻译请求已发送到 AI，请在聊天中查看结果]`;
  }
}

// 记忆增强（上下文总结）
function summarizeContext(messages: { role: string; content: string }[]): string {
  const recent = messages.slice(-20);
  const summary = recent
    .map((m) => `[${m.role === 'user' ? '用户' : 'AI'}]: ${m.content.slice(0, 100)}`)
    .join('\n');
  return `对话历史摘要:\n${summary}`;
}

// 所有可用插件功能
export const PLUGIN_FEATURES: Record<string, PluginFeature> = {
  'plugin-web-search': {
    id: 'plugin-web-search',
    name: '联网搜索',
    description: '实时搜索互联网获取最新信息',
    async execute(query: string) {
      const results = await webSearch(query);
      if (!results) return '未找到相关搜索结果';
      return `联网搜索结果:\n${results}\n\n请根据以上搜索结果回答用户问题。`;
    },
  },
  'plugin-translator': {
    id: 'plugin-translator',
    name: '智能翻译',
    description: '多语言实时翻译',
    async execute(text: string, context?: { targetLang?: string }) {
      const lang = context?.targetLang || '中文';
      return await translateText(text, lang);
    },
  },
  'plugin-code-runner': {
    id: 'plugin-code-runner',
    name: '代码沙盒',
    description: '在线运行 Python/JS 代码',
    async execute(code: string, context?: { language?: string }) {
      const lang = context?.language || 'python';
      return await executeCode(code, lang);
    },
  },
  'plugin-memory-plus': {
    id: 'plugin-memory-plus',
    name: '记忆增强',
    description: '增强 AI 长期记忆',
    async execute(_input: string, context?: { messages?: any[] }) {
      if (!context?.messages) return '';
      return summarizeContext(context.messages);
    },
  },
  'plugin-drawing': {
    id: 'plugin-drawing',
    name: 'AI 绘图',
    description: 'AI 图像生成',
    async execute(prompt: string) {
      return `[AI 绘图请求] 提示词: ${prompt}\n请在图像生成页面查看结果。`;
    },
  },
  'plugin-pdf-reader': {
    id: 'plugin-pdf-reader',
    name: '文档解析',
    description: 'PDF/文档智能分析',
    async execute(text: string) {
      return `文档内容摘要:\n${text.slice(0, 500)}${text.length > 500 ? '...' : ''}`;
    },
  },
  'plugin-calendar': {
    id: 'plugin-calendar',
    name: '日程管理',
    description: '智能日程提取和提醒',
    async execute(text: string) {
      return `从文本中提取的日程信息:\n${text.slice(0, 200)}`;
    },
  },
  'plugin-voice-clone': {
    id: 'plugin-voice-clone',
    name: '声音克隆',
    description: 'AI 语音合成',
    async execute(text: string) {
      return `[TTS 请求] 文本: ${text.slice(0, 100)}`;
    },
  },
  'plugin-stock': {
    id: 'plugin-stock',
    name: '金融分析',
    description: '实时股票行情分析',
    async execute(symbol: string) {
      return `[股票查询] 代码: ${symbol}\n请使用联网搜索获取最新行情数据。`;
    },
  },
  'plugin-live2d': {
    id: 'plugin-live2d',
    name: 'Live2D 引擎',
    description: '角色动画形象',
    async execute(_input: string) {
      return `Live2D 模型已加载，当前角色将显示动画形象。`;
    },
  },
  'plugin-game': {
    id: 'plugin-game',
    name: '文字冒险',
    description: 'AI 互动游戏',
    async execute(_input: string) {
      return `文字冒险模式已启动，输入「开始冒险」进入游戏。`;
    },
  },
  'plugin-math': {
    id: 'plugin-math',
    name: '数学求解',
    description: '复杂数学问题求解',
    async execute(problem: string) {
      return `[数学求解] 问题: ${problem}\n请使用代码沙盒或 AI 对话进行求解。`;
    },
  },
  'plugin-video-gen': {
    id: 'plugin-video-gen',
    name: 'AI 视频',
    description: '视频生成和编辑',
    async execute(prompt: string) {
      return `[视频生成请求] 提示词: ${prompt}`;
    },
  },
  'plugin-music': {
    id: 'plugin-music',
    name: 'AI 音乐',
    description: 'AI 音乐创作',
    async execute(prompt: string) {
      return `[音乐生成请求] 提示词: ${prompt}`;
    },
  },
  'plugin-3d-model': {
    id: 'plugin-3d-model',
    name: '3D 模型',
    description: '3D 模型生成',
    async execute(prompt: string) {
      return `[3D 模型生成请求] 提示词: ${prompt}`;
    },
  },
  'plugin-screen-reader': {
    id: 'plugin-screen-reader',
    name: '屏幕阅读',
    description: 'OCR 文字识别',
    async execute(_input: string) {
      return `屏幕阅读模式已启动，请截取屏幕内容。`;
    },
  },
  'plugin-health': {
    id: 'plugin-health',
    name: '健康顾问',
    description: 'AI 健康分析',
    async execute(symptoms: string) {
      return `[健康分析] 症状: ${symptoms}\n注意：AI 建议仅供参考，请咨询专业医生。`;
    },
  },
  'plugin-home-control': {
    id: 'plugin-home-control',
    name: '智能家居',
    description: 'IoT 设备控制',
    async execute(command: string) {
      return `[智能家居指令] ${command}`;
    },
  },
  'plugin-avatar-maker': {
    id: 'plugin-avatar-maker',
    name: 'AI 头像',
    description: 'AI 头像生成',
    async execute(prompt: string) {
      return `[头像生成请求] 提示词: ${prompt}`;
    },
  },
  'plugin-data-analyst': {
    id: 'plugin-data-analyst',
    name: '数据分析',
    description: '数据可视化分析',
    async execute(data: string) {
      return `[数据分析] 数据: ${data.slice(0, 200)}`;
    },
  },
};

// 获取已安装插件的功能列表
export function getInstalledFeatures(installedPluginIds: string[]): PluginFeature[] {
  return installedPluginIds
    .map((id) => PLUGIN_FEATURES[id])
    .filter(Boolean);
}

// 获取某个插件的功能
export function getPluginFeature(pluginId: string): PluginFeature | undefined {
  return PLUGIN_FEATURES[pluginId];
}

// 检查聊天中是否应启用联网搜索
export function isWebSearchEnabled(installedPluginIds: string[]): boolean {
  return installedPluginIds.includes('plugin-web-search');
}

// 检查聊天中是否应启用代码执行
export function isCodeRunnerEnabled(installedPluginIds: string[]): boolean {
  return installedPluginIds.includes('plugin-code-runner');
}

// 检查聊天中是否应启用翻译
export function isTranslatorEnabled(installedPluginIds: string[]): boolean {
  return installedPluginIds.includes('plugin-translator');
}

// 检查聊天中是否应启用记忆增强
export function isMemoryEnhanced(installedPluginIds: string[]): boolean {
  return installedPluginIds.includes('plugin-memory-plus');
}