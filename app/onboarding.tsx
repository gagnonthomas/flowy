import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFlowiStore } from '@/store';
import { colors } from '@/constants/colors';
import { FlowerLogo } from '@/components/FlowerLogo';
import { trackAction } from '@/utils/analytics';
import { requestPermissions } from '@/utils/notifications';

// Écran 0 — Logo
// Écran 1 — Prénom
// Écran 2 — Défis (multi-select, grille)
// Écran 3 — Objectif (single select)
// Écran 4 — Bienvenue personnalisé
// Écran 5 — Permissions notifications
// Écran 6-8 — Tutoriel interactif des features

const TUTORIAL_STEPS = [
  {
    emoji: '📷',
    title: 'Garde ton papier, on garde le fil',
    desc: 'Prends en photo tes listes ou pages d\'agenda papier. Flowi reconnaît tout, classe les RDV dans ton agenda et les tâches dans ta liste. Plus de papiers perdus.',
    features: ['Scan auto-classifié', 'RDV → Agenda', 'Tâches → Liste', 'Tout au même endroit'],
    color: '#3B82F6',
  },
  {
    emoji: '🌿',
    title: 'Flowi démêle avec toi',
    desc: 'Ton coach bienveillant regarde ce que tu viens de scanner et t\'aide à prioriser. Pas de jugement, pas de pression — juste un coup de main pour voir clair.',
    features: ['Coach après chaque scan', 'Plan du jour', 'Décomposer une tâche', 'Chat libre'],
    color: '#16A34A',
  },
  {
    emoji: '💚',
    title: 'Et un espace pour toi',
    desc: 'Check-in d\'énergie, habitudes, méditation, défis. Chaque petit pas compte. Tu peux tout ignorer si t\'as juste besoin de scanner.',
    features: ['Check-in énergie', 'Habitudes & routines', 'Méditation guidée', 'Système XP & badges'],
    color: '#10B981',
  },
];

const DEFIS = [
  { key: 'procrastination', label: 'Procrastination', emoji: '⏳' },
  { key: 'focus', label: 'Difficultés de focus', emoji: '🎯' },
  { key: 'organisation', label: 'Organisation', emoji: '📋' },
  { key: 'memoire', label: 'Mémoire & oublis', emoji: '🧠' },
  { key: 'motivation', label: 'Manque de motivation', emoji: '🔋' },
  { key: 'temps', label: 'Gestion du temps', emoji: '⏱' },
  { key: 'priorites', label: 'Prioriser les tâches', emoji: '🚀' },
  { key: 'stress', label: 'Stress & anxiété', emoji: '😤' },
];

const OBJECTIFS = [
  { key: 'planifier', label: 'Mieux planifier mon quotidien', emoji: '📅' },
  { key: 'habitudes', label: 'Construire de bonnes habitudes', emoji: '✅' },
  { key: 'focus', label: 'Améliorer mon focus', emoji: '⏱' },
  { key: 'memoire', label: 'Mieux gérer ma mémoire', emoji: '🧠' },
  { key: 'stress', label: 'Réduire mon stress', emoji: '🌿' },
];

function getWelcomeMessage(defis: string[], objectif: string): string {
  const hasStress = defis.includes('stress') || objectif === 'stress';
  const hasFocus = defis.includes('focus') || objectif === 'focus';
  const hasMotivation = defis.includes('motivation');
  const hasProcrastination = defis.includes('procrastination');

  if (hasStress) return 'On va y aller un pas à la fois. Pas de pression.';
  if (hasFocus) return 'Chaque session compte. Même les petites.';
  if (hasMotivation || hasProcrastination) return 'Un seul petit pas suffit pour commencer.';
  return 'Tu as tout ce qu\'il faut. Flowi est là pour t\'aider.';
}

