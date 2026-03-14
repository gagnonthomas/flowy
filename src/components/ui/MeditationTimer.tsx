import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedProps, withTiming,
} from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';
import { useFlowiStore } from '@/store';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RADIUS = 100;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const MEDIT_TYPES = [
  { id: 'pleine-conscience', label: 'Pleine conscience', emoji: '🌿', desc: 'Observer sans juger' },
  { id: 'body-scan', label: 'Body scan', emoji: '🫁', desc: 'Parcourir le corps' },
  { id: 'visualisation', label: 'Visualisation', emoji: '🌅', desc: 'Créer un espace intérieur' },
  { id: 'gratitude', label: 'Gratitude', emoji: '🌸', desc: 'Cultiver la reconnaissance' },
] as const;

const DURATIONS = [3, 5, 10, 15, 20];

const PROMPTS: Record<string, string[]> = {
  'pleine-conscience': [
    'Porte ton attention sur ta respiration...',
    'Observe les sensations dans ton corps...',
    'Laisse passer les pensées comme des nuages...',
    'Reviens doucement à ta respiration...',
    'Accueille ce qui est, sans juger...',
  ],
  'body-scan': [
    'Commence par le sommet de ta tête...',
    'Descends vers tes épaules, relâche-les...',
    'Observe les sensations dans tes bras...',
    'Porte ton attention sur ton ventre...',
    'Détends tes jambes et tes pieds...',
  ],
  'visualisation': [
    'Imagine un lieu où tu te sens en paix...',
    'Observe les couleurs autour de toi...',
    'Ressens la chaleur du soleil sur ta peau...',
    'Écoute les sons de cet endroit...',
    'Laisse cette paix t\'envahir...',
  ],
  'gratitude': [
    'Pense à quelqu\'un qui te fait du bien...',
    'Remercie pour ce moment de calme...',
    'Ressens la gratitude dans ton cœur...',
    'Pense à un petit bonheur récent...',
    'Envoie de la bienveillance autour de toi...',
  ],
};

const pad = (n: number) => String(n).padStart(2, '0');

export function MeditationTimer() {
  const earnXp = useFlowiStore((s) => s.earnXp);
  const [typeIdx, setTypeIdx] = useState(0);
  const [duration, setDuration] = useState(5);
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [promptIdx, setPromptIdx] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const promptRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = useSharedValue(0);
  const type = MEDIT_TYPES[typeIdx];
  const totalSecs = duration * 60;
  const remaining = Math.max(0, totalSecs - elapsed);
  const remMin = Math.floor(remaining / 60);
  const remSec = remaining % 60;
  const prompts = PROMPTS[type.id] || PROMPTS['pleine-conscience'];

  useEffect(() => {
    progress.value = withTiming(
      phase === 'running' ? elapsed / totalSecs : phase === 'done' ? 1 : 0,
      { duration: 500 }
    );
  }, [elapsed, phase]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const start = () => {
    if (phase === 'running') {
      // Stop
      if (timerRef.current) clearInterval(timerRef.current);
      if (promptRef.current) clearInterval(promptRef.current);
      setPhase('idle');
      setElapsed(0);
      setPromptIdx(0);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase('running');
    setElapsed(0);
    setPromptIdx(0);

    promptRef.current = setInterval(() => {
      setPromptIdx((p) => p + 1);
    }, 20000);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= totalSecs) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (promptRef.current) clearInterval(promptRef.current);
          earnXp(10, `Méditation ${duration}min`);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setPhase('done');
          return totalSecs;
        }
        return next;
      });
    }, 1000);
  };

  const reset = () => {
    setPhase('idle');
    setElapsed(0);
    setPromptIdx(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (promptRef.current) clearInterval(promptRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Type selector */}
      {phase === 'idle' && (
        <>
          <View style={styles.typeGrid}>
            {MEDIT_TYPES.map((t, i) => {
              const sel = typeIdx === i;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.typeCard, sel && styles.typeCardActive]}
                  onPress={() => setTypeIdx(i)}
                >
                  <Text style={styles.typeEmoji}>{t.emoji}</Text>
                  <Text style={[styles.typeLabel, sel && styles.typeLabelActive]}>{t.label}</Text>
                  <Text style={styles.typeDesc}>{t.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.durationLabel}>Durée</Text>
          <View style={styles.durationRow}>
            {DURATIONS.map((d) => {
              const sel = duration === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.durationBtn, sel && styles.durationBtnActive]}
                  onPress={() => setDuration(d)}
                >
                  <Text style={[styles.durationText, sel && styles.durationTextActive]}>
                    {d}min
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {/* Timer circle */}
      <View style={styles.timerContainer}>
        <Svg width={230} height={230} viewBox="0 0 230 230">
          <Circle
            cx={115} cy={115} r={RADIUS}
            stroke={colors.border}
            strokeWidth={8}
            fill="none"
          />
          <AnimatedCircle
            cx={115} cy={115} r={RADIUS}
            stroke={colors.moi.accent}
            strokeWidth={8}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={animatedProps}
            strokeLinecap="round"
            transform="rotate(-90, 115, 115)"
          />
        </Svg>
        <View style={styles.timerOverlay}>
          {phase === 'idle' && (
            <>
              <Text style={styles.timerEmoji}>{type.emoji}</Text>
              <Text style={styles.timerLabel}>{type.label}</Text>
            </>
          )}
          {phase === 'running' && (
            <>
              <Text style={styles.timerTime}>{pad(remMin)}:{pad(remSec)}</Text>
              <Text style={styles.timerPrompt}>
                {prompts[promptIdx % prompts.length]}
              </Text>
            </>
          )}
          {phase === 'done' && (
            <>
              <Text style={styles.timerEmoji}>🌿</Text>
              <Text style={styles.doneText}>Terminé</Text>
              <Text style={styles.doneSubtext}>+10 XP</Text>
            </>
          )}
        </View>
      </View>

      {/* Action button */}
      <TouchableOpacity
        style={[styles.actionBtn, phase === 'running' && styles.stopBtn]}
        onPress={phase === 'done' ? reset : start}
      >
        <Text style={styles.actionBtnText}>
          {phase === 'idle' ? 'Commencer' : phase === 'running' ? 'Arrêter' : 'Nouvelle séance'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 16 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, justifyContent: 'center' },
  typeCard: {
    width: '47%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  typeCardActive: { borderColor: colors.moi.accent, backgroundColor: colors.moi.light },
  typeEmoji: { fontSize: 24, marginBottom: 4 },
  typeLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.text },
  typeLabelActive: { color: colors.moi.accent },
  typeDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.muted, marginTop: 2 },
  durationLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, alignSelf: 'flex-start' },
  durationRow: { flexDirection: 'row', gap: 6, marginBottom: 16, width: '100%' },
  durationBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center' },
  durationBtnActive: { borderColor: colors.moi.accent, backgroundColor: colors.moi.light },
  durationText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.muted },
  durationTextActive: { color: colors.moi.accent, fontFamily: 'Inter_700Bold' },
  timerContainer: { width: 230, height: 230, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  timerOverlay: { position: 'absolute', alignItems: 'center', paddingHorizontal: 20 },
  timerEmoji: { fontSize: 36, marginBottom: 8 },
  timerLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.text },
  timerTime: { fontSize: 40, fontFamily: 'Inter_700Bold', color: colors.text },
  timerPrompt: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  doneText: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.moi.accent },
  doneSubtext: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.muted, marginTop: 4 },
  actionBtn: { backgroundColor: colors.moi.accent, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 24 },
  stopBtn: { backgroundColor: '#EF4444' },
  actionBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
