import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '@/theme';
import { useChatStore } from '@/stores/chatStore';
import { useCharacterStore } from '@/stores/characterStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { generateId } from '@/utils/id';

export function ChatInput() {
  const [input, setInput] = useState('');
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const addMessage = useChatStore((s) => s.addMessage);
  const appendStreamingContent = useChatStore((s) => s.appendStreamingContent);
  const finalizeStreaming = useChatStore((s) => s.finalizeStreaming);
  const createConversation = useChatStore((s) => s.createConversation);
  const conversations = useChatStore((s) => s.conversations);
  const getActiveCharacter = useCharacterStore((s) => s.getActiveCharacter);
  const settings = useSettingsStore((s) => s.settings);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    let convId = activeConversationId;
    if (!convId) {
      const char = getActiveCharacter();
      convId = createConversation(char.id, text.slice(0, 30));
    }

    const userMessage = {
      id: generateId(),
      role: 'user' as const,
      content: text,
      timestamp: Date.now(),
    };
    addMessage(convId, userMessage);
    setInput('');

    const character = getActiveCharacter();
    const conv = conversations.find((c) => c.id === convId);
    const messages = (conv?.messages || []).concat(userMessage).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const serverUrl = settings.serverUrl || 'http://localhost:3001';
      const response = await fetch(`${serverUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-openai-key': settings.openaiKey,
        },
        body: JSON.stringify({
          messages,
          character: {
            name: character.name,
            systemPrompt: character.systemPrompt,
          },
          model: settings.openaiModel,
        }),
      });

      if (!response.ok) {
        const errorMsg = '请求失败，请检查 API Key 和网络';
        addMessage(convId, {
          id: generateId(),
          role: 'assistant',
          content: `❌ ${errorMsg}`,
          timestamp: Date.now(),
        });
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            finalizeStreaming(convId);
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              appendStreamingContent(parsed.content);
            }
          } catch {}
        }
      }
      finalizeStreaming(convId);
    } catch {
      addMessage(convId, {
        id: generateId(),
        role: 'assistant',
        content: '❌ 网络连接失败，请检查服务器状态',
        timestamp: Date.now(),
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.container}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="输入消息..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!isStreaming}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || isStreaming}
          >
            <Text style={styles.sendBtnText}>发送</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(168, 85, 247, 0.1)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.15)',
  },
  input: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    maxHeight: 120,
  },
  sendBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm + 2,
    margin: 2,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: '#fff',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
});