import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { AITool } from '@/types';
import { theme } from '@/theme';

interface Props {
  tool: AITool;
  onPress: (tool: AITool) => void;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
}

export function ToolCard({ tool, onPress, onConnect, onDisconnect }: Props) {
  const pricingColor = tool.pricing === 'free' ? theme.colors.success : tool.pricing === 'freemium' ? theme.colors.warning : theme.colors.primary;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(tool)} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{tool.icon}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{tool.name}</Text>
          <Text style={styles.provider}>{tool.provider}</Text>
        </View>
        <View style={[styles.statusDot, tool.isConnected && styles.connectedDot]} />
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {tool.description}
      </Text>

      <View style={styles.features}>
        {tool.features.slice(0, 3).map((feat, i) => (
          <View key={i} style={styles.featureBadge}>
            <Text style={styles.featureText}>{feat}</Text>
          </View>
        ))}
      </View>

      <View style={styles.meta}>
        <View style={[styles.pricingBadge, { backgroundColor: `${pricingColor}15` }]}>
          <Text style={[styles.pricingText, { color: pricingColor }]}>
            {tool.pricing === 'free' ? '免费' : tool.pricing === 'freemium' ? '增值' : '付费'}
          </Text>
        </View>
        <Text style={styles.metaText}>⭐ {tool.rating}</Text>
        <Text style={styles.metaText}>{(tool.users / 1000000).toFixed(0)}M 用户</Text>
      </View>

      <TouchableOpacity
        style={[styles.connectBtn, tool.isConnected && styles.connectedBtn]}
        onPress={() => tool.isConnected ? onDisconnect(tool.id) : onConnect(tool.id)}
      >
        <Text style={[styles.connectText, tool.isConnected && styles.connectedText]}>
          {tool.isConnected ? '已连接' : '连接'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  icon: {
    fontSize: 22,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  provider: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.textMuted,
  },
  connectedDot: {
    backgroundColor: theme.colors.success,
  },
  description: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: theme.spacing.sm,
  },
  featureBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  featureText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  pricingBadge: {
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  pricingText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.medium,
  },
  metaText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  connectBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm + 2,
    alignItems: 'center',
  },
  connectedBtn: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  connectText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: '#fff',
  },
  connectedText: {
    color: theme.colors.success,
  },
});