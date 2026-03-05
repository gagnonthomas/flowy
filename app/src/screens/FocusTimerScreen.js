import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStorage } from '../hooks/useStorage';
import { colors, radius, typography, shadow } from '../theme';
import { today } from '../utils/lunar';

const MODES = [
  { key: 'pomodoro', label: 'Focus', duration: 25 * 60, color: colors.primary },
  { key: 'short', label: 'Pause courte', duration: 5 * 60, color: colors.success },
  { key: 'long', label: 'Pause longue', duration: 15 * 60, color: colors.info },
];

export default function FocusTimerScreen() {
  const insets = useSafeAreaInsets();
  const [modeIdx, setModeIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(MODES[0].duration);
  const [sessions, setSessions] = useStorage('focus_sessions', {});
  const intervalRef = useRef(null);
  const animRef = useRef(new Animated.Value(0)).current;
  const pulseRef = useRef(new Animated.Value(1)).current;

  const mode = MODES[modeIdx];
  const progress = 1 - seconds / mode.duration;
  const todayKey = today();
  const todaySessions = sessions[todayKey] || 0;

  useEffect(() => {
    if (running) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseRef, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseRef, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (modeIdx === 0) {
              setSessions(prev => ({ ...prev, [todayKey]: (prev[todayKey] || 0) + 1 }));
              Alert.alert('🎉 Session terminée !', 'Excellent travail ! Prenez une pause méritée.', [
                { text: 'Pause courte (5 min)', onPress: () => switchMode(1) },
                { text: 'Pause longue (15 min)', onPress: () => switchMode(2) },
                { text: 'Continuer', style: 'cancel' },
              ]);
            }
            return mode.duration;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
      pulseRef.stopAnimation();
      pulseRef.setValue(1);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, modeIdx]);

  const switchMode = (idx) => {
    setRunning(false);
    setModeIdx(idx);
    setSeconds(MODES[idx].duration);
  };

  const reset = () => { setRunning(false); setSeconds(mode.duration); };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const circumference = 2 * Math.PI * 110;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>⏱️ Focus Timer</Text>

      {/* Mode selector */}
      <View style={styles.modeRow}>
        {MODES.map((m, i) => (
          <TouchableOpacity key={m.key} style={[styles.modeBtn, modeIdx===i && { backgroundColor: m.color }]}
            onPress={() => switchMode(i)}>
            <Text style={[styles.modeBtnText, modeIdx===i && { color: colors.white }]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Circle timer */}
      <View style={styles.timerContainer}>
        <Animated.View style={[styles.timerOuter, { borderColor: mode.color + '22' }, { transform: [{ scale: running ? pulseRef : 1 }] }]}>
          <View style={[styles.timerInner, { borderColor: mode.color }]}>
            <Text style={[styles.timeText, { color: mode.color }]}>{mm}:{ss}</Text>
            <Text style={styles.modeLabel}>{mode.label}</Text>
            {running && <Text style={styles.focusTip}>🧠 Restez dans le flux</Text>}
          </View>
        </Animated.View>

        {/* Progress arc indicator */}
        <View style={[styles.progressIndicator, { backgroundColor: mode.color }]}>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.resetBtn} onPress={reset}>
          <Ionicons name="refresh" size={24} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.playBtn, { backgroundColor: mode.color }]}
          onPress={() => setRunning(r => !r)}>
          <Ionicons name={running ? 'pause' : 'play'} size={36} color={colors.white} />
        </TouchableOpacity>
        <View style={{ width: 52 }} />
      </View>

      {/* Sessions today */}
      <View style={styles.sessionsCard}>
        <Text style={styles.sessionsTitle}>Sessions aujourd'hui</Text>
        <View style={styles.tomatoRow}>
          {Array.from({ length: Math.max(todaySessions, 4) }).map((_, i) => (
            <Text key={i} style={[styles.tomato, i >= todaySessions && { opacity: 0.2 }]}>🍅</Text>
          ))}
        </View>
        <Text style={styles.sessionCount}>{todaySessions} session{todaySessions !== 1 ? 's' : ''} complétée{todaySessions !== 1 ? 's' : ''}</Text>
      </View>

      {/* Time agnosia tip */}
      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 Adapté à la time-agnosia</Text>
        <Text style={styles.tipText}>Ce timer est conçu pour les personnes qui peinent à percevoir le passage du temps (TDAH, autisme). La progression visuelle vous ancre dans le présent.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center' },
  title: { ...typography.h2, marginTop: 20, marginBottom: 16 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  modeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  modeBtnText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  timerContainer: { position: 'relative', marginBottom: 32 },
  timerOuter: { width: 270, height: 270, borderRadius: 135, borderWidth: 12, alignItems: 'center', justifyContent: 'center' },
  timerInner: { width: 230, height: 230, borderRadius: 115, borderWidth: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, ...shadow.md },
  timeText: { fontSize: 56, fontWeight: '800', fontVariant: ['tabular-nums'] },
  modeLabel: { ...typography.caption, marginTop: 4, fontWeight: '600' },
  focusTip: { fontSize: 11, color: colors.textLight, marginTop: 8 },
  progressIndicator: { position: 'absolute', bottom: 10, right: 10, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  progressText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 28 },
  playBtn: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', ...shadow.md },
  resetBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.sm },
  sessionsCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, alignItems: 'center', ...shadow.sm, marginBottom: 16, width: '90%' },
  sessionsTitle: { ...typography.caption, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  tomatoRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tomato: { fontSize: 28 },
  sessionCount: { ...typography.caption, fontWeight: '600' },
  tipCard: { backgroundColor: colors.primary + '15', borderRadius: radius.md, padding: 16, width: '90%', borderLeftWidth: 4, borderLeftColor: colors.primary },
  tipTitle: { fontSize: 13, fontWeight: '700', color: colors.primary, marginBottom: 6 },
  tipText: { fontSize: 12, color: colors.text, lineHeight: 18 },
});
