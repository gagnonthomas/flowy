import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useFlowiStore } from '@/store';
import { FlowerLogo } from '@/components/FlowerLogo';

export default function SplashIndex() {
  const onboarded = useFlowiStore((s) => s.onboarded);
  const darkMode = useFlowiStore((s) => s.darkMode);
  const router = useRouter();
  const [ready, setReady] = useState(false);

  // Fade out before navigating
  const fadeOut = useSharedValue(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      fadeOut.value = withTiming(0, { duration: 400 });
      setTimeout(() => {
        setReady(true);
      }, 400);
    }, 3800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready) {
      if (!onboarded) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)/aujourdhui');
      }
    }
  }, [ready]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeOut.value,
  }));

  return (
    <Animated.View style={[{ flex: 1 }, fadeStyle]}>
      <LinearGradient
        colors={darkMode ? ['#0f0f1a', '#1a1040', '#0f0f1a'] : ['#FAFBFF', '#EEF2FF', '#F5F3FF']}
        style={s.container}
      >
        <FlowerLogo isDark={darkMode} />
      </LinearGradient>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
