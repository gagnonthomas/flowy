import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, typography } from '../theme';

const TECHNIQUES = [
  {
    key: 'coherence', name: 'Cohérence cardiaque', emoji: '💚',
    color: colors.success, description: 'Idéal matin, midi et soir',
    steps: [
      { label: 'Inspirez', duration: 5000, scale: 1.4 },
      { label: 'Expirez', duration: 5000, scale: 0.8 },
    ],
    cycles: 6, tip: 'Pratiquez 3 fois par jour (5 min) pour réguler le système nerveux.',
  },
  {
    key: 'box', name: 'Box Breathing', emoji: '📦',
    color: colors.primary, description: 'Avant une réunion stressante',
    steps: [
      { label: 'Inspirez', duration: 4000, scale: 1.4 },
      { label: 'Retenez', duration: 4000, scale: 1.4 },
      { label: 'Expirez', duration: 4000, scale: 0.8 },
      { label: 'Retenez', duration: 4000, scale: 0.8 },
    ],
    cycles: 4, tip: 'Technique utilisée par les Navy SEALs pour gérer le stress en situation difficile.',
  },
  {
    key: '478', name: '4-7-8', emoji: '😴',
    color: colors.primaryDark, description: 'Pour s\'endormir plus facilement',
    steps: [
      { label: 'Inspirez', duration: 4000, scale: 1.4 },
      { label: 'Retenez', duration: 7000, scale: 1.4 },
      { label: 'Expirez lentement', duration: 8000, scale: 0.8 },
    ],
    cycles: 4, tip: 'Parfait au coucher. Après 2 semaines de pratique, l\'endormissement s\'accélère.',
  },
];

export default function BreathingScreen() {
  const insets = useSafeAreaInsets();
  const [techIdx, setTechIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [done, setDone] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;
  const timeoutRef = useRef(null);
  const tech = TECHNIQUES[techIdx];
  const step = tech.steps[stepIdx];

  useEffect(() => {
    if (!running) return;
    const s = tech.steps[stepIdx];
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: s.scale, duration: s.duration, easing: Easing.inOut(Easing.sine), useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: s.scale > 1 ? 1 : 0.5, duration: s.duration, useNativeDriver: true }),
    ]).start();

    timeoutRef.current = setTimeout(() => {
      const nextStep = (stepIdx + 1) % tech.steps.length;
      if (nextStep === 0) {
        const nextCycle = cycleCount + 1;
        if (nextCycle >= tech.cycles) {
          setRunning(false);
          setStepIdx(0);
          setCycleCount(0);
          setDone(true);
          scaleAnim.setValue(0.8);
          return;
        }
        setCycleCount(nextCycle);
      }
      setStepIdx(nextStep);
    }, s.duration);

    return () => clearTimeout(timeoutRef.current);
  }, [running, stepIdx, cycleCount]);

  const start = () => { setDone(false); setStepIdx(0); setCycleCount(0); setRunning(true); };
  const stop = () => { clearTimeout(timeoutRef.current); setRunning(false); setStepIdx(0); setCycleCount(0); scaleAnim.setValue(0.8); };

  const switchTech = (i) => { stop(); setTechIdx(i); setDone(false); };

  return (
    <View style={[styles.container, { paddingTop: insets.top }, { backgroundColor: tech.color + '10' }]}>
      <Text style={styles.title}>🫁 Respiration guidée</Text>

      {/* Technique selector */}
      <View style={styles.techRow}>
        {TECHNIQUES.map((t, i) => (
          <TouchableOpacity key={t.key} style={[styles.techBtn, techIdx===i && { backgroundColor: t.color }]}
            onPress={() => switchTech(i)}>
            <Text style={styles.techEmoji}>{t.emoji}</Text>
            <Text style={[styles.techName, techIdx===i && { color: colors.white }]}>{t.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.techDesc}>{tech.description}</Text>

      {/* Animated circle */}
      <View style={styles.circleContainer}>
        <Animated.View style={[styles.outerCircle, { borderColor: tech.color + '44', opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={[styles.innerCircle, { backgroundColor: tech.color }]}>
            {running
              ? <Text style={styles.circleLabel}>{step.label}</Text>
              : done
                ? <Text style={styles.circleLabel}>✨ Terminé</Text>
                : <Text style={styles.circleLabel}>Prêt·e</Text>}
            {running && <Text style={styles.cycleText}>{cycleCount + 1}/{tech.cycles}</Text>}
          </View>
        </Animated.View>
      </View>

      {/* Step guide */}
      {running && (
        <View style={styles.stepsRow}>
          {tech.steps.map((s, i) => (
            <View key={i} style={[styles.stepPill, i===stepIdx && { backgroundColor: tech.color }]}>
              <Text style={[styles.stepPillText, i===stepIdx && { color: colors.white }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {done && (
        <View style={styles.doneCard}>
          <Text style={styles.doneEmoji}>🌿</Text>
          <Text style={styles.doneText}>Exercice terminé. Prenez un moment pour ressentir la différence.</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {running
          ? <TouchableOpacity style={[styles.btn, { backgroundColor: colors.danger }]} onPress={stop}>
              <Text style={styles.btnText}>Arrêter</Text>
            </TouchableOpacity>
          : <TouchableOpacity style={[styles.btn, { backgroundColor: tech.color }]} onPress={start}>
              <Text style={styles.btnText}>{done ? 'Recommencer' : 'Commencer'}</Text>
            </TouchableOpacity>}
      </View>

      {/* Tip */}
      <View style={[styles.tipCard, { borderLeftColor: tech.color }]}>
        <Text style={styles.tipText}>{tech.tip}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { ...typography.h2, padding: 20, paddingBottom: 8 },
  techRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  techBtn: { flex: 1, alignItems: 'center', padding: 10, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  techEmoji: { fontSize: 20 },
  techName: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  techDesc: { textAlign: 'center', ...typography.caption, fontStyle: 'italic', marginBottom: 24 },
  circleContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  outerCircle: { width: 220, height: 220, borderRadius: 110, borderWidth: 16, alignItems: 'center', justifyContent: 'center' },
  innerCircle: { width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center' },
  circleLabel: { color: colors.white, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  cycleText: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 },
  stepsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16, paddingHorizontal: 16 },
  stepPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  stepPillText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  doneCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.success + '20', marginHorizontal: 16, borderRadius: radius.md, padding: 16, marginBottom: 16 },
  doneEmoji: { fontSize: 28 },
  doneText: { ...typography.body, flex: 1, color: colors.success, lineHeight: 22 },
  controls: { alignItems: 'center', marginBottom: 20 },
  btn: { paddingHorizontal: 40, paddingVertical: 16, borderRadius: radius.full },
  btnText: { color: colors.white, fontWeight: '700', fontSize: 17 },
  tipCard: { margin: 16, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, borderLeftWidth: 4 },
  tipText: { fontSize: 13, color: colors.text, lineHeight: 20, fontStyle: 'italic' },
});
