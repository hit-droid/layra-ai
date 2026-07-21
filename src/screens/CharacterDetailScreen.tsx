import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useCharacterStore } from '@/stores/characterStore';
import { useChatStore } from '@/stores/chatStore';
import { theme } from '@/theme';

type ParamList = {
  CharacterDetail: { characterId: string };
};

export default function CharacterDetailScreen() {
  const route = useRoute<RouteProp<ParamList, 'CharacterDetail'>>();
  const navigation = useNavigation<any>();
  const { characterId } = route.params;
  const characters = useCharacterStore((s) => s.characters);
  const setActiveCharacter = useCharacterStore((s) => s.setActiveCharacter);
  const createConversation = useChatStore((s) => s.createConversation);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const character = characters.find((c) => c.id === characterId);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!character) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>角色未找到</Text>
      </SafeAreaView>
    );
  }

  const handleStartChat = () => {
    setActiveCharacter(character.id);
    const convId = createConversation(character.id, `与 ${character.name} 的对话`);
    setActiveConversation(convId);
    navigation.navigate('ChatDetail');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>← 返回</Text>
        </TouchableOpacity>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <View style={styles.avatarGlow} />
            <Text style={styles.avatarEmoji}>{character.avatar}</Text>
          </View>
          <Text style={styles.name}>{character.name}</Text>
          {character.isPreset && (
            <View style={styles.presetBadge}>
              <Text style={styles.presetBadgeText}>官方预设</Text>
            </View>
          )}
        </View>

        {/* Personality */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>性格特点</Text>
          <Text style={styles.cardText}>{character.personality}</Text>
        </View>

        {/* System Prompt */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>系统设定</Text>
          <Text style={styles.cardText}>{character.systemPrompt}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={handleStartChat}
            activeOpacity={0.8}
          >
            <Text style={styles.chatBtnIcon}>💬</Text>
            <Text style={styles.chatBtnText}>开始对话</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  errorText: {
    color: theme.colors.text,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtnText: {
    fontSize: 15,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  avatarGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(168, 85, 247, 0.05)',
  },
  avatarEmoji: {
    fontSize: 44,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  presetBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  presetBadgeText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.08)',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  actions: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  chatBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chatBtnIcon: {
    fontSize: 20,
  },
  chatBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
});