export default function OnboardingScreen() {
  const router = useRouter();
  const setOnboarded = useFlowiStore((s) => s.setOnboarded);
  const setUserName = useFlowiStore((s) => s.setUserName);
  const setUserDefis = useFlowiStore((s) => s.setUserDefis);
  const setUserObjectif = useFlowiStore((s) => s.setUserObjectif);
  const seedStarterContent = useFlowiStore((s) => s.seedStarterContent);

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [defis, setDefis] = useState<string[]>([]);
  const [objectif, setObjectif] = useState('');

  const toggleDefi = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDefis((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  const totalSteps = 5 + TUTORIAL_STEPS.length; // 0-4 onboarding + 5 notifs + 6-8 tutorial
  const [notifGranted, setNotifGranted] = useState(false);

  const canNext = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return defis.length > 0;
    if (step === 3) return objectif.length > 0;
    return true;
  };

  const next = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      setUserName(name);
      setUserDefis(defis);
      setUserObjectif(objectif);
      seedStarterContent();
      setOnboarded(true);
      trackAction('onboarding_complete');
      router.replace('/(tabs)/accueil');
    }
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
          {/* Écran 0 — Logo */}
          {step === 0 && (
            <Animated.View entering={FadeIn.duration(800)} style={styles.center}>
              <FlowerLogo isDark={false} />
              <Text style={styles.tagline}>Trouve ton flow.</Text>
            </Animated.View>
          )}

          {/* Écran 1 — Prénom */}
          {step === 1 && (
            <Animated.View entering={SlideInRight.duration(350)} style={styles.stepContainer}>
              <Text style={styles.question}>Quel est ton prénom ?</Text>
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

          {/* Écran 2 — Défis */}
          {step === 2 && (
            <Animated.View entering={SlideInRight.duration(350)} style={styles.stepContainer}>
              <Text style={styles.question}>Tes principaux défis</Text>
              <Text style={styles.hint}>Sélectionne tout ce qui te parle.</Text>
              <View style={styles.grid}>
                {DEFIS.map((d) => {
                  const active = defis.includes(d.key);
                  return (
                    <TouchableOpacity
                      key={d.key}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => toggleDefi(d.key)}
                    >
                      <Text style={styles.chipEmoji}>{d.emoji}</Text>
                      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* Écran 3 — Objectif */}
          {step === 3 && (
            <Animated.View entering={SlideInRight.duration(350)} style={styles.stepContainer}>
              <Text style={styles.question}>Objectif principal</Text>
              <Text style={styles.hint}>Choisis ce qui compte le plus pour toi.</Text>
              <View style={styles.objectifList}>
                {OBJECTIFS.map((o) => {
                  const active = objectif === o.key;
                  return (
                    <TouchableOpacity
                      key={o.key}
                      style={[styles.objectifOption, active && styles.objectifOptionActive]}
                      onPress={() => {
                        setObjectif(o.key);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={styles.objectifEmoji}>{o.emoji}</Text>
                      <Text style={[styles.objectifLabel, active && styles.objectifLabelActive]}>
                        {o.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* Écran 4 — Bienvenue */}
          {step === 4 && (
            <Animated.View entering={FadeIn.duration(800)} style={styles.center}>
              <Animated.Text
                entering={FadeInDown.duration(600).delay(100)}
                style={styles.welcomeEmoji}
              >
                🌿
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.duration(600).delay(300)}
                style={styles.welcomeTitle}
              >
                Bienvenue dans ton espace.
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.duration(600).delay(550)}
                style={styles.welcomeMessage}
              >
                {getWelcomeMessage(defis, objectif)}
              </Animated.Text>
            </Animated.View>
          )}

          {/* Écran 5 — Permissions notifications */}
          {step === 5 && (
            <Animated.View entering={SlideInRight.duration(350)} style={styles.stepContainer}>
              <View style={styles.center}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>🔔</Text>
                <Text style={styles.question}>Reste dans le flow</Text>
                <Text style={[styles.hint, { textAlign: 'center', lineHeight: 22, marginBottom: 20 }]}>
                  Flowi peut t'envoyer des rappels doux pour :{'\n\n'}
                  ☀️ Check-in énergie matin, midi et soir{'\n'}
                  📅 Rappels 15 min avant tes rendez-vous{'\n'}
                  🌙 Rappel routine du soir pour ton streak{'\n\n'}
                  Pas de spam — juste ce qui t'aide.
                </Text>
                <Pressable
                  onPress={async () => {
                    const granted = await requestPermissions();
                    setNotifGranted(granted);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }}
                  style={[styles.notifBtn, notifGranted && styles.notifBtnDone]}
                >
                  <Text style={styles.notifBtnText}>
                    {notifGranted ? '✅ Notifications activées' : 'Activer les notifications'}
                  </Text>
                </Pressable>
                {!notifGranted && (
                  <Text style={styles.notifSkip}>Tu peux aussi les activer plus tard dans les réglages.</Text>
                )}
              </View>
            </Animated.View>
          )}

          {/* Écrans 6-8 — Tutoriel */}
          {step >= 6 && step <= 8 && (() => {
            const tut = TUTORIAL_STEPS[step - 6];
            return (
              <Animated.View entering={SlideInRight.duration(350)} style={styles.stepContainer}>
                <View style={[styles.tutorialIconWrap, { backgroundColor: tut.color + '15', borderColor: tut.color + '33' }]}>
                  <Text style={{ fontSize: 48 }}>{tut.emoji}</Text>
                </View>
                <Text style={[styles.tutorialTitle, { color: tut.color }]}>{tut.title}</Text>
                <Text style={styles.tutorialDesc}>{tut.desc}</Text>
                <View style={styles.tutorialFeatures}>
                  {tut.features.map((f, i) => (
                    <Animated.View
                      key={i}
                      entering={FadeInDown.duration(400).delay(200 + i * 100)}
                      style={[styles.tutorialFeature, { borderColor: tut.color + '33' }]}
                    >
                      <View style={[styles.tutorialFeatureDot, { backgroundColor: tut.color }]} />
                      <Text style={styles.tutorialFeatureText}>{f}</Text>
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>
            );
          })()}
        </ScrollView>

        <View style={styles.footer}>
          {step > 0 && step <= totalSteps && (
            <View style={styles.dots}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <View key={i} style={[styles.dot, step >= i + 1 && styles.dotActive]} />
              ))}
            </View>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, !canNext() && styles.nextBtnDisabled]}
            onPress={next}
            disabled={!canNext()}
          >
            <Text style={styles.nextBtnText}>
              {step === 0 ? 'Commencer' : step === 4 ? 'Découvrir les features →' : step === totalSteps ? 'C\'est parti ! 🚀' : 'Suivant'}
            </Text>
          </TouchableOpacity>
          {step >= 6 && (
            <TouchableOpacity onPress={() => { setUserName(name); setUserDefis(defis); setUserObjectif(objectif); seedStarterContent(); setOnboarded(true); trackAction('onboarding_skip_tutorial'); router.replace('/(tabs)/accueil'); }}>
              <Text style={styles.skipText}>Passer le tutoriel</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  center: { alignItems: 'center', paddingHorizontal: 8 },

  tagline: {
    fontSize: 13,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.muted,
    marginTop: 16,
  },

  stepContainer: { gap: 12 },
  question: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: colors.text,
    marginBottom: 4,
  },
  hint: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.muted,
    marginBottom: 4,
  },

  // Prénom
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

  // Grille défis
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.flowi.accent,
    backgroundColor: colors.flowi.light,
  },
  chipEmoji: { fontSize: 18 },
  chipLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
  },
  chipLabelActive: {
    fontFamily: 'Inter_600SemiBold',
    color: colors.flowi.accent,
  },

  // Objectifs
  objectifList: { gap: 10 },
  objectifOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
  },
  objectifOptionActive: {
    borderColor: colors.flowi.accent,
    backgroundColor: colors.flowi.light,
  },
  objectifEmoji: { fontSize: 20 },
  objectifLabel: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
  },
  objectifLabelActive: {
    fontFamily: 'Inter_600SemiBold',
    color: colors.flowi.accent,
  },

  // Bienvenue
  welcomeEmoji: { fontSize: 56, marginBottom: 24 },
  welcomeTitle: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeMessage: {
    fontSize: 17,
    fontFamily: 'Inter_400Regular',
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 16,
  },

  // Tutorial
  tutorialIconWrap: {
    width: 90, height: 90, borderRadius: 24, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16,
  },
  tutorialTitle: {
    fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', textAlign: 'center', marginBottom: 8,
  },
  tutorialDesc: {
    fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.muted,
    textAlign: 'center', lineHeight: 22, marginBottom: 16, paddingHorizontal: 8,
  },
  tutorialFeatures: { gap: 8 },
  tutorialFeature: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12,
    borderWidth: 1.5, backgroundColor: colors.surface,
  },
  tutorialFeatureDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  tutorialFeatureText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.text },
  skipText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.muted, marginTop: 4 },
  notifBtn: {
    paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14,
    backgroundColor: '#6366F1', alignItems: 'center', width: '100%',
  },
  notifBtnDone: { backgroundColor: '#10B981' },
  notifBtnText: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#FFFFFF' },
  notifSkip: {
    fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.muted,
    textAlign: 'center', marginTop: 12,
  },

  // Footer
  footer: { padding: 24, alignItems: 'center', gap: 14 },
  dots: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.flowi.accent },
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
});
