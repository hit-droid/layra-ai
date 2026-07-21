import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput,
  Modal, ScrollView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCharacterStore } from '@/stores/characterStore';
import { CharacterCard } from '@/components/CharacterCard';
import { theme } from '@/theme';
import type { Character } from '@/types';

const AVATARS = ['✨', '🌟', '💫', '🎭', '🦊', '🐱', '🐉', '🤖', '👾', '🎯', '🔥', '💎', '🌙', '⭐', '🦋'];

export default function CharactersScreen() {
  const navigation = useNavigation<any>();
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

  useEffect(() => { loadCharacters(); }, []);

  const filtered = characters.filter((c) =>
    c.name.includes(search) || c.personality.includes(search)
  );

  const handleSelect = (id: string) => {
    setActiveCharacter(id);
    navigation.navigate('CharacterDetail', { characterId: id });
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
        showsVerticalScrollIndicator={false}
      />

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
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
    paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1, borderBottomColor: 'rgba(168,85,247,0.1)',
  },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  addBtn: { backgroundColor: theme.colors.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  searchInput: {
    backgroundColor: theme.colors.surface, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: theme.colors.text,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.12)',
  },
  list: { padding: 16, paddingTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text, marginBottom: 24, textAlign: 'center' },
  label: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 8, marginTop: 16, fontWeight: '500' },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  avatarOption: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center' },
  avatarActive: { backgroundColor: 'rgba(168,85,247,0.3)', borderWidth: 2, borderColor: theme.colors.primary },
  avatarOptionText: { fontSize: 20 },
  input: {
    backgroundColor: theme.colors.card, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: theme.colors.text,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.1)',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 16 },
  cancelBtn: { flex: 1, backgroundColor: theme.colors.card, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelText: { color: theme.colors.textSecondary, fontSize: 15, fontWeight: '500' },
  saveBtn: { flex: 1, backgroundColor: theme.colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});