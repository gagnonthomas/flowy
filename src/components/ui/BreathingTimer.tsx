import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withRepeat, withSequence, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';
import { useFlowiStore } from '@/store';

interface BreathPhase {
  label: string;
  sec: number;
}

interface BreathExercise {
  id: number;
  name: string;
  desc: string;
  color: string;
  light: string;
  phases: BreathPhase[];
}

const EXERCISES: BreathExercise[] = [
  { id: 0, name: 'Cohérence cardiaque', desc: 'Stress · équilibre', color: '#3B82F6', light: '#EFF6FF', phases: [{ label: 'Inspirer', sec: 5 }, { label: 'Expirer', sec: 5 }] },
  { id: 1, name: 'Respiration carrée', desc: 'Anxiété · focus', color: '#8B5CF6', light: '#F5F3FF', phases: [{ label: 'Inspirer', sec: 4 }, { label: 'Retenir', sec: 4 }, { label: 'Expirer', sec: 4 }, { label: 'Pause', sec: 4 }] },
  { id: 2, name: '4-7-8', desc: 'Endormissement', color: '#0D9488', light: '#F0FDFA', phases: [{ label: 'Inspirer', sec: 4 }, { label: 'Retenir', sec: 7 }, { label: 'Expirer', sec: 8 }] },
  { id: 3, name: 'Abdominale', desc: 'Détente · ancrage', color: '#16A34A', light: '#F0FDF4', phases: [{ label: 'Inspirer', sec: 4 }, { label: 'Expirer', sec: 6 }, { label: 'Pause', sec: 2 }] },
  { id: 4, name: 'Wim Hof (doux)', desc: 'Énergie · clarté', color: '#EA580C', light: '#FFF7ED', phases: [{ label: 'Inspirer', sec: 2 }, { label: 'Expirer', sec: 2 }] },
];

const DURATIONS = [1, 2, 3, 5, 10];
const pad = (n: number) => String(n).padStart(2, '0');

