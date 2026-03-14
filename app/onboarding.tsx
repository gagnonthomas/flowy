import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFlowiStore } from '@/store';
import { colors } from '@/constants/colors';
import { FlowerLogo } from '@/components/FlowerLogo';

const STEPS = [
  { key: 'welcome' },
  { key: 'name', question: 'Comment tu t\'appelles ?' },
  { key: 'tdah', question: 'Est-ce que tu as un TDAH ou tu te reconnais dans les cerveaux actifs ?' },
  { key: 'objectif', question: 'Quel est ton objectif principal avec Flowi ?' },
  { key: 'ready' },
];

const TDAH_OPTIONS = ['Oui, diagnostiqué', 'Je pense que oui', 'Non, mais cerveau actif', 'Pas sûr'];
const OBJECTIF_OPTIONS = [
  'Mieux organiser mes journées',
  'Garder le focus sur mes tâches',
  'Créer des routines saines',
  'Suivre mon bien-être',
  'Tout ça !',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const setOnboarded = useFlowiStore((s) => s.setOnboarded);
  const setUserName = useFlowiStore((s) => s.setUserName);
  const setUserTdah = useFlowiStore((s) => s.setUserTdah);
  const setUserObjectif = useFlowiStore((s) => s.setUserObjectif);
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [tdah, setTdah] = useState('');
  const [objectif, setObjectif] = useState('');

  const next = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setUserName(name);
      setUserTdah(tdah);
      setUserObjectif(objectif);
      setOnboarded(true);
      router.replace('/(tabs)/accueil');
    }
  };

  const canNext = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return tdah.length > 0;
    if (step === 3) return objectif.length > 0;
    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && (
            <Animated.View entering={FadeIn.duration(600)} style={styles.center}>
              <FlowerLogo isDark={false} />
              <Text style={styles.subtitle}>Trouve ton flow.</Text>
            </Animated.View>
          )}

          {step === 1 && (
            <Animated.View entering={SlideInRight.duration(300)} style={styles.stepContainer}>
              <Text style={styles.question}>{STEPS[1].question}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ton prénom..."
                placeholderTextColor={colors.muted}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => canNext() && next()}
              />
            </Animated.View>
          )}

          {step === 2 && (
            <Animated.View entering={SlideInRight.duration(300)} style={styles.stepContainer}>
              <Text style={styles.question}>{STEPS[2].question}</Text>
              {TDAH_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.option, tdah === opt && styles.optionActive]}
                  onPress={() => { setTdah(opt); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Text style={[styles.optionText, tdah === opt && styles.optionTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          {step === 3 && (
            <Animated.View entering={SlideInRight.duration(300)} style={styles.stepContainer}>
              <Text style={styles.question}>{STEPS[3].question}</Text>
              {OBJECTIF_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.option, objectif === opt && styles.optionActive]}
                  onPress={() => { setObjectif(opt); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Text style={[styles.optionText, objectif === opt && styles.optionTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          {step === 4 && (
            <Animated.View entering={FadeIn.duration(600)} style={styles.center}>
              <Text style={styles.readyEmoji}>🌿</Text>
              <Text style={styles.readyTitle}>Bienvenue, {name} !</Text>
              <Text style={styles.readySubtitle}>
                Ton espace Flowi est prêt. On commence ?
              </Text>
            </Animated.View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextBtn, !canNext() && styles.nextBtnDisabled]}
            onPress={next}
            disabled={!canNext()}
          >
            <Text style={styles.nextBtnText}>
              {step === 0 ? 'Commencer' : step === 4 ? 'C\'est parti !' : 'Suivant'}
            </Text>
          </TouchableOpacity>
          {step > 0 && step < 4 && (
            <View style={styles.dots}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[styles.dot, step >= i && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  center: { alignItems: 'center' },
  subtitle: {
    fontSize: 14,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.muted,
    marginTop: 12,
  },
  stepContainer: { gap: 16 },
  question: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
    backgroundColor: colors.surface,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.surface,
  },
  optionActive: {
    borderColor: colors.flowi.accent,
    backgroundColor: colors.flowi.light,
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
  },
  optionTextActive: {
    fontFamily: 'Inter_600SemiBold',
    color: colors.flowi.accent,
  },
  readyEmoji: { fontSize: 64, marginBottom: 16 },
  readyTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: colors.text,
    textAlign: 'center',
  },
  readySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
  },
  footer: { padding: 24, alignItems: 'center', gap: 16 },
  nextBtn: {
    backgroundColor: colors.flowi.accent,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  dots: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.flowi.accent },
});
