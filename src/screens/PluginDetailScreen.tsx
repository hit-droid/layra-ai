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
  const plugins = usePluginStore((s) => s.plugins);
  const current = plugins.find((p) => p.id === plugin?.id) || plugin;

  if (!plugin) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>插件不存在</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{plugin.icon}</Text>
          </View>
          <Text style={styles.name}>{plugin.name}</Text>
          <Text style={styles.version}>v{plugin.version} · {plugin.author}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>⭐ {plugin.rating}</Text>
            <Text style={styles.downloads}>📥 {(plugin.downloads / 1000).toFixed(0)}K 下载</Text>
            <Text style={styles.size}>💾 {plugin.size}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>简介</Text>
        <Text style={styles.description}>{plugin.description}</Text>

        <Text style={styles.sectionTitle}>权限</Text>
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
        {current.isInstalled && (
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
          style={[styles.footerBtn, current.isInstalled ? styles.uninstallBtn : styles.installBtn]}
          onPress={() => current.isInstalled ? uninstallPlugin(plugin.id) : installPlugin(plugin.id)}
        >
          <Text style={[styles.footerBtnText, current.isInstalled && styles.uninstallText]}>
            {current.isInstalled ? '卸载' : '安装插件'}
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
  iconContainer: { width: 80, height: 80, borderRadius: theme.borderRadius.xl, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md, borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)' },
  icon: { fontSize: 40 },
  name: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.text, marginBottom: 4 },
  version: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted },
  ratingRow: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.sm },
  rating: { fontSize: theme.fontSize.sm, color: theme.colors.warning },
  downloads: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  size: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  sectionTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm },
  description: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary, lineHeight: 22 },
  permList: { gap: theme.spacing.xs },
  permItem: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.sm },
  permText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  categoryBadge: { backgroundColor: 'rgba(6,182,212,0.1)', borderRadius: theme.borderRadius.full, paddingHorizontal: theme.spacing.md, paddingVertical: 4, alignSelf: 'flex-start' },
  categoryText: { fontSize: theme.fontSize.xs, color: theme.colors.secondary },
  footer: { flexDirection: 'row', padding: theme.spacing.md, gap: theme.spacing.md, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: 'rgba(168,85,247,0.1)' },
  footerBtn: { flex: 1, borderRadius: theme.borderRadius.md, paddingVertical: theme.spacing.md, alignItems: 'center' },
  installBtn: { backgroundColor: theme.colors.primary },
  uninstallBtn: { backgroundColor: 'rgba(239,68,68,0.15)' },
  toggleBtn: { backgroundColor: theme.colors.card },
  toggleActive: { backgroundColor: 'rgba(34,197,94,0.15)' },
  footerBtnText: { color: '#fff', fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
  uninstallText: { color: theme.colors.error },
  toggleText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.medium },
  toggleActiveText: { color: theme.colors.success },
  errorText: { color: theme.colors.error, textAlign: 'center', marginTop: 100 },
});