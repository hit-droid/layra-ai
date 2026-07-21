import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useToolStore } from '@/stores/toolStore';
import { ToolCard } from '@/components/ToolCard';
import { theme } from '@/theme';
import type { ToolCategory } from '@/types';

const CATEGORIES: { key: ToolCategory | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'text', label: '文本' },
  { key: 'image', label: '图像' },
  { key: 'audio', label: '音频' },
  { key: 'video', label: '视频' },
  { key: 'code', label: '代码' },
  { key: 'data', label: '数据' },
  { key: 'agent', label: 'Agent' },
];

export default function AIToolsScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ToolCategory | 'all'>('all');

  const tools = useToolStore((s) => s.tools);
  const loadTools = useToolStore((s) => s.loadTools);
  const connectTool = useToolStore((s) => s.connectTool);
  const disconnectTool = useToolStore((s) => s.disconnectTool);

  useEffect(() => { loadTools(); }, []);

  const filtered = tools.filter((t) => {
    const matchSearch = t.name.includes(search) || t.description.includes(search) || t.provider.includes(search);
    const matchCategory = category === 'all' || t.category === category;
    return matchSearch && matchCategory;
  });

  const connectedCount = tools.filter((t) => t.isConnected).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI 工具集</Text>
        <Text style={styles.subtitle}>已连接 {connectedCount} 个工具</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="搜索 AI 工具..."
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
          <ToolCard
            tool={item}
            onPress={(t) => navigation.navigate('ToolDetail', { tool: t })}
            onConnect={connectTool}
            onDisconnect={disconnectTool}
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
  subtitle: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 4 },
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