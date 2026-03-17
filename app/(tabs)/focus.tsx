import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useFlowiStore } from '@/store';
import { formatTime, getToday } from '@/utils/date';
import { useTheme } from '@/hooks/useTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const PRESETS: [number, string][] = [
  [5, 'Sprint 🏃'], [10, 'Pause ☕'], [25, 'Pomodoro 🍅'],
  [30, 'Lecture 📖'], [45, 'Travail 💼'], [60, 'Deep Work 🧠'],
];

const PRIO_ICONS: Record<string, string> = { urgente: '🔴', haute: '🟠', normale: '🔵', basse: '🟢' };

export default function FocusScreen() {
  const { dark, t } = useTheme();
  const todos = useFlowiStore((s) => s.todos);
  const earnXp = useFlowiStore((s) => s.earnXp);
  const completeTodo = useFlowiStore((s) => s.completeTodo);

  const [total, setTotal] = useState(1500);
  const [remaining, setRemaining] = useState(1500);
  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);
  const [taskId, setTaskId] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const focusXp = Math.round(total / 60);
  const pct = total > 0 ? remaining / total : 0;
  const focusTask = todos.find((t) => t.id === taskId) || null;
  const pendingTodos = todos.filter((t) => !t.done);

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

  const toggle = () => {
    setActive((f) => !f);
    Haptics.impactAsync(active ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
  };

  const reset = () => {
    setActive(false);
    setDone(false);
    setRemaining(total);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const selectPreset = (mins: number) => {
    if (active) return;
    const secs = mins * 60;
    setTotal(secs);
    setRemaining(secs);
    setDone(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const dismissDone = (checkTask: boolean) => {
    if (checkTask && focusTask) {
      completeTodo(focusTask.id);
      earnXp(focusXp + 5, `Focus: ${focusTask.text.slice(0, 30)}`);
    } else {
      earnXp(focusXp, `Session focus ${Math.round(total / 60)}min`);
    }
    setDone(false);
    setTaskId('');
  };

  const heroContent = (
    <View style={styles.heroSection}>
      {/* Active task badge */}
      {focusTask && (
        <View style={[styles.taskBadge, { backgroundColor: active ? 'rgba(255,255,255,0.1)' : dark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)', borderColor: active ? 'rgba(255,255,255,0.15)' : 'rgba(99,102,241,0.2)' }]}>
          <Text style={[styles.taskBadgeText, { color: active ? 'rgba(255,255,255,0.7)' : '#A78BFA' }]} numberOfLines={1}>🎯 {focusTask.text}</Text>
        </View>
      )}

      {/* SVG Circle */}
      <View style={styles.circleWrap}>
        <Svg width={200} height={200} viewBox="0 0 200 200">
          <Circle cx={100} cy={100} r={RADIUS} fill="none" stroke={active ? 'rgba(255,255,255,0.1)' : dark ? '#2a2a3e' : '#E8EDF5'} strokeWidth={10} />
          <AnimatedCircle
            cx={100} cy={100} r={RADIUS}
            fill="none"
            stroke={active ? '#A78BFA' : '#6366F1'}
            strokeWidth={10}
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={animatedProps}
            strokeLinecap="round"
            transform="rotate(-90, 100, 100)"
          />
        </Svg>
        {/* Glow overlay when active */}
        {active && <View style={styles.glow} />}
        <View style={styles.circleCenter}>
          <Text style={[styles.timerText, { color: active ? '#FFFFFF' : dark ? '#E5E7EB' : '#1E3A8A' }]}>{formatTime(remaining)}</Text>
          <Text style={[styles.timerSub, { color: active ? 'rgba(255,255,255,0.45)' : dark ? '#6B7280' : '#8090B0' }]}>{Math.round(total / 60)} min · +{focusXp} XP</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsRow}>
        <Pressable onPress={reset} style={[styles.resetCircle, { borderColor: active ? 'rgba(255,255,255,0.2)' : dark ? '#2a2a3e' : '#E8EDF5', backgroundColor: active ? 'rgba(255,255,255,0.08)' : dark ? '#1a1a2e' : '#F8FAFF' }]}>
          <Text style={[styles.resetIcon, { color: active ? 'rgba(255,255,255,0.6)' : dark ? '#9CA3AF' : '#6070A0' }]}>↺</Text>
        </Pressable>
        <Pressable onPress={toggle}>
          <LinearGradient
            colors={active ? ['#EF4444', '#DC2626'] : ['#6366F1', '#7C3AED']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.mainBtn}
          >
            <Text style={styles.mainBtnText}>{active ? 'Pause' : 'Démarrer'}</Text>
          </LinearGradient>
        </Pressable>
        {active && <View style={{ width: 44 }} />}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Completion modal */}
      <Modal visible={done} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, dark && { backgroundColor: '#1a1a2e', borderColor: '#2a2a3e' }]}>
            <Text style={{ fontSize: 56, textAlign: 'center', marginBottom: 12 }}>🎉</Text>
            <Text style={[styles.modalTitle, dark && { color: '#E5E7EB' }]}>Bien joué !</Text>
            <Text style={[styles.modalSub, dark && { color: '#9CA3AF' }]}>{Math.round(total / 60)} minutes de focus{'\n'}+{focusTask ? focusXp + 5 : focusXp} XP gagnés</Text>
            {focusTask && (
              <Pressable onPress={() => dismissDone(true)}>
                <LinearGradient colors={['#16A34A', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.modalBtnGreen}>
                  <Text style={styles.modalBtnGreenText}>✅ Tâche terminée · +{focusXp + 5} XP</Text>
                </LinearGradient>
              </Pressable>
            )}
            <Pressable onPress={() => dismissDone(false)} style={[styles.modalBtnGray, dark && { backgroundColor: '#12122a', borderColor: '#2a2a3e' }]}>
              <Text style={[styles.modalBtnGrayText, dark && { color: '#E5E7EB' }]}>{focusTask ? `Continuer sans cocher · +${focusXp} XP` : `Fermer · +${focusXp} XP`}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Main content */}
      {active ? (
        <LinearGradient colors={['#0F172A', '#1E1B4B', '#1E3A5F']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ flex: 1 }}>
          {heroContent}
        </LinearGradient>
      ) : (
        <View style={{ flex: 1, backgroundColor: dark ? '#0f0f1a' : '#FAFBFF' }}>
          {heroContent}

          {/* Configuration panel */}
          <View style={[styles.configPanel, dark && { backgroundColor: '#1a1a2e' }]}>
            <ScrollView contentContainerStyle={styles.configScroll} showsVerticalScrollIndicator={false}>
              {/* Presets */}
              <Text style={[styles.configLabel, dark && { color: '#6B7280' }]}>Durée</Text>
              <View style={styles.presetGrid}>
                {PRESETS.map(([mins, label]) => {
                  const sel = total === mins * 60;
                  return (
                    <Pressable key={mins} onPress={() => selectPreset(mins)} style={[styles.presetCard, sel && styles.presetCardSel, dark && !sel && { backgroundColor: '#12122a', borderColor: '#2a2a3e' }]}>
                      <Text style={[styles.presetMins, { color: sel ? '#4F46E5' : dark ? '#E5E7EB' : '#3D4A6A' }]}>{mins}</Text>
                      <Text style={[styles.presetLabel, { color: sel ? '#6366F1' : dark ? '#6B7280' : '#9CA3AF' }]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Task selector */}
              <Text style={[styles.configLabel, dark && { color: '#6B7280' }]}>Sur quoi tu travailles ?</Text>
              {pendingTodos.length === 0 ? (
                <Text style={[styles.noTasks, dark && { color: '#6B7280' }]}>Aucune tâche en attente</Text>
              ) : (
                <View style={styles.taskList}>
                  <Pressable onPress={() => setTaskId('')} style={[styles.taskOption, taskId === '' && styles.taskOptionSel, dark && taskId !== '' && { backgroundColor: '#12122a', borderColor: '#2a2a3e' }]}>
                    <Text style={[styles.taskOptionText, { color: taskId === '' ? '#4F46E5' : dark ? '#9CA3AF' : '#9CA3AF', fontWeight: taskId === '' ? '700' : '400' }]}>Aucune tâche spécifique</Text>
                  </Pressable>
                  {pendingTodos.slice(0, 8).map((t) => {
                    const sel = taskId === t.id;
                    return (
                      <Pressable key={t.id} onPress={() => setTaskId(t.id)} style={[styles.taskOption, sel && styles.taskOptionSel, dark && !sel && { backgroundColor: '#12122a', borderColor: '#2a2a3e' }]}>
                        <Text style={{ fontSize: 11, flexShrink: 0 }}>{PRIO_ICONS[t.priority] || '🔵'}</Text>
                        <Text style={[styles.taskOptionText, { color: sel ? '#4F46E5' : dark ? '#E5E7EB' : '#374151', fontWeight: sel ? '700' : '400', flex: 1 }]} numberOfLines={1}>{t.text}</Text>
                        {sel && (
                          <View style={styles.taskCheck}>
                            <Text style={styles.taskCheckMark}>✓</Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Hero section
  heroSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  taskBadge: {
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 280,
  },
  taskBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    textAlign: 'center',
  },
  circleWrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(167,139,250,0.15)',
  },
  circleCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 44,
    fontWeight: '900',
    lineHeight: 48,
    letterSpacing: -1,
  },
  timerSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resetCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetIcon: { fontSize: 18 },
  mainBtn: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  mainBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  // Config panel
  configPanel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  configScroll: { paddingBottom: 40 },
  configLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#B0A090',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  presetCard: {
    width: '31.5%',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#F0F0F8',
    backgroundColor: '#FAFBFF',
    alignItems: 'center',
    gap: 3,
  },
  presetCardSel: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  presetMins: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    lineHeight: 24,
  },
  presetLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    lineHeight: 11,
  },

  // Task selector
  noTasks: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#C4C9D4',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  taskList: {
    gap: 6,
  },
  taskOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#F0F0F8',
    backgroundColor: '#FAFBFF',
  },
  taskOptionSel: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  taskOptionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  taskCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  taskCheckMark: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    paddingHorizontal: 28,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: '#1E3A8A',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  modalBtnGreen: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalBtnGreenText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  modalBtnGray: {
    width: '100%',
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8EDF5',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  modalBtnGrayText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#6B7280',
  },
});
