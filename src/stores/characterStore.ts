import { create } from 'zustand';
import type { Character } from '@/types';
import { storage } from '@/utils/storage';
import { generateId } from '@/utils/id';
import { PRESET_CHARACTERS } from '@/data/characters';

interface CharacterState {
  characters: Character[];
  activeCharacterId: string;
  isLoading: boolean;
  loadCharacters: () => Promise<void>;
  getActiveCharacter: () => Character;
  setActiveCharacter: (id: string) => void;
  addCharacter: (character: Omit<Character, 'id' | 'createdAt'>) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  characters: [],
  activeCharacterId: 'layra-default',
  isLoading: true,

  loadCharacters: async () => {
    const saved = await storage.getCharacters<Character[]>([]);
    const all = [...PRESET_CHARACTERS, ...saved.filter((c: Character) => !c.isPreset)];
    const activeId = await storage.getActiveCharacter<string>('layra-default');
    set({ characters: all, activeCharacterId: activeId, isLoading: false });
  },

  getActiveCharacter: () => {
    const { characters, activeCharacterId } = get();
    return characters.find((c) => c.id === activeCharacterId) || characters[0] || PRESET_CHARACTERS[0];
  },

  setActiveCharacter: (id: string) => {
    storage.setActiveCharacter(id);
    set({ activeCharacterId: id });
  },

  addCharacter: (character) => {
    const newChar: Character = {
      ...character,
      id: generateId(),
      createdAt: Date.now(),
    };
    const { characters } = get();
    const updated = [...characters, newChar];
    const custom = updated.filter((c) => !c.isPreset);
    storage.setCharacters(custom);
    set({ characters: updated });
  },

  updateCharacter: (id, updates) => {
    const { characters } = get();
    const updated = characters.map((c) => (c.id === id ? { ...c, ...updates } : c));
    const custom = updated.filter((c) => !c.isPreset);
    storage.setCharacters(custom);
    set({ characters: updated });
  },

  deleteCharacter: (id) => {
    const { characters, activeCharacterId } = get();
    const updated = characters.filter((c) => c.id !== id);
    const custom = updated.filter((c) => !c.isPreset);
    storage.setCharacters(custom);
    const newActive = activeCharacterId === id ? 'layra-default' : activeCharacterId;
    storage.setActiveCharacter(newActive);
    set({ characters: updated, activeCharacterId: newActive });
  },
}));