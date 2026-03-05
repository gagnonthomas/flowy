import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import TodoScreen from '../screens/TodoScreen';
import FocusTimerScreen from '../screens/FocusTimerScreen';
import MoodScreen from '../screens/MoodScreen';
import MoreScreen from '../screens/MoreScreen';
import HabitsScreen from '../screens/HabitsScreen';

// Sub-screens
import JarScreen from '../screens/JarScreen';
import AnnualBoardScreen from '../screens/AnnualBoardScreen';
import EmergencyKitScreen from '../screens/EmergencyKitScreen';
import BreathingScreen from '../screens/BreathingScreen';
import WeeklyReviewScreen from '../screens/WeeklyReviewScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import BadDayModeScreen from '../screens/BadDayModeScreen';
import LetterScreen from '../screens/LetterScreen';
import LunarScreen from '../screens/LunarScreen';
import DreamJournalScreen from '../screens/DreamJournalScreen';
import SleepScreen from '../screens/SleepScreen';
import HydrationScreen from '../screens/HydrationScreen';
import InspirationScreen from '../screens/InspirationScreen';
import TravelScreen from '../screens/TravelScreen';
import RelationshipsScreen from '../screens/RelationshipsScreen';
import EnergyMonitorScreen from '../screens/EnergyMonitorScreen';
import CreativeJournalScreen from '../screens/CreativeJournalScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TAB_ICONS = {
  Accueil: 'home',
  Planning: 'list',
  Focus: 'timer',
  'Bien-être': 'heart',
  Explorer: 'grid',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons name={focused ? TAB_ICONS[route.name] : TAB_ICONS[route.name] + '-outline'} size={size} color={color} />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 24,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Accueil" component={DashboardScreen} />
      <Tab.Screen name="Planning" component={TodoScreen} />
      <Tab.Screen name="Focus" component={FocusTimerScreen} />
      <Tab.Screen name="Bien-être" component={MoodScreen} />
      <Tab.Screen name="Explorer" component={MoreScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        {/* Modals & sub-screens */}
        <Stack.Screen name="Jar" component={JarScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="AnnualBoard" component={AnnualBoardScreen} />
        <Stack.Screen name="EmergencyKit" component={EmergencyKitScreen} />
        <Stack.Screen name="Breathing" component={BreathingScreen} />
        <Stack.Screen name="WeeklyReview" component={WeeklyReviewScreen} />
        <Stack.Screen name="Challenges" component={ChallengesScreen} />
        <Stack.Screen name="BadDayMode" component={BadDayModeScreen} />
        <Stack.Screen name="Letter" component={LetterScreen} />
        <Stack.Screen name="LunarScreen" component={LunarScreen} />
        <Stack.Screen name="DreamJournal" component={DreamJournalScreen} />
        <Stack.Screen name="Sleep" component={SleepScreen} />
        <Stack.Screen name="Hydration" component={HydrationScreen} />
        <Stack.Screen name="Inspiration" component={InspirationScreen} />
        <Stack.Screen name="Travel" component={TravelScreen} />
        <Stack.Screen name="Relationships" component={RelationshipsScreen} />
        <Stack.Screen name="EnergyMonitor" component={EnergyMonitorScreen} />
        <Stack.Screen name="Habits" component={HabitsScreen} />
        <Stack.Screen name="CreativeJournal" component={CreativeJournalScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
