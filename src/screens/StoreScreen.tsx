import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, Animated, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePluginStore } from '@/stores/pluginStore';
import { useToolStore } from '@/stores/toolStore';
import { PluginCard } from '@/components/PluginCard';
import { ToolCard } from '@/components/ToolCard';
import { theme } from '@/theme';
import type { PluginCategory, ToolCategory } from '@/types';

type TabType = 'plugins' | 'tools';

const PLUGIN_CATEGORIES: { key: PluginCategory | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'productivity', label: '效率' },
  { key: 'creative', label: '创作' },
  { key: 'entertainment', label: '娱乐' },
  { key: 'developer', label: '开发' },
  { key: 'education', label: '教育' },
  { key: 'utility', label: '工具' },
];

const TOOL_CATEGORIES: { key: ToolCategory | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'text', label: '文本' },
  { key: 'image', label: '图像' },
  { key: 'audio', label: '音频' },
  { key: 'video', label: '视频' },
  { key: 'code', label: '代码' },
  { key: 'data', label: '数据' },
  { key: 'agent', label: 'Agent' },
];

export default function StoreScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [activeTab, setActiveTab] = useState<TabType>('plugins');
  const [search, setSearch] = useState('');
  const [pluginCategory, setPluginCategory] = useState<PluginCategory | 'all'>('all');
  const [toolCategory, setToolCategory] = useState<ToolCategory | 'all'>('all');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const plugins = usePluginStore((s) => s.plugins);
  const loadPlugins = usePluginStore((s) => s.loadPlugins);
  const installPlugin = usePluginStore((s) => s.installPlugin);
  const uninstallPlugin = usePluginStore((s) => s.uninstallPlugin);
  const pauseDownload = usePluginStore((s) => s.pauseDownload);
  const refreshRegistry = usePluginStore((s) => s.refreshRegistry);
  const isRefreshing = usePluginStore((s) => s.isRefreshing);
  const registryVersion = usePluginStore((s) => s.registryVersion);

  const tools = useToolStore((s) => s.tools);
  const loadTools = useToolStore((s) => s.loadTools);
  const connectTool = useToolStore((s) => s.connectTool);
  const disconnectTool = useToolStore((s) => s.disconnectTool);

  useEffect(() => {
    loadPlugins();
    loadTools();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = useCallback(() => {
    refreshRegistry();
  }, [refreshRegistry]);

  const filteredPlugins = plugins.filter((p) => {
    const matchSearch =
      p.name.includes(search) || p.description.includes(search) || (p.tags?.some((t) => t.includes(search)));
    const matchCat = pluginCategory === 'all' || p.category === pluginCategory;
    return matchSearch && matchCat;
  });

  const filteredTools = tools.filter((t) => {
    const matchSearch = t.name.includes(search) || t.description.includes(search) || t.provider.includes(search);
    const matchCat = toolCategory === 'all' || t.category === toolCategory;
    return matchSearch && matchCat;
  });

  const installedCount = plugins.filter((p) => p.isInstalled || p.downloadStatus === 'installed').length;
  const downloadingCount = plugins.filter((p) => p.downloadStatus === 'downloading' || p.downloadStatus === 'paused').length;
  const connectedCount = tools.filter((t) => t.isConnected).length;

  const currentCategories = activeTab === 'plugins' ? PLUGIN_CATEGORIES : TOOL_CATEGORIES;
  const currentActiveCategory = activeTab === 'plugins' ? pluginCategory : toolCategory;

  const handleCategoryPress = (key: string) => {
    if (activeTab === 'plugins') {
      setPluginCategory(key as PluginCategory | 'all');
    } else {
      setToolCategory(key as ToolCategory | 'all');
    }
  };

  const topPlugins = [...plugins]
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 5);

  const topTools = [...tools]
    .sort((a, b) => b.users - a.users)
    .slice(0, 5);

  return (
    <View style={styles.container}>
      <View style={styles.bgGlow} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>微App商店</Text>
          {registryVersion ? (
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>v{registryVersion}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.subtitle}>
          {installedCount} 已安装 · {downloadingCount > 0 ? `${downloadingCount} 下载中 · ` : ''}{plugins.length} 个可用
        </Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'plugins' && styles.tabActive]}
          onPress={() => setActiveTab('plugins')}
        >
          <Text style={styles.tabIcon}>🔌</Text>
          <Text style={[styles.tabLabel, activeTab === 'plugins' && styles.tabLabelActive]}>
            高级插件
          </Text>
          {installedCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{installedCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tools' && styles.tabActive]}
          onPress={() => setActiveTab('tools')}
        >
          <Text style={styles.tabIcon}>🤖</Text>
          <Text style={[styles.tabLabel, activeTab === 'tools' && styles.tabLabelActive]}>
            AI 工具
          </Text>
          {connectedCount > 0 && (
            <View style={[styles.tabBadge, styles.tabBadgeGreen]}>
              <Text style={styles.tabBadgeText}>{connectedCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={activeTab === 'plugins' ? '搜索插件...' : '搜索 AI 工具...'}
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        {/* Featured Section */}
        {!search && (
          <View style={styles.featuredSection}>
            <Text style={styles.sectionTitle}>
              {activeTab === 'plugins' ? '🔥 热门插件' : '⭐ 推荐工具'}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScroll}
            >
              {activeTab === 'plugins'
                ? topPlugins.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.featuredCard}
                      onPress={() => {
                        navigation.navigate('PluginDetail', { plugin: p });
                      }}
                    >
                      <View style={styles.featuredIcon}>
                        <Text style={styles.featuredIconText}>{p.icon}</Text>
                      </View>
                      <Text style={styles.featuredName} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text style={styles.featuredSize}>{p.size}</Text>
                    </TouchableOpacity>
                  ))
                : topTools.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={styles.featuredCard}
                      onPress={() => {
                        navigation.navigate('ToolDetail', { tool: t });
                      }}
                    >
                      <View style={styles.featuredIcon}>
                        <Text style={styles.featuredIconText}>{t.icon}</Text>
                      </View>
                      <Text style={styles.featuredName} numberOfLines={1}>
                        {t.name}
                      </Text>
                      <View
                        style={[
                          styles.featuredPricing,
                          {
                            backgroundColor:
                              t.pricing === 'free'
                                ? 'rgba(34,197,94,0.15)'
                                : 'rgba(168,85,247,0.15)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.featuredPricingText,
                            {
                              color:
                                t.pricing === 'free'
                                  ? theme.colors.success
                                  : theme.colors.primary,
                            },
                          ]}
                        >
                          {t.pricing === 'free'
                            ? '免费'
                            : t.pricing === 'freemium'
                            ? '增值'
                            : '付费'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
            </ScrollView>
          </View>
        )}

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryList}
        >
          {currentCategories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryBtn,
                currentActiveCategory === cat.key && styles.categoryActive,
              ]}
              onPress={() => handleCategoryPress(cat.key)}
            >
              <Text
                style={[
                  styles.categoryLabel,
                  currentActiveCategory === cat.key && styles.categoryLabelActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* List */}
        {activeTab === 'plugins' ? (
          <FlatList
            data={filteredPlugins}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PluginCard
                plugin={item}
                onPress={(p) => {
                  navigation.navigate('PluginDetail', { plugin: p });
                }}
                onInstall={installPlugin}
                onUninstall={uninstallPlugin}
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
        ) : (
          <FlatList
            data={filteredTools}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ToolCard
                tool={item}
                onPress={(t) => {
                  navigation.navigate('ToolDetail', { tool: t });
                }}
                onConnect={connectTool}
                onDisconnect={disconnectTool}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🔧</Text>
                <Text style={styles.emptyText}>没有找到匹配的工具</Text>
              </View>
            }
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  bgGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(168, 85, 247, 0.04)',
    top: -40,
    right: -40,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(168,85,247,0.1)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
  },
  versionBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  versionText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: theme.colors.card,
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  tabIcon: {
    fontSize: 16,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  tabLabelActive: {
    color: theme.colors.primary,
  },
  tabBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeGreen: {
    backgroundColor: theme.colors.success,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.12)',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.text,
  },
  featuredSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  featuredScroll: {
    paddingHorizontal: 12,
    gap: 10,
  },
  featuredCard: {
    width: 90,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.08)',
  },
  featuredIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(168,85,247,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featuredIconText: {
    fontSize: 22,
  },
  featuredName: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  featuredSize: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  featuredPricing: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  featuredPricingText: {
    fontSize: 9,
    fontWeight: '600',
  },
  categoryScroll: {
    maxHeight: 44,
    marginTop: 12,
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryBtn: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.08)',
  },
  categoryActive: {
    backgroundColor: 'rgba(168,85,247,0.15)',
    borderColor: theme.colors.primary,
  },
  categoryLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  categoryLabelActive: {
    color: theme.colors.primary,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
});