import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, Animated, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePluginStore } from '@/stores/pluginStore';
import { PluginCard } from '@/components/PluginCard';
import { theme } from '@/theme';
import { PLUGIN_SOURCES } from '@/utils/pluginSources';

export default function StoreScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const plugins = usePluginStore((s) => s.plugins);
  const loadPlugins = usePluginStore((s) => s.loadPlugins);
  const enablePlugin = usePluginStore((s) => s.enablePlugin);
  const disablePlugin = usePluginStore((s) => s.disablePlugin);
  const pauseDownload = usePluginStore((s) => s.pauseDownload);
  const refreshAll = usePluginStore((s) => s.refreshAll);
  const isRefreshing = usePluginStore((s) => s.isRefreshing);
  const isLoading = usePluginStore((s) => s.isLoading);

  useEffect(() => {
    loadPlugins();
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const onRefresh = useCallback(() => {
    refreshAll();
  }, [refreshAll]);

  const filtered = plugins.filter((p) => {
    const matchSearch = p.name.includes(search) || p.description.includes(search) || (p.tags?.some((t) => t.includes(search)));
    const matchSource = sourceFilter === 'all' || (p as any).source === sourceFilter;
    return matchSearch && matchSource;
  });

  const sourceCounts: Record<string, number> = { all: plugins.length };
  PLUGIN_SOURCES.forEach((s) => {
    sourceCounts[s.id] = plugins.filter((p) => (p as any).source === s.id).length;
  });

  const enabledCount = plugins.filter((p) => p.isInstalled).length;

  const featured = plugins.filter((p) => p.isFeatured).slice(0, 5);

  return (
    <View style={styles.container}>
      <View style={styles.bgGlow} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>微App商店</Text>
        </View>
        <Text style={styles.subtitle}>
          {enabledCount} 已启用 · {plugins.length} 个可用 · 来自 {PLUGIN_SOURCES.length} 个源
        </Text>
      </View>

      {/* Source Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sourceScroll}
        contentContainerStyle={styles.sourceList}
      >
        <TouchableOpacity
          style={[styles.sourceBtn, sourceFilter === 'all' && styles.sourceActive]}
          onPress={() => setSourceFilter('all')}
        >
          <Text style={styles.sourceIcon}>🌐</Text>
          <Text style={[styles.sourceLabel, sourceFilter === 'all' && styles.sourceLabelActive]}>
            全部 ({sourceCounts.all})
          </Text>
        </TouchableOpacity>
        {PLUGIN_SOURCES.map((src) => (
          <TouchableOpacity
            key={src.id}
            style={[styles.sourceBtn, sourceFilter === src.id && styles.sourceActive]}
            onPress={() => setSourceFilter(src.id)}
          >
            <Text style={styles.sourceIcon}>{src.icon}</Text>
            <Text style={[styles.sourceLabel, sourceFilter === src.id && styles.sourceLabelActive]}>
              {src.name} ({sourceCounts[src.id] || 0})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="搜索插件..."
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        {/* Featured */}
        {!search && sourceFilter === 'all' && featured.length > 0 && (
          <View style={styles.featuredSection}>
            <Text style={styles.sectionTitle}>🔥 推荐</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredScroll}>
              {featured.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.featuredCard}
                  onPress={() => navigation.navigate('PluginDetail', { plugin: p })}
                >
                  <View style={styles.featuredIcon}>
                    <Text style={styles.featuredIconText}>{p.icon}</Text>
                  </View>
                  <Text style={styles.featuredName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.featuredSource}>{(p as any).source}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* List */}
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>正在从外部源拉取插件...</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PluginCard
                plugin={item}
                onPress={(p) => navigation.navigate('PluginDetail', { plugin: p })}
                onEnable={enablePlugin}
                onDisable={disablePlugin}
                onPause={pauseDownload}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyText}>没有找到匹配的插件</Text>
              </View>
            }
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  bgGlow: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(168, 85, 247, 0.04)', top: -40, right: -40,
  },
  header: {
    paddingHorizontal: 16, paddingVertical: 16, backgroundColor: theme.colors.surface,
    borderBottomWidth: 1, borderBottomColor: 'rgba(168,85,247,0.1)',
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.text },
  subtitle: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 },
  sourceScroll: { maxHeight: 48, backgroundColor: theme.colors.surface },
  sourceList: { paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  sourceBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, gap: 4,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.08)',
  },
  sourceActive: { backgroundColor: 'rgba(168,85,247,0.15)', borderColor: theme.colors.primary },
  sourceIcon: { fontSize: 14 },
  sourceLabel: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500' },
  sourceLabelActive: { color: theme.colors.primary },
  content: { flex: 1 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12,
    backgroundColor: theme.colors.surface, borderRadius: 14, paddingHorizontal: 14,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.12)',
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: theme.colors.text },
  featuredSection: { marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, paddingHorizontal: 16, marginBottom: 10 },
  featuredScroll: { paddingHorizontal: 12, gap: 10 },
  featuredCard: {
    width: 90, alignItems: 'center', backgroundColor: theme.colors.surface,
    borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(168,85,247,0.08)',
  },
  featuredIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(168,85,247,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  featuredIconText: { fontSize: 22 },
  featuredName: { fontSize: 11, fontWeight: '600', color: theme.colors.text, textAlign: 'center', marginBottom: 4 },
  featuredSource: { fontSize: 9, color: theme.colors.textMuted },
  loading: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 12 },
  list: { padding: 16, paddingBottom: 40 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: theme.colors.textMuted },
});