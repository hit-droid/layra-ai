import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Plugin } from '@/types';
import { theme } from '@/theme';

interface Props {
  plugin: Plugin & { source?: string };
  onPress: (plugin: Plugin) => void;
  onEnable: (id: string) => void;
  onDisable: (id: string) => void;
  onPause?: (id: string) => void;
}

export function PluginCard({ plugin, onPress, onEnable, onDisable, onPause }: Props) {
  const { downloadStatus, downloadProgress = 0, isInstalled, downloadUrl } = plugin;
  const isDownloading = downloadStatus === 'downloading';
  const isPaused = downloadStatus === 'paused';
  const isEnabled = isInstalled || downloadStatus === 'installed';
  const isFailed = downloadStatus === 'failed';
  const hasDownload = !!downloadUrl;
  const source = (plugin as any).source;

  const sourceColors: Record<string, string> = {
    'F-Droid': 'rgba(6,182,212,0.12)',
    'GitHub': 'rgba(245,158,11,0.12)',
    '内置': 'rgba(168,85,247,0.12)',
  };
  const sourceTextColors: Record<string, string> = {
    'F-Droid': theme.colors.secondary,
    'GitHub': theme.colors.warning,
    '内置': theme.colors.primary,
  }; // 有 downloadUrl = 需要真下载

  const handleBtnPress = () => {
    if (isDownloading) {
      onPause?.(plugin.id);
    } else if (isPaused) {
      onEnable(plugin.id);
    } else if (isEnabled) {
      onDisable(plugin.id);
    } else {
      onEnable(plugin.id);
    }
  };

  let btnLabel: string;
  let btnStyle: any;
  let btnTextStyle: any;

  if (isDownloading) {
    btnLabel = '暂停';
    btnStyle = styles.pauseBtn;
    btnTextStyle = styles.pauseText;
  } else if (isPaused) {
    btnLabel = '继续';
    btnStyle = styles.enableBtn;
    btnTextStyle = styles.enableText;
  } else if (isEnabled) {
    btnLabel = '已启用';
    btnStyle = styles.disableBtn;
    btnTextStyle = styles.disableText;
  } else if (isFailed) {
    btnLabel = '重试';
    btnStyle = styles.retryBtn;
    btnTextStyle = styles.retryText;
  } else {
    btnLabel = hasDownload ? '下载' : '启用';
    btnStyle = styles.enableBtn;
    btnTextStyle = styles.enableText;
  }

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
        {hasDownload && <Text style={styles.metaText}>💾 {plugin.size}</Text>}
        {source && (
          <View style={[styles.sourceBadge, { backgroundColor: sourceColors[source] || 'rgba(168,85,247,0.08)' }]}>
            <Text style={[styles.sourceBadgeText, { color: sourceTextColors[source] || theme.colors.primary }]}>
              {source}
            </Text>
          </View>
        )}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{plugin.category}</Text>
        </View>
      </View>

      {/* 真实下载进度条 */}
      {(isDownloading || isPaused) && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${downloadProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {isPaused ? '已暂停' : `${downloadProgress}%`}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.actionBtn, btnStyle]}
        onPress={handleBtnPress}
        activeOpacity={0.7}
      >
        <Text style={[styles.actionText, btnTextStyle]}>{btnLabel}</Text>
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
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  icon: { fontSize: 24 },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  featuredBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1,
  },
  featuredText: { fontSize: 9, color: theme.colors.warning, fontWeight: '600' },
  author: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  ratingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3,
  },
  ratingText: { fontSize: 12, color: theme.colors.warning, fontWeight: '500' },
  description: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 19, marginBottom: 10 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tag: { backgroundColor: 'rgba(168, 85, 247, 0.08)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, color: theme.colors.primary },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  metaText: { fontSize: 12, color: theme.colors.textMuted },
  categoryBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  categoryText: { fontSize: 10, color: theme.colors.secondary, textTransform: 'capitalize' },
  sourceBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  sourceBadgeText: { fontSize: 9, fontWeight: '600' },
  progressContainer: { marginBottom: 12 },
  progressBar: {
    height: 4, backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderRadius: 2, overflow: 'hidden', marginBottom: 6,
  },
  progressFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 2 },
  progressText: { fontSize: 11, color: theme.colors.textMuted, textAlign: 'right' },
  actionBtn: { borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  enableBtn: { backgroundColor: theme.colors.primary },
  disableBtn: { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
  pauseBtn: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  retryBtn: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
  actionText: { fontSize: 14, fontWeight: '600' },
  enableText: { color: '#fff' },
  disableText: { color: theme.colors.success },
  pauseText: { color: theme.colors.warning },
  retryText: { color: theme.colors.error },
});