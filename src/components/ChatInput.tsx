import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '@/theme';
import { useChatStore } from '@/stores/chatStore';
import { useCharacterStore } from '@/stores/characterStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { generateId } from '@/utils/id';
import { getPluginFeature, isMemoryEnhanced } from '@/utils/pluginEngine';
import type { PluginFeature } from '@/utils/pluginEngine';

interface Props {
  webSearchEnabled?: boolean;
  hasCodeRunner?: boolean;
  hasMemory?: boolean;
  installedFeatures?: PluginFeature[];
}

export function ChatInput({ webSearchEnabled = false, hasCodeRunner = false, hasMemory = false, installedFeatures = [] }: Props) {
  const [input, setInput] = useState('');
  const [codeMode, setCodeMode] = useState(false);
  const [codeLang, setCodeLang] = useState('python');
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const addMessage = useChatStore((s) => s.addMessage);
  const appendStreamingContent = useChatStore((s) => s.appendStreamingContent);
  const finalizeStreaming = useChatStore((s) => s.finalizeStreaming);
  const createConversation = useChatStore((s) => s.createConversation);
  const conversations = useChatStore((s) => s.conversations);
  const getActiveCharacter = useCharacterStore((s) => s.getActiveCharacter);
  const settings = useSettingsStore((s) => s.settings);

  const plugins = useChatStore((s) => {
    const conv = s.conversations.find((c) => c.id === s.activeConversationId);
    return conv;
  });

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    let convId = activeConversationId;
    if (!convId) {
      const char = getActiveCharacter();
      convId = createConversation(char.id, text.slice(0, 30));
    }

    // 代码执行模式
    if (codeMode && hasCodeRunner) {
      addMessage(convId, {
        id: generateId(),
        role: 'user',
        content: `[代码执行 - ${codeLang}]\n${text}`,
        timestamp: Date.now(),
      });
      setInput('');
      setCodeMode(false);

      const codeFeature = getPluginFeature('plugin-code-runner');
      if (codeFeature) {
        try {
          const result = await codeFeature.execute(text, { language: codeLang });
          addMessage(convId, {
            id: generateId(),
            role: 'assistant',
            content: `\`\`\`${codeLang}\n${text}\n\`\`\`\n\n运行结果:\n${result}`,
            timestamp: Date.now(),
          });
        } catch {
          addMessage(convId, {
            id: generateId(),
            role: 'assistant',
            content: '代码执行失败，请检查服务端是否运行。',
            timestamp: Date.now(),
          });
        }
      }
      return;
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
    let messages = (conv?.messages || []).concat(userMessage).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 记忆增强：追加对话摘要
    if (hasMemory) {
      const memoryFeature = getPluginFeature('plugin-memory-plus');
      if (memoryFeature) {
        const summary = await memoryFeature.execute('', { messages });
        if (summary) {
          messages = [
            { role: 'system' as const, content: summary },
            ...messages,
          ];
        }
      }
    }

    // 联网搜索：在消息前追加搜索结果
    if (webSearchEnabled) {
      const searchFeature = getPluginFeature('plugin-web-search');
      if (searchFeature) {
        try {
          const searchResults = await searchFeature.execute(text);
          if (searchResults && !searchResults.startsWith('未找到')) {
            addMessage(convId, {
              id: generateId(),
              role: 'system',
              content: `🔍 ${searchResults}`,
              timestamp: Date.now(),
            });
          }
        } catch {}
      }
    }

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
      {/* Plugin Quick Actions */}
      {installedFeatures.length > 0 && (
        <View style={styles.quickActions}>
          {hasCodeRunner && (
            <TouchableOpacity
              style={[styles.quickBtn, codeMode && styles.quickBtnActive]}
              onPress={() => {
                setCodeMode(!codeMode);
                if (codeMode) setCodeLang('python');
              }}
            >
              <Text style={styles.quickBtnIcon}>💻</Text>
              <Text style={[styles.quickBtnLabel, codeMode && styles.quickBtnLabelActive]}>
                {codeMode ? `代码模式 (${codeLang})` : '代码'}
              </Text>
            </TouchableOpacity>
          )}
          {codeMode && (
            <TouchableOpacity
              style={styles.langBtn}
              onPress={() => setCodeLang(codeLang === 'python' ? 'javascript' : codeLang === 'javascript' ? 'typescript' : 'python')}
            >
              <Text style={styles.langBtnText}>
                {codeLang === 'python' ? '🐍 Py' : codeLang === 'javascript' ? '🟨 JS' : '🔷 TS'}
              </Text>
            </TouchableOpacity>
          )}
          {hasMemory && (
            <View style={styles.quickBtnStatic}>
              <Text style={styles.quickBtnIcon}>🧠</Text>
              <Text style={styles.quickBtnLabel}>记忆增强</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.container}>
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.voiceBtn}>
            <Text style={styles.voiceBtnText}>🎤</Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, codeMode && styles.codeInput]}
            value={input}
            onChangeText={setInput}
            placeholder={codeMode ? `输入 ${codeLang} 代码...` : '输入消息...'}
            placeholderTextColor={codeMode ? theme.colors.primary : theme.colors.textMuted}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!isStreaming}
          />

          {input.trim() ? (
            <TouchableOpacity
              style={[styles.sendBtn, codeMode && styles.sendBtnCode]}
              onPress={handleSend}
              disabled={isStreaming}
            >
              <Text style={styles.sendBtnIcon}>{codeMode ? '▶' : '↑'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(168, 85, 247, 0.1)',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 6,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  quickBtnActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  quickBtnIcon: {
    fontSize: 12,
  },
  quickBtnLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  quickBtnLabelActive: {
    color: theme.colors.success,
  },
  quickBtnStatic: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  langBtn: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  langBtnText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.15)',
  },
  voiceBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceBtnText: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.text,
    maxHeight: 120,
  },
  codeInput: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: theme.colors.success,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
  },
  sendBtnCode: {
    backgroundColor: theme.colors.success,
  },
  sendBtnIcon: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
});