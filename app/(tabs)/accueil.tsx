import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Legacy route — Accueil was folded into Aujourd'hui. Any deep link or
 * legacy navigateTo('accueil') call lands here and bounces forward.
 */
export default function AccueilRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(tabs)/aujourdhui');
  }, [router]);
  return <View />;
}