export function BreathingTimer() {
  const earnXp = useFlowiStore((s) => s.earnXp);
  const [selIdx, setSelIdx] = useState(0);
  const [duration, setDuration] = useState(3);
  const [running, setRunning] = useState(false);
  const [phaseCount, setPhaseCount] = useState(0);
  const [phaseSec, setPhaseSec] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const breathRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const secsRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stoppedRef = useRef(false);

  const scale = useSharedValue(0.8);
  const ex = EXERCISES[selIdx];
  const phaseIdx = running ? phaseCount % ex.phases.length : 0;
  const currentPhase = ex.phases[phaseIdx];
  const isInhale = currentPhase?.label === 'Inspirer';
  const isHold = currentPhase?.label === 'Retenir' || currentPhase?.label === 'Pause';

  // Animate bubble based on phase
  useEffect(() => {
    if (!running) {
      scale.value = withTiming(0.8, { duration: 500 });
      return;
    }
    if (isInhale) {
      scale.value = withTiming(1.2, { duration: currentPhase.sec * 1000, easing: Easing.inOut(Easing.ease) });
    } else if (isHold) {
      // Hold at current scale
    } else {
      // Exhale
      scale.value = withTiming(0.7, { duration: currentPhase.sec * 1000, easing: Easing.inOut(Easing.ease) });
    }
  }, [running, phaseCount]);

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const stop = () => {
    stoppedRef.current = true;
    if (breathRef.current) clearTimeout(breathRef.current);
    if (secsRef.current) clearInterval(secsRef.current);
    if (elapsedRef.current) clearInterval(elapsedRef.current);
    setRunning(false);
    setPhaseCount(0);
    setPhaseSec(0);
    setElapsed(0);
  };

  const start = () => {
    if (running) { stop(); return; }
    const totalSecs = duration * 60;
    stoppedRef.current = false;
    setRunning(true);
    setElapsed(0);
    setPhaseCount(0);
    setPhaseSec(ex.phases[0].sec);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let e = 0;
    elapsedRef.current = setInterval(() => {
      e++;
      setElapsed(e);
      if (e >= totalSecs) {
        stoppedRef.current = true;
        if (elapsedRef.current) clearInterval(elapsedRef.current);
        if (secsRef.current) clearInterval(secsRef.current);
        if (breathRef.current) clearTimeout(breathRef.current);
        setRunning(false);
        setPhaseCount(0);
        setPhaseSec(0);
        setElapsed(0);
        earnXp(5, `Respiration ${duration}min`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 1000);

    secsRef.current = setInterval(() => {
      setPhaseSec((p) => (p > 1 ? p - 1 : p));
    }, 1000);

    const scheduleNext = (idx: number) => {
      const dur = ex.phases[idx].sec * 1000;
      breathRef.current = setTimeout(() => {
        if (stoppedRef.current) return;
        const next = (idx + 1) % ex.phases.length;
        setPhaseCount((p) => p + 1);
        setPhaseSec(ex.phases[next].sec);
        if (secsRef.current) clearInterval(secsRef.current);
        secsRef.current = setInterval(() => {
          setPhaseSec((p) => (p > 1 ? p - 1 : p));
        }, 1000);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        scheduleNext(next);
      }, dur);
    };
    scheduleNext(0);
  };

  useEffect(() => {
    return () => { stop(); };
  }, []);

  const elapsedMin = Math.floor(elapsed / 60);
  const elapsedSec = elapsed % 60;

  return (
    <View style={styles.container}>
      {/* Exercise selector */}
      {!running && (
        <>
          <View style={styles.exerciseGrid}>
            {EXERCISES.map((e) => {
              const sel = selIdx === e.id;
              return (
                <TouchableOpacity
                  key={e.id}
                  style={[styles.exerciseCard, sel && { borderColor: e.color, backgroundColor: e.light }]}
                  onPress={() => setSelIdx(e.id)}
                >
                  <View style={[styles.exerciseDot, { backgroundColor: e.color }]} />
                  <Text style={[styles.exerciseName, sel && { color: e.color }]}>{e.name}</Text>
                  <Text style={styles.exercisePhases}>
                    {e.phases.map((p) => p.sec).join('-')}s
                  </Text>
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
                  style={[styles.durationBtn, sel && { borderColor: ex.color, backgroundColor: ex.light }]}
                  onPress={() => setDuration(d)}
                >
                  <Text style={[styles.durationText, sel && { color: ex.color, fontFamily: 'Inter_700Bold' }]}>
                    {d}min
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {/* Progress bar */}
      {running && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBg, { backgroundColor: ex.light }]}>
            <View style={[styles.progressFill, { width: `${(elapsed / (duration * 60)) * 100}%`, backgroundColor: ex.color }]} />
          </View>
          <Text style={styles.progressText}>{elapsedMin}m{pad(elapsedSec)}s · {duration} min</Text>
        </View>
      )}

      {/* Animated bubble */}
      <View style={styles.bubbleContainer}>
        <Animated.View style={[styles.bubble, { backgroundColor: ex.color }, bubbleStyle]}>
          <Text style={styles.bubbleLabel}>
            {running ? currentPhase.label : 'Prêt ?'}
          </Text>
          {running && (
            <Text style={styles.bubbleCount}>{phaseSec}</Text>
          )}
        </Animated.View>
      </View>

      {/* Phase indicators */}
      {running && (
        <View style={styles.phaseRow}>
          {ex.phases.map((p, i) => (
            <View
              key={i}
              style={[
                styles.phaseChip,
                { borderColor: ex.color },
                phaseIdx === i && { backgroundColor: ex.color },
              ]}
            >
              <Text style={[styles.phaseChipText, { color: phaseIdx === i ? '#fff' : ex.color }]}>
                {p.label} {p.sec}s
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Info */}
      {!running && (
        <Text style={styles.infoText}>
          {ex.name} · {ex.phases.map((p) => p.sec).join('-')}s · {duration} min
        </Text>
      )}

      {/* Start/Stop button */}
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: running ? '#EF4444' : ex.color }]}
        onPress={start}
      >
        <Text style={styles.actionBtnText}>{running ? 'Arrêter' : 'Commencer'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 16 },
  exerciseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, justifyContent: 'center' },
  exerciseCard: {
    width: '30%',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  exerciseDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  exerciseName: { fontSize: 10, fontFamily: 'Inter_700Bold', color: colors.text, textAlign: 'center', lineHeight: 14 },
  exercisePhases: { fontSize: 9, fontFamily: 'Inter_400Regular', color: colors.muted, marginTop: 2 },
  durationLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, alignSelf: 'flex-start' },
  durationRow: { flexDirection: 'row', gap: 6, marginBottom: 20, width: '100%' },
  durationBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center' },
  durationText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.muted },
  progressContainer: { marginBottom: 16, width: '80%' },
  progressBg: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.muted, textAlign: 'center', marginTop: 4 },
  bubbleContainer: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  bubble: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  bubbleLabel: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff', textAlign: 'center' },
  bubbleCount: { fontSize: 28, fontFamily: 'Inter_900Black', color: '#fff', marginTop: 2 },
  phaseRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 },
  phaseChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1 },
  phaseChipText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  infoText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.muted, marginBottom: 12 },
  actionBtn: { paddingVertical: 12, paddingHorizontal: 36, borderRadius: 24 },
  actionBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
