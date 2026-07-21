import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { usePluginStore } from '@/stores/pluginStore';
import { PluginCard } from '@/components/PluginCard';
import { theme } from '@/theme';
import type { Plugin, PluginCategory } from '@/types';

const CATEGORIES: { key: PluginCategory | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'productivity', label: '效率' },
  { key: 'creative', label: '创作' },
  { key: 'entertainment', label: '娱乐' },
  { key: 'developer', label: '开发' },
  { key: 'education', label: '教育' },
  { key: 'utility', label: '工具' },
];

export default function PluginMarketScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<PluginCategory | 'all'>('all');

  const plugins = usePluginStore((s) => s.plugins);
  const loadPlugins = usePluginStore((s) => s.loadPlugins);
  const installPlugin = usePluginStore((s) => s.installPlugin);
  const uninstallPlugin = usePluginStore((s) => s.uninstallPlugin);

  useEffect(() => { loadPlugins(); }, []);

  const filtered = plugins.filter((p) => {
    const matchSearch = p.name.includes(search) || p.description.includes(search);
    const matchCategory = category === 'all' || p.category === category;
    return matchSearch && matchCategory;
  });

  const installedCount = plugins.filter((p) => p.isInstalled).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>插件市场</Text>
        <View style={styles.headerMeta}>
          <Text style={styles.headerMetaText}>已安装 {installedCount} 个插件</Text>
          <TouchableOpacity
            style={styles.myPluginsBtn}
            onPress={() => navigation.navigate('MyPlugins')}
          >
            <Text style={styles.myPluginsText}>我的插件</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="搜索插件..."
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      <View style={styles.categoryRow}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryBtn, category === item.key && styles.categoryActive]}
              onPress={() => setCategory(item.key)}
            >
              <Text style={[styles.categoryText, category === item.key && styles.categoryActiveText]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PluginCard
            plugin={item}
            onPress={(p) => navigation.navigate('PluginDetail', { plugin: p })}
            onInstall={installPlugin}
            onUninstall={uninstallPlugin}
          />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1, borderBottomColor: 'rgba(168,85,247,0.1)',
  },
  title: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  headerMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.xs },
  headerMetaText: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  myPluginsBtn: { backgroundColor: 'rgba(168,85,247,0.1)', borderRadius: theme.borderRadius.full, paddingHorizontal: theme.spacing.md, paddingVertical: 4 },
  myPluginsText: { fontSize: theme.fontSize.xs, color: theme.colors.primary },
  searchContainer: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm },
  searchInput: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md, color: theme.colors.text,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.1)',
  },
  categoryRow: { paddingVertical: theme.spacing.sm },
  categoryList: { paddingHorizontal: theme.spacing.md, gap: 8 },
  categoryBtn: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs + 3,
    borderWidth: 1, borderColor: 'transparent',
  },
  categoryActive: { backgroundColor: 'rgba(168,85,247,0.15)', borderColor: theme.colors.primary },
  categoryText: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  categoryActiveText: { color: theme.colors.primary },
  list: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl * 2 },
});