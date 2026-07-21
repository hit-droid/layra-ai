import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { usePluginStore } from '@/stores/pluginStore';
import { PluginCard } from '@/components/PluginCard';
import { EmptyState } from '@/components/EmptyState';
import { theme } from '@/theme';

export default function MyPluginsScreen({ navigation }: any) {
  const plugins = usePluginStore((s) => s.plugins);
  const installPlugin = usePluginStore((s) => s.installPlugin);
  const uninstallPlugin = usePluginStore((s) => s.uninstallPlugin);

  const installed = plugins.filter((p) => p.isInstalled);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>我的插件</Text>
        <Text style={styles.subtitle}>已安装 {installed.length} 个插件</Text>
      </View>

      {installed.length === 0 ? (
        <EmptyState
          icon="🔌"
          title="还没有安装插件"
          description="去插件市场发现和安装你需要的插件"
        />
      ) : (
        <FlatList
          data={installed}
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
      )}
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
  list: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl * 2 },
});