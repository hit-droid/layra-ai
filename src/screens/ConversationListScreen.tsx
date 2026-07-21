import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Animated, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useChatStore } from '@/stores/chatStore';
import { useCharacterStore } from '@/stores/characterStore';
import { theme } from '@/theme';

export default function ConversationListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const conversations = useChatStore((s) => s.conversations);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const characters = useCharacterStore((s) => s.characters);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  const handlePress = (convId: string) => {
    setActiveConversation(convId);
    navigation.navigate('ChatDetail');
  };

  const handleDelete = (convId: string) => {
    const conv = conversations.find((c) => c.id === convId);
    Alert.alert('删除对话', `确定要删除「${conv?.title || '对话'}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => deleteConversation(convId),
      },
    ]);
  };

  const handleNewChat = () => {
    navigation.navigate('Home');
  };

  const getCharForConv = (characterId: string) => {
    return characters.find((c) => c.id === characterId);
  };

  const renderItem = ({ item }: { item: typeof conversations[0] }) => {
    const char = getCharForConv(item.characterId);
    const lastMsg = item.messages[item.messages.length - 1];
    const preview = lastMsg
      ? (lastMsg.content.length > 50 ? lastMsg.content.slice(0, 50) + '...' : lastMsg.content)
      : '新对话';

    return (
      <TouchableOpacity
        style={styles.convItem}
        onPress={() => handlePress(item.id)}
        onLongPress={() => handleDelete(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>{char?.avatar || '💬'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.preview} numberOfLines={1}>
            {preview}
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.time}>{formatTime(item.updatedAt)}</Text>
          <Text style={styles.count}>{item.messages.length} 条消息</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {sorted.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>还没有对话</Text>
            <Text style={styles.emptyDesc}>选择角色开始你的第一次对话</Text>
            <TouchableOpacity style={styles.newChatBtn} onPress={handleNewChat}>
              <Text style={styles.newChatBtnText}>开始新对话</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={sorted}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>
    </View>
  );
}

function formatTime(timestamp: number): string {
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
  content: {
    flex: 1,
  },
  list: {
    padding: 16,
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
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  preview: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  right: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  time: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  count: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  newChatBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  newChatBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});