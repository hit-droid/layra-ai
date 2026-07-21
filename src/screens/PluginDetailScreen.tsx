import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { usePluginStore } from '@/stores/pluginStore';
import { theme } from '@/theme';
import type { Plugin } from '@/types';

export default function PluginDetailScreen({ route, navigation }: any) {
  const plugin: Plugin = route.params?.plugin;
  const installPlugin = usePluginStore((s) => s.installPlugin);
  const uninstallPlugin = usePluginStore((s) => s.uninstallPlugin);
  const togglePlugin = usePluginStore((s) => s.togglePlugin);
  const pauseDownload = usePluginStore((s) => s.pauseDownload);
  const plugins = usePluginStore((s) => s.plugins);
  const current = plugins.find((p) => p.id === plugin?.id) || plugin;

  if (!plugin) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>插件不存在</Text>
      </View>
    );
  }

  const { downloadStatus, downloadProgress = 0 } = current;
  const isDownloading = downloadStatus === 'downloading';
  const isPaused = downloadStatus === 'paused';
  const isInstalled = current.isInstalled || downloadStatus === 'installed';
  const isFailed = downloadStatus === 'failed';

  const btnLabel = isDownloading
    ? '暂停下载'
    : isPaused
    ? '继续下载'
    : isInstalled
    ? '卸载'
    : isFailed
    ? '重试下载'
    : '安装';

  const btnAction = () => {
    if (isDownloading) {
      pauseDownload(current.id);
    } else if (isPaused) {
      installPlugin(current.id);
    } else if (isInstalled) {
      uninstallPlugin(current.id);
    } else {
      installPlugin(current.id);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{plugin.icon}</Text>
          </View>
          {plugin.isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>精选插件</Text>
            </View>
          )}
          <Text style={styles.name}>{plugin.name}</Text>
          <Text style={styles.version}>v{plugin.version} · {plugin.author}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>⭐ {plugin.rating}</Text>
            <Text style={styles.downloads}>📥 {(plugin.downloads / 10000).toFixed(0)}万 下载</Text>
            <Text style={styles.size}>💾 {plugin.size}</Text>
          </View>
        </View>

        {/* Download Progress */}
        {(isDownloading || isPaused) && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${downloadProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {isPaused ? '已暂停' : `下载中 ${downloadProgress}%`} · {plugin.size}
            </Text>
          </View>
        )}

        {isFailed && (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>下载失败，请检查网络后重试</Text>
          </View>
        )}

        {isInstalled && (
          <View style={styles.installedBox}>
            <Text style={styles.installedBoxText}>已安装 · 大小 {plugin.size}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>简介</Text>
        <Text style={styles.description}>{plugin.description}</Text>

        {plugin.tags && plugin.tags.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>标签</Text>
            <View style={styles.tagList}>
              {plugin.tags.map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>所需权限</Text>
        <View style={styles.permList}>
          {plugin.permissions.map((perm, i) => (
            <View key={i} style={styles.permItem}>
              <Text style={styles.permText}>🔒 {perm}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>分类</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{plugin.category}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {isInstalled && (
          <TouchableOpacity
            style={[styles.footerBtn, styles.toggleBtn, current.isActive && styles.toggleActive]}
            onPress={() => togglePlugin(plugin.id)}
          >
            <Text style={[styles.toggleText, current.isActive && styles.toggleActiveText]}>
              {current.isActive ? '已启用' : '已禁用'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.footerBtn,
            isDownloading ? styles.pauseBtn :
            isPaused ? styles.installBtn :
            isInstalled ? styles.uninstallBtn :
            isFailed ? styles.retryBtn :
            styles.installBtn,
          ]}
          onPress={btnAction}
        >
          <Text style={[
            styles.footerBtnText,
            (isInstalled || isFailed) && styles.dangerText,
            (isDownloading || isPaused) && styles.actionText,
          ]}>
            {btnLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg },
  header: { alignItems: 'center', marginBottom: theme.spacing.lg },
  iconContainer: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: theme.colors.surface, alignItems: 'center',
    justifyContent: 'center', marginBottom: theme.spacing.md,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)',
  },
  icon: { fontSize: 40 },
  featuredBadge: {
    backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 3, marginBottom: 8,
  },
  featuredText: { fontSize: 12, color: theme.colors.warning, fontWeight: '600' },
  name: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.text, marginBottom: 4 },
  version: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted },
  ratingRow: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.sm },
  rating: { fontSize: theme.fontSize.sm, color: theme.colors.warning },
  downloads: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  size: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  progressSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.1)',
  },
  progressBar: {
    height: 6, backgroundColor: 'rgba(168,85,247,0.15)',
    borderRadius: 3, overflow: 'hidden', marginBottom: 8,
  },
  progressFill: {
    height: '100%', backgroundColor: theme.colors.primary, borderRadius: 3,
  },
  progressText: {
    fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center',
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12,
    padding: 12, marginBottom: 16, alignItems: 'center',
  },
  errorBoxText: { fontSize: 13, color: theme.colors.error },
  installedBox: {
    backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 12,
    padding: 12, marginBottom: 16, alignItems: 'center',
  },
  installedBoxText: { fontSize: 13, color: theme.colors.success },
  sectionTitle: {
    fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm,
  },
  description: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary, lineHeight: 22 },
  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: 'rgba(168,85,247,0.08)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  tagText: { fontSize: 12, color: theme.colors.primary },
  permList: { gap: theme.spacing.xs },
  permItem: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.sm },
  permText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  categoryBadge: {
    backgroundColor: 'rgba(6,182,212,0.1)', borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md, paddingVertical: 4, alignSelf: 'flex-start',
  },
  categoryText: { fontSize: theme.fontSize.xs, color: theme.colors.secondary },
  footer: {
    flexDirection: 'row', padding: theme.spacing.md, gap: theme.spacing.md,
    backgroundColor: theme.colors.surface, borderTopWidth: 1,
    borderTopColor: 'rgba(168,85,247,0.1)',
  },
  footerBtn: {
    flex: 1, borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md, alignItems: 'center',
  },
  installBtn: { backgroundColor: theme.colors.primary },
  uninstallBtn: { backgroundColor: 'rgba(239,68,68,0.15)' },
  pauseBtn: { backgroundColor: 'rgba(245,158,11,0.15)' },
  retryBtn: { backgroundColor: 'rgba(239,68,68,0.15)' },
  toggleBtn: { backgroundColor: theme.colors.card },
  toggleActive: { backgroundColor: 'rgba(34,197,94,0.15)' },
  footerBtnText: { color: '#fff', fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
  dangerText: { color: theme.colors.error },
  actionText: { color: theme.colors.warning },
  toggleText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.medium },
  toggleActiveText: { color: theme.colors.success },
  errorText: { color: theme.colors.error, textAlign: 'center', marginTop: 100 },
});