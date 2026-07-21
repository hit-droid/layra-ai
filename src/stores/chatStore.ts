import { create } from 'zustand';
import type { Conversation, Message } from '@/types';
import { storage } from '@/utils/storage';
import { generateId } from '@/utils/id';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isStreaming: boolean;
  streamingContent: string;

  loadConversations: () => Promise<void>;
  createConversation: (characterId: string, title?: string) => string;
  getActiveConversation: () => Conversation | null;
  setActiveConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  setStreaming: (streaming: boolean) => void;
  appendStreamingContent: (content: string) => void;
  finalizeStreaming: (conversationId: string) => void;
  deleteConversation: (id: string) => void;
  clearConversations: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  isStreaming: false,
  streamingContent: '',

  loadConversations: async () => {
    const saved = await storage.getConversations<Conversation[]>([]);
    set({ conversations: saved });
  },

  createConversation: (characterId, title) => {
    const id = generateId();
    const conv: Conversation = {
      id,
      characterId,
      title: title || '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const { conversations } = get();
    const updated = [conv, ...conversations];
    storage.setConversations(updated);
    set({ conversations: updated, activeConversationId: id });
    return id;
  },

  getActiveConversation: () => {
    const { conversations, activeConversationId } = get();
    return conversations.find((c) => c.id === activeConversationId) || null;
  },

  setActiveConversation: (id) => {
    set({ activeConversationId: id });
  },

  addMessage: (conversationId, message) => {
    const { conversations } = get();
    const updated = conversations.map((c) =>
      c.id === conversationId
        ? { ...c, messages: [...c.messages, message], updatedAt: Date.now() }
        : c
    );
    storage.setConversations(updated);
    set({ conversations: updated });
  },

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  appendStreamingContent: (content) => {
    set((s) => ({ streamingContent: s.streamingContent + content }));
  },

  finalizeStreaming: (conversationId) => {
    const { streamingContent } = get();
    if (!streamingContent) {
      set({ isStreaming: false });
      return;
    }
    const message: Message = {
      id: generateId(),
      role: 'assistant',
      content: streamingContent,
      timestamp: Date.now(),
    };
    const { conversations } = get();
    const updated = conversations.map((c) =>
      c.id === conversationId
        ? { ...c, messages: [...c.messages, message], updatedAt: Date.now() }
        : c
    );
    storage.setConversations(updated);
    set({ conversations: updated, isStreaming: false, streamingContent: '' });
  },

  deleteConversation: (id) => {
    const { conversations, activeConversationId } = get();
    const updated = conversations.filter((c) => c.id !== id);
    storage.setConversations(updated);
    set({
      conversations: updated,
      activeConversationId: activeConversationId === id ? null : activeConversationId,
    });
  },

  clearConversations: () => {
    storage.setConversations([]);
    set({ conversations: [], activeConversationId: null });
  },
}));