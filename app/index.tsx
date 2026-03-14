import { Redirect } from 'expo-router';
import { useFlowiStore } from '@/store';

export default function Index() {
  const onboarded = useFlowiStore((s) => s.onboarded);

  if (!onboarded) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/accueil" />;
}
