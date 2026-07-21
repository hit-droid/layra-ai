import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from '@/navigation/AppNavigator';
import SplashScreen from '@/screens/SplashScreen';
import { useCharacterStore } from '@/stores/characterStore';
import { useChatStore } from '@/stores/chatStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePluginStore } from '@/stores/pluginStore';
import { useToolStore } from '@/stores/toolStore';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const loadCharacters = useCharacterStore((s) => s.loadCharacters);
  const loadConversations = useChatStore((s) => s.loadConversations);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const loadPlugins = usePluginStore((s) => s.loadPlugins);
  const loadTools = useToolStore((s) => s.loadTools);

  useEffect(() => {
    loadCharacters();
    loadConversations();
    loadSettings();
    loadPlugins();
    loadTools();
  }, []);

  if (!splashDone) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
        <SplashScreen onFinish={() => setSplashDone(true)} />
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
      <AppNavigator />
    </>
  );
}