import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Character } from '@/types';
import { theme } from '@/theme';

interface Props {
  character: Character;
  isActive: boolean;
  onSelect: (id: string) => void;
  onEdit?: (character: Character) => void;
  onDelete?: (id: string) => void;
}

export function CharacterCard({ character, isActive, onSelect }: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.activeCard]}
      onPress={() => onSelect(character.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, isActive && styles.activeAvatar]}>
        <Text style={styles.avatarText}>{character.avatar}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, isActive && styles.activeName]}>{character.name}</Text>
        <Text style={styles.personality} numberOfLines={2}>
          {character.personality}
        </Text>
        {character.isPreset && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>预设</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.08)',
    alignItems: 'center',
  },
  activeCard: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  activeAvatar: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  avatarText: {
    fontSize: 24,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  activeName: {
    color: theme.colors.primary,
  },
  personality: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    marginTop: theme.spacing.xs,
  },
  badgeText: {
    fontSize: 10,
    color: theme.colors.primary,
  },
});