import React, { useEffect, useRef } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { useChatStore } from '@/stores/chatStore';
import { useCharacterStore } from '@/stores/characterStore';
import { MessageBubble } from '@/components/MessageBubble';
import { TypingIndicator } from '@/components/TypingIndicator';
import { ChatInput } from '@/components/ChatInput';
import { EmptyState } from '@/components/EmptyState';
import { theme } from '@/theme';

export default function ChatScreen() {
  const flatListRef = useRef<FlatList>(null);
  const conversation = useChatStore((s) => {
    const activeId = s.activeConversationId;
    return s.conversations.find((c) => c.id === activeId) || null;
  });
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const loadConversations = useChatStore((s) => s.loadConversations);
  const activeCharacter = useCharacterStore((s) => {
    const chars = s.characters;
    const activeId = s.activeCharacterId;
    return chars.find((c) => c.id === activeId) || null;
  });

  useEffect(() => {
    loadConversations();
  }, []);

  const messages = conversation?.messages || [];

  const renderItem = ({ item }: { item: typeof messages[0] }) => (
    <MessageBubble message={item} />
  );

  const keyExtractor = (item: typeof messages[0]) => item.id;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerAvatar}>{activeCharacter?.avatar || '✨'}</Text>
          <View>
            <Text style={styles.headerTitle}>{activeCharacter?.name || 'Layra'}</Text>
            <Text style={styles.headerSubtitle}>
              {isStreaming ? '正在输入...' : '在线'}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      {messages.length === 0 && !isStreaming ? (
        <EmptyState
          icon="💬"
          title="开始对话"
          description="选择一个角色，发送消息开始与 AI 对话"
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          style={styles.messageList}
          contentContainerStyle={styles.messageContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            isStreaming ? (
              streamingContent ? (
                <MessageBubble
                  message={{
                    id: 'streaming',
                    role: 'assistant',
                    content: streamingContent,
                    timestamp: Date.now(),
                  }}
                  isStreaming
                />
              ) : (
                <TypingIndicator />
              )
            ) : null
          }
        />
      )}

      <ChatInput />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(168, 85, 247, 0.1)',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerAvatar: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    marginTop: 2,
  },
  messageList: {
    flex: 1,
  },
  messageContent: {
    paddingVertical: theme.spacing.sm,
  },
});