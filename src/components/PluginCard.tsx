import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Plugin } from '@/types';
import { theme } from '@/theme';

interface Props {
  plugin: Plugin;
  onPress: (plugin: Plugin) => void;
  onEnable: (id: string) => void;
  onDisable: (id: string) => void;
}

export function PluginCard({ plugin, onPress, onEnable, onDisable }: Props) {
  const isEnabled = plugin.isInstalled;

  const handleBtnPress = () => {
    if (isEnabled) {
      onDisable(plugin.id);
    } else {
      onEnable(plugin.id);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(plugin)} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{plugin.icon}</Text>
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{plugin.name}</Text>
            {plugin.isFeatured && (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredText}>精选</Text>
              </View>
            )}
          </View>
          <Text style={styles.author}>{plugin.author} · v{plugin.version}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐ {plugin.rating}</Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {plugin.description}
      </Text>

      {plugin.tags && plugin.tags.length > 0 && (
        <View style={styles.tags}>
          {plugin.tags.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.meta}>
        <Text style={styles.metaText}>📥 {(plugin.downloads / 10000).toFixed(0)}万 用户</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{plugin.category}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.actionBtn, isEnabled ? styles.disableBtn : styles.enableBtn]}
        onPress={handleBtnPress}
        activeOpacity={0.7}
      >
        <Text style={[styles.actionText, isEnabled ? styles.disableText : styles.enableText]}>
          {isEnabled ? '已启用' : '启用'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: { fontSize: 24 },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  featuredBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  featuredText: { fontSize: 9, color: theme.colors.warning, fontWeight: '600' },
  author: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  ratingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ratingText: { fontSize: 12, color: theme.colors.warning, fontWeight: '500' },
  description: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 19, marginBottom: 10 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tag: {
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: { fontSize: 11, color: theme.colors.primary },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  metaText: { fontSize: 12, color: theme.colors.textMuted },
  categoryBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryText: { fontSize: 10, color: theme.colors.secondary, textTransform: 'capitalize' },
  actionBtn: { borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  enableBtn: { backgroundColor: theme.colors.primary },
  disableBtn: { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
  actionText: { fontSize: 14, fontWeight: '600' },
  enableText: { color: '#fff' },
  disableText: { color: theme.colors.success },
});