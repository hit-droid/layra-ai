import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Message } from '@/types';
import { theme } from '@/theme';
import { formatTime } from '@/utils/id';

interface Props {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <View style={styles.systemContainer}>
        <View style={styles.systemBubble}>
          <Text style={styles.systemIcon}>🎭</Text>
          <Text style={styles.systemText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {!isUser && (
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>✨</Text>
        </View>
      )}
      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.assistantBubble,
      ]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
          {message.content}
          {isStreaming && <Text style={styles.cursor}>▌</Text>}
        </Text>
        <Text style={styles.time}>
          {isUser ? '你' : 'AI'} · {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 3,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  avatarText: {
    fontSize: 16,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderBottomLeftRadius: 6,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: theme.colors.text,
  },
  assistantText: {
    color: theme.colors.text,
  },
  time: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  cursor: {
    color: theme.colors.primary,
  },
  systemContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginVertical: 8,
  },
  systemBubble: {
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.1)',
  },
  systemIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  systemText: {
    fontSize: 13,
    color: theme.colors.primary,
    lineHeight: 20,
    flex: 1,
  },
});