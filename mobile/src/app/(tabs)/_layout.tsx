import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { colors, fonts } from '../../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const icon = (name: IconName, activeName: IconName) =>
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Ionicons name={focused ? activeName : name} size={22} color={color as string} />;
  };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="schedule" options={{ title: 'Schedule', tabBarIcon: icon('calendar-outline', 'calendar') }} />
      <Tabs.Screen name="dresses" options={{ title: 'Dresses', tabBarIcon: icon('shirt-outline', 'shirt') }} />
      <Tabs.Screen name="finance" options={{ title: 'Cash Flow', tabBarIcon: icon('wallet-outline', 'wallet') }} />
    </Tabs>
  );
}
