import { Tabs } from 'expo-router';
import { Text, StyleSheet, useColorScheme } from 'react-native';
import { colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';

const TAB_CONFIG = [
  { name: 'accueil', icon: '🏠', label: 'Accueil' },
  { name: 'aujourdhui', icon: '📅', label: "Aujourd'hui" },
  { name: 'focus', icon: '⏱', label: 'Focus' },
  { name: 'planning', icon: '📆', label: 'Planning' },
  { name: 'taches', icon: '✅', label: 'Tâches' },
  { name: 'moi', icon: '💚', label: 'Moi' },
  { name: 'flowi', icon: '🧠', label: 'Flowi' },
] as const;

const SECTION_COLORS: Record<string, string> = {
  accueil: colors.accueil.accent,
  aujourdhui: colors.agenda.accent,
  focus: colors.focus.accent,
  planning: colors.planning.accent,
  taches: colors.todos.accent,
  moi: colors.moi.accent,
  flowi: colors.flowi.accent,
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: styles.tabLabel,
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ focused }) => (
              <Text style={[styles.tabIcon, focused && { transform: [{ scale: 1.15 }] }]}>
                {tab.icon}
              </Text>
            ),
            tabBarActiveTintColor: SECTION_COLORS[tab.name],
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 82,
    paddingBottom: 24,
    paddingTop: 8,
  },
  tabIcon: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 2,
  },
});
