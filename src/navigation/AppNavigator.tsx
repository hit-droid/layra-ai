import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { theme } from '@/theme';

import ChatScreen from '@/screens/ChatScreen';
import CharactersScreen from '@/screens/CharactersScreen';
import ImageGenScreen from '@/screens/ImageGenScreen';
import RoleplayScreen from '@/screens/RoleplayScreen';
import PluginMarketScreen from '@/screens/PluginMarketScreen';
import PluginDetailScreen from '@/screens/PluginDetailScreen';
import MyPluginsScreen from '@/screens/MyPluginsScreen';
import AIToolsScreen from '@/screens/AIToolsScreen';
import ToolDetailScreen from '@/screens/ToolDetailScreen';
import SettingsScreen from '@/screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabIcon = ({ icon, focused }: { icon: string; focused: boolean }) => (
  <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
);

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: 'rgba(168, 85, 247, 0.1)',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarLabel: '对话',
          tabBarIcon: ({ focused }) => <TabIcon icon="💬" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Characters"
        component={CharactersScreen}
        options={{
          tabBarLabel: '角色',
          tabBarIcon: ({ focused }) => <TabIcon icon="👥" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ImageGen"
        component={ImageGenScreen}
        options={{
          tabBarLabel: '图像',
          tabBarIcon: ({ focused }) => <TabIcon icon="🎨" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Roleplay"
        component={RoleplayScreen}
        options={{
          tabBarLabel: '扮演',
          tabBarIcon: ({ focused }) => <TabIcon icon="🎭" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: '设置',
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PluginMarket"
          component={PluginMarketScreen}
          options={{ title: '插件市场' }}
        />
        <Stack.Screen
          name="PluginDetail"
          component={PluginDetailScreen}
          options={{ title: '插件详情' }}
        />
        <Stack.Screen
          name="MyPlugins"
          component={MyPluginsScreen}
          options={{ title: '我的插件' }}
        />
        <Stack.Screen
          name="AITools"
          component={AIToolsScreen}
          options={{ title: 'AI 工具集' }}
        />
        <Stack.Screen
          name="ToolDetail"
          component={ToolDetailScreen}
          options={{ title: '工具详情' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}