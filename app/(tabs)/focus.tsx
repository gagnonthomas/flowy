import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useFlowiStore } from '@/store';
import { colors } from '@/constants/colors';
import { formatTime } from '@/utils/date';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RADIUS = 110;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const PRESETS = [
  { label: '5 min', secs: 300 },
  { label: '15 min', secs: 900 },
  { label: '25 min', secs: 1500 },
  { label: '45 min', secs: 2700 },
  { label: '60 min', secs: 3600 },
];

export default function FocusScreen() {
  const { todos, earnXp } = useFlowiStore();
  const [total, setTotal] = useState(1500);
  const [remaining, setRemaining] = useState(1500);
  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1 - remaining / total, { duration: 500 });
  }, [remaining, total]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  useEffect(() => {
    if (active) {
      timerRef.current = setInterval(() => {
        setRemaining((s) => {
          if (s <= 1) {
            clearInterval(timerRef.current!);
            setActive(false);
            setDone(true);
            earnXp(10, `Focus ${Math.round(total / 60)} min`);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [active]);

  const start = () => {
    setDone(false);
    setActive(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const pause = () => {
    setActive(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const reset = () => {
    setActive(false);
    setDone(false);
    setRemaining(total);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const selectPreset = (secs: number) => {
    if (active) return;
    setTotal(secs);
    setRemaining(secs);
    setDone(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Focus</Text>

      <Animated.View entering={FadeIn.duration(500)} style={styles.timerContainer}>
        <Svg width={260} height={260} viewBox="0 0 260 260">
          <Circle
            cx={130} cy={130} r={RADIUS}
            stroke={colors.border}
            strokeWidth={10}
            fill="none"
          />
          <AnimatedCircle
            cx={130} cy={130} r={RADIUS}
            stroke={colors.focus.accent}
            strokeWidth={10}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={animatedProps}
            strokeLinecap="round"
            transform={`rotate(-90, 130, 130)`}
          />
        </Svg>
        <View style={styles.timerOverlay}>
          <Text style={styles.timerText}>{formatTime(remaining)}</Text>
          {done && <Text style={styles.doneText}>Terminé !</Text>}
        </View>
      </Animated.View>

      <View style={styles.presets}>
        {PRESETS.map((p) => (
          <TouchableOpacity
            key={p.secs}
            style={[styles.preset, total === p.secs && styles.presetActive]}
            onPress={() => selectPreset(p.secs)}
          >
            <Text style={[styles.presetText, total === p.secs && styles.presetTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.controls}>
        {!active ? (
          <TouchableOpacity style={styles.mainBtn} onPress={start}>
            <Text style={styles.mainBtnText}>{remaining < total && !done ? 'Reprendre' : 'Démarrer'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.mainBtn, styles.pauseBtn]} onPress={pause}>
            <Text style={styles.mainBtnText}>Pause</Text>
          </TouchableOpacity>
        )}
        {(remaining < total || done) && !active && (
          <TouchableOpacity style={styles.resetBtn} onPress={reset}>
            <Text style={styles.resetBtnText}>Réinitialiser</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: 'center' },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: colors.text,
    marginTop: 12,
    marginBottom: 20,
  },
  timerContainer: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerOverlay: {
    position: 'absolute',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 48,
    fontFamily: 'Inter_700Bold',
    color: colors.text,
  },
  doneText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.moi.accent,
    marginTop: 4,
  },
  presets: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 30,
    marginBottom: 30,
  },
  preset: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetActive: {
    backgroundColor: colors.focus.light,
    borderColor: colors.focus.accent,
  },
  presetText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.muted,
  },
  presetTextActive: {
    fontFamily: 'Inter_600SemiBold',
    color: colors.focus.accent,
  },
  controls: {
    alignItems: 'center',
    gap: 12,
  },
  mainBtn: {
    backgroundColor: colors.focus.accent,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    minWidth: 200,
    alignItems: 'center',
  },
  pauseBtn: {
    backgroundColor: colors.muted,
  },
  mainBtnText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  resetBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  resetBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.muted,
  },
});
