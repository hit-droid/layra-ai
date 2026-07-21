import { create } from 'zustand';
import type { AITool } from '@/types';
import { storage } from '@/utils/storage';
import { AI_TOOLS } from '@/data/tools';

interface ToolState {
  tools: AITool[];
  isLoading: boolean;
  loadTools: () => Promise<void>;
  connectTool: (id: string, apiKey?: string) => void;
  disconnectTool: (id: string) => void;
  updateToolConfig: (id: string, config: Partial<AITool>) => void;
  getConnectedTools: () => AITool[];
  getToolsByCategory: (category: string) => AITool[];
}

export const useToolStore = create<ToolState>((set, get) => ({
  tools: [],
  isLoading: true,

  loadTools: async () => {
    const saved = await storage.getTools<AITool[]>([]);
    const merged = AI_TOOLS.map((t) => {
      const savedTool = saved.find((s: AITool) => s.id === t.id);
      if (savedTool) {
        return { ...t, isConnected: savedTool.isConnected, apiKey: savedTool.apiKey };
      }
      return t;
    });
    set({ tools: merged, isLoading: false });
  },

  connectTool: (id, apiKey) => {
    const { tools } = get();
    const updated = tools.map((t) =>
      t.id === id ? { ...t, isConnected: true, apiKey: apiKey || t.apiKey } : t
    );
    storage.setTools(updated);
    set({ tools: updated });
  },

  disconnectTool: (id) => {
    const { tools } = get();
    const updated = tools.map((t) =>
      t.id === id ? { ...t, isConnected: false, apiKey: undefined } : t
    );
    storage.setTools(updated);
    set({ tools: updated });
  },

  updateToolConfig: (id, config) => {
    const { tools } = get();
    const updated = tools.map((t) => (t.id === id ? { ...t, ...config } : t));
    storage.setTools(updated);
    set({ tools: updated });
  },

  getConnectedTools: () => {
    return get().tools.filter((t) => t.isConnected);
  },

  getToolsByCategory: (category) => {
    return get().tools.filter((t) => t.category === category);
  },
}));