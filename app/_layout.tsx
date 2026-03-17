import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_700Bold,
  PlayfairDisplay_900Black_Italic,
} from '@expo-google-fonts/playfair-display';
import { useFlowiStore } from '@/store';
import { requestPermissions, scheduleEnergyCheckins, scheduleStreakReminder } from '@/utils/notifications';
import { ToastProvider } from '@/components/ui/Toast';
import { buildWidgetData, saveWidgetData } from '@/widget/widget-data';
import { flush as flushAnalytics } from '@/utils/analytics';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { checkStorage } from '@/utils/storage-safety';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const darkMode = useFlowiStore((s) => s.darkMode);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_900Black_Italic,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Setup notifications + storage check on first load
  useEffect(() => {
    (async () => {
      // Check storage health
      await checkStorage();
      // Notifications
      const granted = await requestPermissions();
      if (granted) {
        await scheduleEnergyCheckins();
        await scheduleStreakReminder();
      }
    })();
  }, []);

  // Update widget data & flush analytics when store changes
  useEffect(() => {
    const unsub = useFlowiStore.subscribe((state) => {
      saveWidgetData(buildWidgetData(state));
      flushAnalytics();
    });
    return unsub;
  }, []);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider />
        <StatusBar style={darkMode ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
