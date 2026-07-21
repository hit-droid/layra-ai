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
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
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
    paddingHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
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
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  avatarText: {
    fontSize: 16,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.borderRadius.lg,
  },
  userBubble: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    borderBottomRightRadius: theme.borderRadius.sm,
  },
  assistantBubble: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderBottomLeftRadius: theme.borderRadius.sm,
  },
  text: {
    fontSize: theme.fontSize.md,
    lineHeight: 22,
  },
  userText: {
    color: theme.colors.text,
  },
  assistantText: {
    color: theme.colors.text,
  },
  time: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  cursor: {
    color: theme.colors.primary,
  },
  systemContainer: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
  },
  systemBubble: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  systemText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    textAlign: 'center',
  },
});