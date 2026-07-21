import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCharacterStore } from '@/stores/characterStore';
import { useChatStore } from '@/stores/chatStore';
import { theme } from '@/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.55;

const QUICK_ACTIONS = [
  { id: 'create', icon: '✨', label: '创建角色', color: 'rgba(168,85,247,0.15)' },
  { id: 'image', icon: '🎨', label: '图像生成', color: 'rgba(236,72,153,0.15)' },
  { id: 'roleplay', icon: '🎭', label: '角色扮演', color: 'rgba(6,182,212,0.15)' },
  { id: 'store', icon: '🛍️', label: '微App商店', color: 'rgba(245,158,11,0.15)' },
];

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const characters = useCharacterStore((s) => s.characters);
  const setActiveCharacter = useCharacterStore((s) => s.setActiveCharacter);
  const conversations = useChatStore((s) => s.conversations);
  const createConversation = useChatStore((s) => s.createConversation);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleCharacterPress = (characterId: string) => {
    setActiveCharacter(characterId);
    navigation.navigate('CharacterDetail', { characterId });
  };

  const handleConversationPress = (convId: string) => {
    setActiveConversation(convId);
    navigation.navigate('ChatDetail');
  };

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'create':
        navigation.navigate('Characters');
        break;
      case 'image':
        navigation.navigate('ImageGen');
        break;
      case 'roleplay':
        navigation.navigate('Roleplay');
        break;
      case 'store':
        navigation.navigate('Store');
        break;
    }
  };

  const recentChats = conversations
    .filter((c) => c.messages.length > 0)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>你好 👋</Text>
              <Text style={styles.headerSubtitle}>今天想和谁聊天？</Text>
            </View>
            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.avatarBtnText}>⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickBtn, { backgroundColor: action.color }]}
                onPress={() => handleQuickAction(action.id)}
              >
                <Text style={styles.quickBtnIcon}>{action.icon}</Text>
                <Text style={styles.quickBtnLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Featured Characters */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>推荐角色</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Characters')}>
                <Text style={styles.seeAll}>查看全部 →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.characterScroll}
              snapToInterval={CARD_WIDTH + 12}
              decelerationRate="fast"
            >
              {characters.slice(0, 6).map((char) => (
                <TouchableOpacity
                  key={char.id}
                  style={[styles.characterCard, { width: CARD_WIDTH }]}
                  onPress={() => handleCharacterPress(char.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.charCardGradient}>
                    <View style={styles.charAvatarCircle}>
                      <Text style={styles.charAvatarEmoji}>{char.avatar}</Text>
                    </View>
                    <Text style={styles.charName}>{char.name}</Text>
                    <Text style={styles.charPersonality} numberOfLines={2}>
                      {char.personality}
                    </Text>
                    <View style={styles.charBadge}>
                      <Text style={styles.charBadgeText}>
                        {char.isPreset ? '预设' : '自定义'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Recent Conversations */}
          {recentChats.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>最近对话</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Conversations')}>
                  <Text style={styles.seeAll}>查看全部 →</Text>
                </TouchableOpacity>
              </View>
              {recentChats.map((conv) => {
                const char = characters.find((c) => c.id === conv.characterId);
                return (
                  <TouchableOpacity
                    key={conv.id}
                    style={styles.convItem}
                    onPress={() => handleConversationPress(conv.id)}
                  >
                    <View style={styles.convAvatar}>
                      <Text style={styles.convAvatarEmoji}>{char?.avatar || '✨'}</Text>
                    </View>
                    <View style={styles.convInfo}>
                      <Text style={styles.convTitle} numberOfLines={1}>
                        {conv.title}
                      </Text>
                      <Text style={styles.convPreview} numberOfLines={1}>
                        {conv.messages[conv.messages.length - 1]?.content || '开始新对话'}
                      </Text>
                    </View>
                    <Text style={styles.convTime}>
                      {formatRelativeTime(conv.updatedAt)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  bgCircle1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(168, 85, 247, 0.04)',
    top: -60,
    right: -60,
  },
  bgCircle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(236, 72, 153, 0.04)',
    bottom: '30%',
    left: -40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.15)',
  },
  avatarBtnText: {
    fontSize: 20,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickBtnIcon: {
    fontSize: 24,
  },
  quickBtnLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  section: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  seeAll: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  characterScroll: {
    paddingRight: 16,
  },
  characterCard: {
    marginRight: 12,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.1)',
  },
  charCardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  charAvatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.25)',
  },
  charAvatarEmoji: {
    fontSize: 32,
  },
  charName: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  charPersonality: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 10,
  },
  charBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  charBadgeText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.06)',
  },
  convAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  convAvatarEmoji: {
    fontSize: 22,
  },
  convInfo: {
    flex: 1,
  },
  convTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 3,
  },
  convPreview: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  convTime: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginLeft: 8,
  },
});