import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, FlatList, Image, Alert,
} from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';
import { storage } from '@/utils/storage';
import { generateId } from '@/utils/id';
import { theme } from '@/theme';
import type { GeneratedImage, ImageStyle, ImageSize } from '@/types';

const STYLES: { value: ImageStyle; label: string; icon: string }[] = [
  { value: 'photorealistic', label: '写实', icon: '📷' },
  { value: 'anime', label: '动漫', icon: '🎌' },
  { value: 'digital-art', label: '数字艺术', icon: '🎨' },
  { value: 'oil-painting', label: '油画', icon: '🖼️' },
  { value: '3d-render', label: '3D', icon: '🎮' },
  { value: 'pixel-art', label: '像素', icon: '👾' },
];

export default function ImageGenScreen() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<ImageStyle>('digital-art');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const settings = useSettingsStore((s) => s.settings);

  useEffect(() => {
    storage.getImages<GeneratedImage[]>([]).then(setImages);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    if (!settings.stabilityKey) {
      Alert.alert('提示', '请在设置中配置 Stability AI API Key');
      return;
    }

    setLoading(true);
    try {
      const serverUrl = settings.serverUrl || 'http://localhost:3001';
      const response = await fetch(`${serverUrl}/api/image/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-stability-key': settings.stabilityKey,
        },
        body: JSON.stringify({ prompt: prompt.trim(), style }),
      });

      const data = await response.json();
      if (!response.ok) {
        Alert.alert('错误', data.error || '生成失败');
        return;
      }

      const newImages: GeneratedImage[] = data.images.map((img: { url: string }) => ({
        id: generateId(),
        prompt: prompt.trim(),
        url: img.url,
        style,
        createdAt: Date.now(),
      }));

      const updated = [...newImages, ...images];
      setImages(updated);
      storage.setImages(updated);
      setPrompt('');
    } catch {
      Alert.alert('错误', '网络连接失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    const updated = images.filter((i) => i.id !== id);
    setImages(updated);
    storage.setImages(updated);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI 图像生成</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Generation Panel */}
        <View style={styles.panel}>
          <TextInput
            style={styles.promptInput}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="描述你想要的图像..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.label}>风格</Text>
          <View style={styles.styleRow}>
            {STYLES.map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[styles.styleBtn, style === s.value && styles.styleActive]}
                onPress={() => setStyle(s.value)}
              >
                <Text style={[styles.styleText, style === s.value && styles.styleActiveText]}>
                  {s.icon} {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.generateBtn, !prompt.trim() && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            disabled={!prompt.trim() || loading}
          >
            <Text style={styles.generateText}>
              {loading ? '🔄 生成中...' : '🎨 生成图像'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Gallery */}
        <Text style={styles.galleryTitle}>图库</Text>
        {images.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🖼️</Text>
            <Text style={styles.emptyText}>还没有生成的图像</Text>
          </View>
        ) : (
          <View style={styles.galleryGrid}>
            {images.map((img) => (
              <View key={img.id} style={styles.galleryItem}>
                <Image source={{ uri: img.url }} style={styles.galleryImage} />
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(img.id)}
                >
                  <Text style={styles.deleteText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  content: { flex: 1, padding: theme.spacing.md },
  panel: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, marginBottom: theme.spacing.lg,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.1)',
  },
  promptInput: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, fontSize: theme.fontSize.md, color: theme.colors.text,
    minHeight: 80, textAlignVertical: 'top', marginBottom: theme.spacing.md,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.1)',
  },
  label: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
  styleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: theme.spacing.md },
  styleBtn: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs + 2,
    borderWidth: 1, borderColor: 'transparent',
  },
  styleActive: { backgroundColor: 'rgba(168,85,247,0.15)', borderColor: theme.colors.primary },
  styleText: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  styleActiveText: { color: theme.colors.primary },
  generateBtn: {
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md, alignItems: 'center',
  },
  generateBtnDisabled: { opacity: 0.4 },
  generateText: { color: '#fff', fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
  galleryTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, marginBottom: theme.spacing.md },
  emptyContainer: { alignItems: 'center', paddingVertical: theme.spacing.xl * 2 },
  emptyIcon: { fontSize: 48, marginBottom: theme.spacing.md },
  emptyText: { fontSize: theme.fontSize.md, color: theme.colors.textMuted },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  galleryItem: {
    width: '48%', aspectRatio: 1, borderRadius: theme.borderRadius.md, overflow: 'hidden',
    backgroundColor: theme.colors.card,
  },
  galleryImage: { width: '100%', height: '100%' },
  deleteBtn: { position: 'absolute', top: 4, right: 4, padding: 4 },
  deleteText: { fontSize: 16 },
});