import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useToolStore } from '@/stores/toolStore';
import { theme } from '@/theme';
import type { AITool } from '@/types';

export default function ToolDetailScreen({ route }: any) {
  const tool: AITool = route.params?.tool;
  const connectTool = useToolStore((s) => s.connectTool);
  const disconnectTool = useToolStore((s) => s.disconnectTool);
  const tools = useToolStore((s) => s.tools);
  const current = tools.find((t) => t.id === tool?.id) || tool;

  const [apiKey, setApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(false);

  if (!tool) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>工具不存在</Text>
      </View>
    );
  }

  const handleConnect = () => {
    if (tool.pricing !== 'free' && !apiKey.trim()) {
      Alert.alert('提示', '请输入 API Key');
      return;
    }
    connectTool(tool.id, apiKey || undefined);
    setShowApiInput(false);
    setApiKey('');
  };

  const pricingColor = tool.pricing === 'free' ? theme.colors.success : tool.pricing === 'freemium' ? theme.colors.warning : theme.colors.primary;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{tool.icon}</Text>
          </View>
          <Text style={styles.name}>{tool.name}</Text>
          <Text style={styles.provider}>{tool.provider}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.pricingBadge, { backgroundColor: `${pricingColor}15` }]}>
              <Text style={[styles.pricingText, { color: pricingColor }]}>
                {tool.pricing === 'free' ? '免费' : tool.pricing === 'freemium' ? '增值' : '付费'}
              </Text>
            </View>
            <Text style={styles.rating}>⭐ {tool.rating}</Text>
            <Text style={styles.users}>{(tool.users / 1000000).toFixed(0)}M 用户</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>简介</Text>
        <Text style={styles.description}>{tool.description}</Text>

        <Text style={styles.sectionTitle}>功能特性</Text>
        <View style={styles.featureList}>
          {tool.features.map((feat, i) => (
            <View key={i} style={styles.featureItem}>
              <Text style={styles.featureText}>✅ {feat}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>技术信息</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>API 类型</Text>
          <Text style={styles.infoValue}>{tool.apiType.toUpperCase()}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>分类</Text>
          <Text style={styles.infoValue}>{tool.category}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>文档</Text>
          <Text style={styles.infoValue}>{tool.docsUrl}</Text>
        </View>

        {showApiInput && (
          <View style={styles.apiInputContainer}>
            <Text style={styles.sectionTitle}>API Key</Text>
            <TextInput
              style={styles.apiInput}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="输入 API Key"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {current.isConnected ? (
          <TouchableOpacity style={styles.disconnectBtn} onPress={() => disconnectTool(tool.id)}>
            <Text style={styles.disconnectText}>断开连接</Text>
          </TouchableOpacity>
        ) : (
          <>
            {!showApiInput && tool.pricing !== 'free' && (
              <TouchableOpacity style={styles.footerBtn} onPress={() => setShowApiInput(true)}>
                <Text style={styles.footerBtnText}>输入 API Key 连接</Text>
              </TouchableOpacity>
            )}
            {(showApiInput || tool.pricing === 'free') && (
              <TouchableOpacity style={styles.connectBtn} onPress={handleConnect}>
                <Text style={styles.connectText}>连接工具</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg },
  header: { alignItems: 'center', marginBottom: theme.spacing.lg },
  iconContainer: { width: 80, height: 80, borderRadius: theme.borderRadius.xl, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md, borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)' },
  icon: { fontSize: 40 },
  name: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.text, marginBottom: 4 },
  provider: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted },
  metaRow: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.sm, alignItems: 'center' },
  pricingBadge: { borderRadius: theme.borderRadius.full, paddingHorizontal: theme.spacing.md, paddingVertical: 4 },
  pricingText: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.medium },
  rating: { fontSize: theme.fontSize.sm, color: theme.colors.warning },
  users: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  sectionTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm },
  description: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary, lineHeight: 22 },
  featureList: { gap: theme.spacing.xs },
  featureItem: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.sm },
  featureText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.xs },
  infoLabel: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted },
  infoValue: { fontSize: theme.fontSize.sm, color: theme.colors.text },
  apiInputContainer: { marginTop: theme.spacing.md },
  apiInput: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md, color: theme.colors.text,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)',
  },
  footer: { padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: 'rgba(168,85,247,0.1)' },
  footerBtn: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, paddingVertical: theme.spacing.md, alignItems: 'center' },
  footerBtnText: { color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.medium },
  connectBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, paddingVertical: theme.spacing.md, alignItems: 'center' },
  connectText: { color: '#fff', fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
  disconnectBtn: { backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: theme.borderRadius.md, paddingVertical: theme.spacing.md, alignItems: 'center' },
  disconnectText: { color: theme.colors.error, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
  errorText: { color: theme.colors.error, textAlign: 'center', marginTop: 100 },
});