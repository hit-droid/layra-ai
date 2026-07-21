import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Plugin } from '@/types';
import { theme } from '@/theme';

interface Props {
  plugin: Plugin;
  onPress: (plugin: Plugin) => void;
  onInstall: (id: string) => void;
  onUninstall: (id: string) => void;
}

export function PluginCard({ plugin, onPress, onInstall, onUninstall }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(plugin)} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{plugin.icon}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{plugin.name}</Text>
          <Text style={styles.author}>{plugin.author} · v{plugin.version}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐ {plugin.rating}</Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {plugin.description}
      </Text>

      <View style={styles.meta}>
        <Text style={styles.metaText}>📥 {(plugin.downloads / 1000).toFixed(0)}K</Text>
        <Text style={styles.metaText}>💾 {plugin.size}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{plugin.category}</Text>
        </View>
      </View>

      <View style={styles.permissions}>
        {plugin.permissions.slice(0, 3).map((perm, i) => (
          <View key={i} style={styles.permBadge}>
            <Text style={styles.permText}>{perm}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.installBtn, plugin.isInstalled && styles.installedBtn]}
        onPress={() => plugin.isInstalled ? onUninstall(plugin.id) : onInstall(plugin.id)}
      >
        <Text style={[styles.installText, plugin.isInstalled && styles.installedText]}>
          {plugin.isInstalled ? '已安装' : '安装'}
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
  author: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  ratingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  ratingText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.warning,
    fontWeight: theme.fontWeight.medium,
  },
  description: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  metaText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  categoryBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 10,
    color: theme.colors.secondary,
    textTransform: 'capitalize',
  },
  permissions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: theme.spacing.md,
  },
  permBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  permText: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  installBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm + 2,
    alignItems: 'center',
  },
  installedBtn: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  installText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: '#fff',
  },
  installedText: {
    color: theme.colors.success,
  },
});