import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';
import { theme } from '@/theme';

export default function SettingsScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const handleChange = (key: string, value: unknown) => {
    updateSettings({ [key]: value });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>设置</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* API Keys */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔑 API 密钥</Text>
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => setShowKeys(!showKeys)}
          >
            <Text style={styles.toggleText}>{showKeys ? '隐藏密钥' : '显示密钥'}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>OpenAI API Key</Text>
          <TextInput
            style={styles.input}
            value={settings.openaiKey}
            onChangeText={(v) => handleChange('openaiKey', v)}
            placeholder="sk-..."
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry={!showKeys}
          />

          <Text style={styles.label}>OpenAI 模型</Text>
          <View style={styles.modelRow}>
            {['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'].map((model) => (
              <TouchableOpacity
                key={model}
                style={[styles.modelBtn, settings.openaiModel === model && styles.modelActive]}
                onPress={() => handleChange('openaiModel', model)}
              >
                <Text style={[styles.modelText, settings.openaiModel === model && styles.modelActiveText]}>
                  {model}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Stability AI API Key</Text>
          <TextInput
            style={styles.input}
            value={settings.stabilityKey}
            onChangeText={(v) => handleChange('stabilityKey', v)}
            placeholder="sk-..."
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry={!showKeys}
          />

          <Text style={styles.label}>ElevenLabs API Key</Text>
          <TextInput
            style={styles.input}
            value={settings.elevenlabsKey}
            onChangeText={(v) => handleChange('elevenlabsKey', v)}
            placeholder="输入 ElevenLabs Key..."
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry={!showKeys}
          />

          <Text style={styles.label}>服务器地址</Text>
          <TextInput
            style={styles.input}
            value={settings.serverUrl}
            onChangeText={(v) => handleChange('serverUrl', v)}
            placeholder="http://localhost:3001"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
          />
        </View>

        {/* Voice */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎤 语音设置</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>启用 TTS 语音</Text>
            <Switch
              value={settings.ttsEnabled}
              onValueChange={(v) => handleChange('ttsEnabled', v)}
              trackColor={{ false: theme.colors.card, true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Theme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 主题</Text>
          <Text style={styles.label}>强调色</Text>
          <View style={styles.colorRow}>
            {['#a855f7', '#06b6d4', '#ec4899', '#f59e0b', '#22c55e', '#ef4444'].map((color) => (
              <TouchableOpacity
                key={color}
                style={[styles.colorDot, { backgroundColor: color }, settings.accentColor === color && styles.colorActive]}
                onPress={() => handleChange('accentColor', color)}
              />
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Layra AI v1.0.0</Text>
          <Text style={styles.footerSubtext}>你的个人 AI 伴侣</Text>
        </View>
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
  content: { flex: 1 },
  section: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, margin: theme.spacing.md,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.08)',
  },
  sectionTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, marginBottom: theme.spacing.md },
  toggleBtn: { alignSelf: 'flex-end', marginTop: -theme.spacing.xl, marginBottom: theme.spacing.md },
  toggleText: { fontSize: theme.fontSize.xs, color: theme.colors.primary },
  label: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm, marginTop: theme.spacing.md },
  input: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md, color: theme.colors.text,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.1)',
  },
  modelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  modelBtn: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs + 3,
    borderWidth: 1, borderColor: 'transparent',
  },
  modelActive: { backgroundColor: 'rgba(168,85,247,0.15)', borderColor: theme.colors.primary },
  modelText: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  modelActiveText: { color: theme.colors.primary },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: theme.fontSize.md, color: theme.colors.text },
  colorRow: { flexDirection: 'row', gap: theme.spacing.md },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  colorActive: { borderWidth: 3, borderColor: '#fff' },
  footer: { alignItems: 'center', paddingVertical: theme.spacing.xl },
  footerText: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary },
  footerSubtext: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 4 },
});