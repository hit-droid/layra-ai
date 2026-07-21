import React, { useEffect, useRef, useState } from 'react';
import {
  View, FlatList, StyleSheet, Text, TouchableOpacity,
  Modal, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useChatStore } from '@/stores/chatStore';
import { useCharacterStore } from '@/stores/characterStore';
import { MessageBubble } from '@/components/MessageBubble';
import { TypingIndicator } from '@/components/TypingIndicator';
import { ChatInput } from '@/components/ChatInput';
import { EmptyState } from '@/components/EmptyState';
import { theme } from '@/theme';

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const flatListRef = useRef<FlatList>(null);
  const [charModalVisible, setCharModalVisible] = useState(false);

  const conversation = useChatStore((s) => {
    const activeId = s.activeConversationId;
    return s.conversations.find((c) => c.id === activeId) || null;
  });
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const loadConversations = useChatStore((s) => s.loadConversations);

  const characters = useCharacterStore((s) => s.characters);
  const activeCharacterId = useCharacterStore((s) => s.activeCharacterId);
  const setActiveCharacter = useCharacterStore((s) => s.setActiveCharacter);
  const createConversation = useChatStore((s) => s.createConversation);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  const activeCharacter = characters.find((c) => c.id === activeCharacterId) || characters[0];

  useEffect(() => {
    loadConversations();
  }, []);

  const messages = conversation?.messages || [];

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSwitchCharacter = (charId: string) => {
    setActiveCharacter(charId);
    const convId = createConversation(charId, `与 ${characters.find((c) => c.id === charId)?.name} 的对话`);
    setActiveConversation(convId);
    setCharModalVisible(false);
  };

  const renderItem = ({ item }: { item: typeof messages[0] }) => (
    <MessageBubble message={item} />
  );

  const keyExtractor = (item: typeof messages[0]) => item.id;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerInfo}
          onPress={() => setCharModalVisible(true)}
        >
          <View style={styles.headerAvatarContainer}>
            <Text style={styles.headerAvatar}>{activeCharacter?.avatar || '✨'}</Text>
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.headerTitle}>{activeCharacter?.name || 'Layra'}</Text>
            <Text style={styles.headerSubtitle}>
              {isStreaming ? '正在输入...' : '在线'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuBtn}>
          <Text style={styles.menuBtnText}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {messages.length === 0 && !isStreaming ? (
        <EmptyState
          icon="💬"
          title="开始对话"
          description={`与 ${activeCharacter?.name || 'AI'} 畅聊任何话题`}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          style={styles.messageList}
          contentContainerStyle={styles.messageContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            isStreaming ? (
              streamingContent ? (
                <MessageBubble
                  message={{
                    id: 'streaming',
                    role: 'assistant',
                    content: streamingContent,
                    timestamp: Date.now(),
                  }}
                  isStreaming
                />
              ) : (
                <TypingIndicator />
              )
            ) : null
          }
        />
      )}

      <ChatInput />

      {/* Character Switch Modal */}
      <Modal
        visible={charModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCharModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle}>
              <View style={styles.modalHandleBar} />
            </View>
            <Text style={styles.modalTitle}>切换角色</Text>
            {characters.map((char) => (
              <TouchableOpacity
                key={char.id}
                style={[
                  styles.charOption,
                  char.id === activeCharacterId && styles.charOptionActive,
                ]}
                onPress={() => handleSwitchCharacter(char.id)}
              >
                <View style={styles.charOptionAvatar}>
                  <Text style={styles.charOptionAvatarText}>{char.avatar}</Text>
                </View>
                <View style={styles.charOptionInfo}>
                  <Text style={styles.charOptionName}>{char.name}</Text>
                  <Text style={styles.charOptionPersonality} numberOfLines={1}>
                    {char.personality}
                  </Text>
                </View>
                {char.id === activeCharacterId && (
                  <Text style={styles.charOptionCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setCharModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(168, 85, 247, 0.1)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
  },
  backBtnText: {
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  headerAvatarContainer: {
    position: 'relative',
    marginRight: 10,
  },
  headerAvatar: {
    fontSize: 28,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.success,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: theme.colors.primary,
    marginTop: 1,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnText: {
    fontSize: 22,
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
  messageList: {
    flex: 1,
  },
  messageContent: {
    paddingVertical: 8,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  modalHandle: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.textMuted,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  charOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
  },
  charOptionActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
  },
  charOptionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  charOptionAvatarText: {
    fontSize: 20,
  },
  charOptionInfo: {
    flex: 1,
  },
  charOptionName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  charOptionPersonality: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  charOptionCheck: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  modalCloseBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});