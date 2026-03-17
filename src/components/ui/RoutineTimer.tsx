import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useFlowiStore } from '@/store';
import { getToday } from '@/utils/date';
import type { Routine } from '@/types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const R = 52;
const CIRC = 2 * Math.PI * R;

const pad = (n: number) => String(n).padStart(2, '0');

interface Props {
  routine: Routine;
  onStop: () => void;
}

export function RoutineTimer({ routine, onStop }: Props) {
  const earnXp = useFlowiStore((s) => s.earnXp);
  const logRoutine = useFlowiStore((s) => s.logRoutine);

  const [blockIdx, setBlockIdx] = useState(0);
  const [secs, setSecs] = useState(routine.blocks[0].dur * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const block = routine.blocks[blockIdx];
  const nextBlock = routine.blocks[blockIdx + 1] || null;
  const totalSecs = block ? block.dur * 60 : 0;
  const pct = totalSecs > 0 ? (totalSecs - secs) / totalSecs : 0;

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(pct, { duration: 500 });
  }, [pct]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRC * (1 - progress.value),
  }));

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setSecs((s) => {
          if (s <= 1) {
            clearInterval(timerRef.current!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Next block or done
            const nextIdx = blockIdx + 1;
            if (nextIdx < routine.blocks.length) {
              setBlockIdx(nextIdx);
              setSecs(routine.blocks[nextIdx].dur * 60);
            } else {
              setRunning(false);
              setDone(true);
              const totalMin = routine.blocks.reduce((sum, b) => sum + b.dur, 0);
              earnXp(totalMin, `Routine: ${routine.name}`);
              logRoutine(routine.id, getToday());
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, blockIdx]);

  const toggle = () => {
    if (done) { onStop(); return; }
    setRunning((r) => !r);
    Haptics.impactAsync(running ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
  };

  const stop = () => {
    setRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    onStop();
  };

  const remMin = Math.floor(secs / 60);
  const remSec = secs % 60;
  const rColor = routine.color || '#F97316';

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: rColor + '15', borderColor: rColor + '44' }]}>
        <Text style={s.headerLabel}>{routine.emoji} {routine.name}</Text>
        <Text style={s.headerMeta}>Bloc {blockIdx + 1} / {routine.blocks.length}</Text>
      </View>

      {/* Timer circle */}
      {!done ? (
        <View style={s.timerWrap}>
          <Svg width={120} height={120} viewBox="0 0 120 120">
            <Circle cx={60} cy={60} r={R} fill="none" stroke="#F0ECE8" strokeWidth={10} />
            <AnimatedCircle
              cx={60} cy={60} r={R}
              fill="none"
              stroke={block?.color || rColor}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              animatedProps={animatedProps}
              transform="rotate(-90, 60, 60)"
            />
          </Svg>
          <View style={s.timerCenter}>
            <Text style={{ fontSize: 28 }}>{block?.emoji || '⏱'}</Text>
            <Text style={s.timerText}>{pad(remMin)}:{pad(remSec)}</Text>
          </View>
        </View>
      ) : (
        <View style={s.doneSection}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>🎉</Text>
          <Text style={s.doneTitle}>Routine terminée !</Text>
          <Text style={s.doneSub}>+{routine.blocks.reduce((sum, b) => sum + b.dur, 0)} XP gagnés</Text>
        </View>
      )}

      {/* Current block label */}
      {!done && block && (
        <Text style={s.blockName}>{block.emoji} {block.label} · {block.dur} min</Text>
      )}

      {/* Next block preview */}
      {!done && nextBlock && (
        <View style={[s.nextBlock, { borderColor: nextBlock.color + '66' }]}>
          <View style={[s.nextBlockIcon, { backgroundColor: nextBlock.color }]}>
            <Text style={{ fontSize: 18 }}>{nextBlock.emoji}</Text>
          </View>
          <View>
            <Text style={s.nextBlockLabel}>Prochain</Text>
            <Text style={s.nextBlockName}>{nextBlock.label}</Text>
            <Text style={s.nextBlockDur}>{nextBlock.dur} min</Text>
          </View>
        </View>
      )}

      {/* Controls */}
      <View style={s.controls}>
        {!done ? (
          <>
            <Pressable onPress={toggle} style={[s.mainBtn, { backgroundColor: running ? '#EF4444' : rColor }]}>
              <Text style={s.mainBtnText}>{running ? '⏸ Pause' : '▶ Démarrer'}</Text>
            </Pressable>
            <Pressable onPress={stop} style={s.stopBtn}>
              <Text style={s.stopBtnText}>⏹ Arrêter</Text>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={() => onStop()} style={[s.mainBtn, { backgroundColor: '#10B981' }]}>
            <Text style={s.mainBtnText}>✅ Fermer</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', gap: 12 },
  header: {
    width: '100%', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 14, borderWidth: 2,
  },
  headerLabel: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#2D3A5A', marginBottom: 2 },
  headerMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#8090B0' },

  timerWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  timerCenter: { position: 'absolute', alignItems: 'center' },
  timerText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#2D3A5A' },

  doneSection: { alignItems: 'center', paddingVertical: 16 },
  doneTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18, color: '#10B981' },
  doneSub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#8090B0', marginTop: 4 },

  blockName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#2D3A5A', textAlign: 'center' },

  nextBlock: {
    width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12,
    backgroundColor: '#FFFFF8', borderWidth: 1.5,
  },
  nextBlockIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  nextBlockLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#B0A090', textTransform: 'uppercase', letterSpacing: 0.6 },
  nextBlockName: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#2D3A5A' },
  nextBlockDur: { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#8090B0' },

  controls: { flexDirection: 'row', gap: 8, width: '100%' },
  mainBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  mainBtnText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#FFFFFF' },
  stopBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#E8EDF5' },
  stopBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#EF4444' },
});
