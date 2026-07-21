import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { useCharacterStore } from '@/stores/characterStore';
import { useChatStore } from '@/stores/chatStore';
import { usePluginStore } from '@/stores/pluginStore';
import { isGameEnabled } from '@/utils/pluginEngine';
import { SCENARIOS } from '@/data/scenarios';
import { theme } from '@/theme';
import { generateId } from '@/utils/id';

export default function RoleplayScreen() {
  const characters = useCharacterStore((s) => s.characters);
  const activeCharacterId = useCharacterStore((s) => s.activeCharacterId);
  const createConversation = useChatStore((s) => s.createConversation);
  const addMessage = useChatStore((s) => s.addMessage);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const plugins = usePluginStore((s) => s.plugins);
  const enabledIds = plugins.filter((p) => p.isInstalled).map((p) => p.id);
  const gameEnabled = isGameEnabled(enabledIds);

  const activeChar = characters.find((c) => c.id === activeCharacterId);

  const handleStart = (scenarioId: string) => {
    const scenario = SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario || !activeChar) return;

    const convId = createConversation(activeChar.id, scenario.title);
    addMessage(convId, {
      id: generateId(),
      role: 'system',
      content: `🎭 **角色扮演：${scenario.title}**\n\n${scenario.starterPrompt}\n\n用你的角色视角来回应。`,
      timestamp: Date.now(),
    });
    setActiveConversation(convId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>角色扮演</Text>
        <Text style={styles.subtitle}>选择一个场景，开始你的冒险</Text>
        {gameEnabled && (
          <View style={styles.pluginBanner}>
            <Text style={styles.pluginBannerIcon}>🎮</Text>
            <Text style={styles.pluginBannerText}>文字冒险引擎已激活 · AI 动态剧情生成</Text>
          </View>
        )}
      </View>

      {/* Current Character */}
      {activeChar && (
        <View style={styles.activeChar}>
          <Text style={styles.activeCharAvatar}>{activeChar.avatar}</Text>
          <View>
            <Text style={styles.activeCharName}>{activeChar.name}</Text>
            <Text style={styles.activeCharPersonality}>{activeChar.personality}</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>场景模板</Text>
      <FlatList
        data={SCENARIOS}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleStart(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <Text style={styles.cardCategory}>{item.category}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
            <TouchableOpacity
              style={styles.playBtn}
              onPress={() => handleStart(item.id)}
            >
              <Text style={styles.playBtnText}>▶ 开始</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
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
  subtitle: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 4 },
  pluginBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.08)', borderRadius: 10,
    padding: 8, marginTop: 8, gap: 6,
  },
  pluginBannerIcon: { fontSize: 13 },
  pluginBannerText: { fontSize: 11, color: theme.colors.primary, fontWeight: '500' },
  activeChar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.surface, margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg, padding: theme.spacing.md,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.1)',
  },
  activeCharAvatar: { fontSize: 32, marginRight: theme.spacing.md },
  activeCharName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.text },
  activeCharPersonality: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.sm },
  grid: { paddingHorizontal: theme.spacing.sm, paddingBottom: theme.spacing.xl },
  card: {
    flex: 1, backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg, padding: theme.spacing.md,
    margin: theme.spacing.xs,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.08)',
  },
  cardIcon: { fontSize: 28, marginBottom: theme.spacing.sm },
  cardCategory: { fontSize: 9, color: theme.colors.primary, backgroundColor: 'rgba(168,85,247,0.1)', borderRadius: theme.borderRadius.full, paddingHorizontal: 6, paddingVertical: 1, alignSelf: 'flex-start', marginBottom: theme.spacing.xs, overflow: 'hidden' },
  cardTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, marginBottom: 4 },
  cardDesc: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 16, marginBottom: theme.spacing.sm },
  playBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, paddingVertical: theme.spacing.xs + 4, alignItems: 'center' },
  playBtnText: { color: '#fff', fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold },
});