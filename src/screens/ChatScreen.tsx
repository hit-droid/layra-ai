import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, Text, TouchableOpacity,
  Modal, SafeAreaView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useChatStore } from '@/stores/chatStore';
import { useCharacterStore } from '@/stores/characterStore';
import { usePluginStore } from '@/stores/pluginStore';
import { MessageBubble } from '@/components/MessageBubble';
import { TypingIndicator } from '@/components/TypingIndicator';
import { ChatInput } from '@/components/ChatInput';
import { EmptyState } from '@/components/EmptyState';
import { theme } from '@/theme';
import {
  getInstalledFeatures,
  isWebSearchEnabled,
  isCodeRunnerEnabled,
  isTranslatorEnabled,
  isMemoryEnhanced,
  getPluginFeature,
} from '@/utils/pluginEngine';

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const flatListRef = useRef<FlatList>(null);
  const [charModalVisible, setCharModalVisible] = useState(false);
  const [webSearchOn, setWebSearchOn] = useState(false);
  const [translatingMsgId, setTranslatingMsgId] = useState<string | null>(null);

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

  const plugins = usePluginStore((s) => s.plugins);
  const installedPluginIds = plugins
    .filter((p) => p.isInstalled)
    .map((p) => p.id);

  const installedFeatures = getInstalledFeatures(installedPluginIds);
  const hasWebSearch = isWebSearchEnabled(installedPluginIds);
  const hasCodeRunner = isCodeRunnerEnabled(installedPluginIds);
  const hasTranslator = isTranslatorEnabled(installedPluginIds);
  const hasMemory = isMemoryEnhanced(installedPluginIds);

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

  const handleTranslate = useCallback(async (msgId: string, content: string) => {
    if (translatingMsgId) return;
    setTranslatingMsgId(msgId);
    const feature = getPluginFeature('plugin-translator');
    if (feature) {
      try {
        const result = await feature.execute(content, { targetLang: '中文' });
        Alert.alert('翻译结果', result);
      } catch {
        Alert.alert('翻译失败', '请检查网络连接');
      }
    }
    setTranslatingMsgId(null);
  }, [translatingMsgId]);

  const renderItem = ({ item }: { item: typeof messages[0] }) => (
    <View>
      <MessageBubble message={item} />
      {hasTranslator && item.role === 'assistant' && (
        <TouchableOpacity
          style={styles.translateBtn}
          onPress={() => handleTranslate(item.id, item.content)}
        >
          <Text style={styles.translateBtnText}>
            {translatingMsgId === item.id ? '⏳ 翻译中...' : '🌐 翻译'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const keyExtractor = (item: typeof messages[0]) => item.id;

  const installedNames = installedFeatures.map((f) => f.name).slice(0, 3).join(' · ');

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
              {isStreaming ? '正在输入...' : installedFeatures.length > 0 ? `已启用 ${installedFeatures.length} 个插件` : '在线'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          {hasWebSearch && (
            <TouchableOpacity
              style={[styles.toggleBtn, webSearchOn && styles.toggleBtnActive]}
              onPress={() => setWebSearchOn(!webSearchOn)}
            >
              <Text style={styles.toggleBtnIcon}>🔍</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.menuBtn}>
            <Text style={styles.menuBtnText}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Plugin Status Bar */}
      {installedFeatures.length > 0 && (
        <View style={styles.pluginBar}>
          <Text style={styles.pluginBarIcon}>⚡</Text>
          <Text style={styles.pluginBarText} numberOfLines={1}>
            {installedNames}
          </Text>
          {hasWebSearch && webSearchOn && (
            <View style={styles.searchActiveBadge}>
              <Text style={styles.searchActiveText}>搜索中</Text>
            </View>
          )}
        </View>
      )}

      {/* Messages */}
      {messages.length === 0 && !isStreaming ? (
        <EmptyState
          icon="💬"
          title="开始对话"
          description={`与 ${activeCharacter?.name || 'AI'} 畅聊任何话题${installedFeatures.length > 0 ? `\n已启用 ${installedFeatures.length} 个插件增强` : ''}`}
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

      <ChatInput
        webSearchEnabled={webSearchOn}
        hasCodeRunner={hasCodeRunner}
        hasMemory={hasMemory}
        installedFeatures={installedFeatures}
      />

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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.25)',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  toggleBtnIcon: {
    fontSize: 16,
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
  pluginBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(168, 85, 247, 0.08)',
    gap: 6,
  },
  pluginBarIcon: {
    fontSize: 12,
  },
  pluginBarText: {
    flex: 1,
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  searchActiveBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  searchActiveText: {
    fontSize: 10,
    color: theme.colors.success,
    fontWeight: '600',
  },
  messageList: {
    flex: 1,
  },
  messageContent: {
    paddingVertical: 8,
  },
  translateBtn: {
    alignSelf: 'flex-start',
    marginLeft: 56,
    marginBottom: 8,
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  translateBtnText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '500',
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