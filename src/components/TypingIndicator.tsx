import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/theme';

export function TypingIndicator() {
  return (
    <View style={[styles.container, styles.assistantContainer]}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>✨</Text>
      </View>
      <View style={styles.bubble}>
        <View style={styles.dots}>
          <View style={[styles.dot, { opacity: 0.3 }]} />
          <View style={[styles.dot, { opacity: 0.6 }]} />
          <View style={[styles.dot, { opacity: 0.9 }]} />
        </View>
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
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderBottomLeftRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(168, 85, 247, 0.5)',
  },
});