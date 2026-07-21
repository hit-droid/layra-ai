import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput,
  Modal, ScrollView, Alert,
} from 'react-native';
import { useCharacterStore } from '@/stores/characterStore';
import { useChatStore } from '@/stores/chatStore';
import { CharacterCard } from '@/components/CharacterCard';
import { theme } from '@/theme';
import type { Character } from '@/types';

const AVATARS = ['✨', '🌟', '💫', '🎭', '🦊', '🐱', '🐉', '🤖', '👾', '🎯', '🔥', '💎', '🌙', '⭐', '🦋'];

export default function CharactersScreen() {
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [formName, setFormName] = useState('');
  const [formAvatar, setFormAvatar] = useState('✨');
  const [formPersonality, setFormPersonality] = useState('');
  const [formPrompt, setFormPrompt] = useState('');

  const characters = useCharacterStore((s) => s.characters);
  const activeCharacterId = useCharacterStore((s) => s.activeCharacterId);
  const loadCharacters = useCharacterStore((s) => s.loadCharacters);
  const setActiveCharacter = useCharacterStore((s) => s.setActiveCharacter);
  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  const deleteCharacter = useCharacterStore((s) => s.deleteCharacter);
  const createConversation = useChatStore((s) => s.createConversation);

  useEffect(() => { loadCharacters(); }, []);

  const filtered = characters.filter((c) =>
    c.name.includes(search) || c.personality.includes(search)
  );

  const handleSelect = (id: string) => {
    setActiveCharacter(id);
    createConversation(id);
  };

  const handleEdit = (char: Character) => {
    setEditingChar(char);
    setFormName(char.name);
    setFormAvatar(char.avatar);
    setFormPersonality(char.personality);
    setFormPrompt(char.systemPrompt);
    setModalVisible(true);
  };

  const handleCreate = () => {
    setEditingChar(null);
    setFormName('');
    setFormAvatar('✨');
    setFormPersonality('');
    setFormPrompt('');
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formPrompt.trim()) {
      Alert.alert('提示', '请填写角色名称和系统提示词');
      return;
    }
    const data = {
      name: formName.trim(),
      avatar: formAvatar,
      personality: formPersonality.trim(),
      systemPrompt: formPrompt.trim(),
      isPreset: false,
    };
    if (editingChar) {
      updateCharacter(editingChar.id, data);
    } else {
      addCharacter(data);
    }
    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    const char = characters.find((c) => c.id === id);
    if (char?.isPreset) return;
    Alert.alert('确认删除', `确定要删除角色「${char?.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => deleteCharacter(id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI 角色</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleCreate}>
          <Text style={styles.addBtnText}>+ 创建</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="搜索角色..."
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CharacterCard
            character={item}
            isActive={item.id === activeCharacterId}
            onSelect={handleSelect}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={styles.list}
      />

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editingChar ? '编辑角色' : '创建角色'}
              </Text>

              <Text style={styles.label}>选择头像</Text>
              <View style={styles.avatarGrid}>
                {AVATARS.map((a) => (
                  <TouchableOpacity
                    key={a}
                    style={[styles.avatarOption, formAvatar === a && styles.avatarActive]}
                    onPress={() => setFormAvatar(a)}
                  >
                    <Text style={styles.avatarOptionText}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>角色名称</Text>
              <TextInput
                style={styles.input}
                value={formName}
                onChangeText={setFormName}
                placeholder="给角色取个名字"
                placeholderTextColor={theme.colors.textMuted}
              />

              <Text style={styles.label}>性格描述</Text>
              <TextInput
                style={styles.input}
                value={formPersonality}
                onChangeText={setFormPersonality}
                placeholder="简短描述角色性格"
                placeholderTextColor={theme.colors.textMuted}
              />

              <Text style={styles.label}>系统提示词</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formPrompt}
                onChangeText={setFormPrompt}
                placeholder="定义 AI 的行为和语气..."
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveText}>保存</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1, borderBottomColor: 'rgba(168,85,247,0.1)',
  },
  title: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  addBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm },
  addBtnText: { color: '#fff', fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold },
  searchContainer: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm },
  searchInput: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md, color: theme.colors.text,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.1)',
  },
  list: { padding: theme.spacing.md },
  modalOverlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: theme.spacing.lg, maxHeight: '85%' },
  modalTitle: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.text, marginBottom: theme.spacing.lg, textAlign: 'center' },
  label: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm, marginTop: theme.spacing.md },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  avatarOption: { width: 44, height: 44, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center' },
  avatarActive: { backgroundColor: 'rgba(168,85,247,0.3)', borderWidth: 2, borderColor: theme.colors.primary },
  avatarOptionText: { fontSize: 20 },
  input: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md, color: theme.colors.text,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.1)',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.lg, marginBottom: theme.spacing.lg },
  cancelBtn: { flex: 1, backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, paddingVertical: theme.spacing.md, alignItems: 'center' },
  cancelText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.medium },
  saveBtn: { flex: 1, backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, paddingVertical: theme.spacing.md, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
});