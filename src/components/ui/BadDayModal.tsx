import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useFlowiStore } from '@/store';
import { formatTime } from '@/utils/date';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const R = 80;
const CIRC = 2 * Math.PI * R;
const DURATIONS: [number, string][] = [[5, '5 min'], [10, '10 min'], [25, '25 min']];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function BadDayModal({ visible, onClose }: Props) {
  const todos = useFlowiStore((s) => s.todos);
  const completeTodo = useFlowiStore((s) => s.completeTodo);
  const earnXp = useFlowiStore((s) => s.earnXp);

  const [taskId, setTaskId] = useState('');
  const [totalSecs, setTotalSecs] = useState(300); // 5 min
  const [elapsed, setElapsed] = useState(0);
  const [active, setActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pendingTodos = todos.filter((t) => !t.done);
  const remaining = totalSecs - elapsed;
  const pct = elapsed / totalSecs;
  const isDone = elapsed >= totalSecs;

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(pct, { duration: 500 });
  }, [pct]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRC * (1 - progress.value),
  }));

  useEffect(() => {
    if (active) {
      timerRef.current = setInterval(() => {
        setElapsed((s) => {
          if (s + 1 >= totalSecs) {
            clearInterval(timerRef.current!);
            setActive(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return totalSecs;
          }
          return s + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [active, totalSecs]);

  const handleClose = () => {
    setActive(false);
    setElapsed(0);
    setTaskId('');
    if (timerRef.current) clearInterval(timerRef.current);
    onClose();
  };

  const handleFinish = () => {
    if (taskId) completeTodo(taskId);
    earnXp(Math.round(totalSecs / 60), 'Mode urgence');
    handleClose();
  };

  const reset = () => {
    setActive(false);
    setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const selectedTask = todos.find((t) => t.id === taskId);

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <LinearGradient colors={['#0F1729', '#1a1040']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={s.container}>
        {/* Close button */}
        <Pressable onPress={handleClose} style={s.closeBtn}>
          <Text style={s.closeBtnText}>×</Text>
        </Pressable>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Une chose à la fois. 🌿</Text>
            <Text style={s.subtitle}>Tu n'as pas besoin de tout faire.{'\n'}Juste la prochaine étape.</Text>
          </View>

          {/* Task selector (only when not active) */}
          {!active && !isDone && (
            <View style={s.taskSection}>
              <Text style={s.taskLabel}>Sur quoi tu travailles ?</Text>
              {pendingTodos.length > 0 ? (
                <View style={{ gap: 8 }}>
                  {pendingTodos.slice(0, 6).map((t) => {
                    const sel = taskId === t.id;
                    return (
                      <Pressable
                        key={t.id}
                        onPress={() => { setTaskId(t.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                        style={[s.taskBtn, sel && s.taskBtnSel]}
                      >
                        <View style={[s.taskCheck, sel && s.taskCheckSel]}>
                          {sel && <Text style={s.taskCheckMark}>✓</Text>}
                        </View>
                        <Text style={[s.taskText, sel && s.taskTextSel]} numberOfLines={1}>{t.text}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <View style={s.noTasks}>
                  <Text style={s.noTasksText}>Aucune tâche en attente 🎉</Text>
                </View>
              )}

              {/* Duration selector */}
              <View style={s.durRow}>
                {DURATIONS.map(([mins, label]) => {
                  const sel = totalSecs === mins * 60;
                  return (
                    <Pressable
                      key={mins}
                      onPress={() => { setTotalSecs(mins * 60); setElapsed(0); }}
                      style={[s.durBtn, sel && s.durBtnSel]}
                    >
                      <Text style={[s.durText, sel && s.durTextSel]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Timer circle */}
          <View style={s.timerWrap}>
            <Svg width={180} height={180} viewBox="0 0 180 180">
              <Circle cx={90} cy={90} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={6} />
              <AnimatedCircle
                cx={90} cy={90} r={R}
                fill="none"
                stroke={isDone ? '#34D399' : '#818CF8'}
                strokeWidth={6}
                strokeDasharray={CIRC}
                animatedProps={animatedProps}
                strokeLinecap="round"
                transform="rotate(-90, 90, 90)"
              />
            </Svg>
            <View style={s.timerCenter}>
              {isDone ? (
                <>
                  <Text style={{ fontSize: 40, marginBottom: 4 }}>🎉</Text>
                  <Text style={s.bravo}>Bravo !</Text>
                </>
              ) : (
                <>
                  <Text style={s.timerText}>{formatTime(remaining)}</Text>
                  <Text style={s.timerSub}>{Math.round(totalSecs / 60)} min</Text>
                </>
              )}
            </View>
          </View>

          {/* Selected task badge */}
          {active && selectedTask && (
            <Text style={s.activeBadge}>🎯 {selectedTask.text}</Text>
          )}

          {/* Buttons */}
          <View style={s.btnRow}>
            {!isDone ? (
              <Pressable onPress={() => { setActive((a) => !a); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}>
                <LinearGradient
                  colors={active ? ['rgba(239,68,68,0.8)', 'rgba(220,38,38,0.8)'] : ['#6366F1', '#8B5CF6']}
                  style={s.mainBtn}
                >
                  <Text style={s.mainBtnText}>{active ? '⏸ Pause' : '▶ Démarrer'}</Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <Pressable onPress={handleFinish}>
                <LinearGradient colors={['#10B981', '#059669']} style={s.mainBtn}>
                  <Text style={s.mainBtnText}>✅ Terminer</Text>
                </LinearGradient>
              </Pressable>
            )}
            <Pressable onPress={reset} style={s.resetBtn}>
              <Text style={s.resetText}>↺</Text>
            </Pressable>
          </View>

          {/* Support message */}
          {!active && !isDone && (
            <Text style={s.supportMsg}>
              C'est correct d'avancer lentement. Une minute de travail vaut mieux que zéro.
            </Text>
          )}
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { alignItems: 'center', justifyContent: 'center', padding: 24, minHeight: '100%' },
  closeBtn: {
    position: 'absolute', top: 50, right: 20, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 18 },

  header: { alignItems: 'center', marginBottom: 28 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 28, color: '#FFFFFF', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 22, textAlign: 'center' },

  // Task selector
  taskSection: { width: '100%', maxWidth: 380, marginBottom: 28 },
  taskLabel: {
    fontFamily: 'Inter_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, textAlign: 'center',
  },
  taskBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  taskBtnSel: { borderColor: '#818CF8', backgroundColor: 'rgba(99,102,241,0.25)' },
  taskCheck: {
    width: 18, height: 18, borderRadius: 5, borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  taskCheckSel: { borderColor: '#818CF8', backgroundColor: '#6366F1' },
  taskCheckMark: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  taskText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)', flex: 1 },
  taskTextSel: { fontFamily: 'Inter_700Bold', color: '#C7D2FE' },
  noTasks: { paddingVertical: 16, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  noTasksText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.4)' },

  // Duration
  durRow: { flexDirection: 'row', gap: 8, marginTop: 14, justifyContent: 'center' },
  durBtn: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
  },
  durBtnSel: { borderColor: '#818CF8', backgroundColor: 'rgba(99,102,241,0.25)' },
  durText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  durTextSel: { fontFamily: 'Inter_700Bold', color: '#C7D2FE' },

  // Timer
  timerWrap: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  timerCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  timerText: { fontFamily: 'Inter_700Bold', fontSize: 44, color: '#FFFFFF', lineHeight: 48 },
  timerSub: { fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 },
  bravo: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#34D399' },

  activeBadge: {
    fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)',
    marginBottom: 16, maxWidth: 280, lineHeight: 20, textAlign: 'center',
  },

  // Buttons
  btnRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 20 },
  mainBtn: { paddingVertical: 13, paddingHorizontal: 32, borderRadius: 30 },
  mainBtnText: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#FFFFFF' },
  resetBtn: {
    paddingVertical: 13, paddingHorizontal: 16, borderRadius: 30,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
  },
  resetText: { fontSize: 18, color: 'rgba(255,255,255,0.4)' },

  supportMsg: {
    fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.25)',
    textAlign: 'center', lineHeight: 20, maxWidth: 300,
  },
});
