import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStorage } from '../hooks/useStorage';
import { colors, radius, shadow, typography } from '../theme';

const QUESTIONS = [
  { key: 'wins', emoji: '🏆', label: 'Victoires & fiertés', prompt: 'Qu\'est-ce qui s\'est bien passé cette semaine ?' },
  { key: 'challenges', emoji: '💪', label: 'Défis surmontés', prompt: 'Qu\'est-ce qui a été difficile ? Comment avez-vous géré ?' },
  { key: 'learnings', emoji: '💡', label: 'Apprentissages', prompt: 'Qu\'avez-vous appris sur vous-même cette semaine ?' },
  { key: 'energy', emoji: '🔋', label: 'Énergie & bien-être', prompt: 'Comment était votre énergie globale ? Votre sommeil ?' },
  { key: 'gratitude', emoji: '🙏', label: 'Gratitude', prompt: '3 choses pour lesquelles vous êtes reconnaissant·e...' },
  { key: 'intention', emoji: '🎯', label: 'Intention de la semaine', prompt: 'Quel est votre objectif principal pour la semaine à venir ?' },
  { key: 'selfcare', emoji: '💆', label: 'Soin de soi', prompt: 'Comment allez-vous prendre soin de vous la semaine prochaine ?' },
];

function getWeekKey() {
  const d = new Date();
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay() + 1);
  return start.toISOString().split('T')[0];
}

export default function WeeklyReviewScreen() {
  const insets = useSafeAreaInsets();
  const weekKey = getWeekKey();
  const [reviews, setReviews] = useStorage('weekly_reviews', {});
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [viewingPast, setViewingPast] = useState(false);
  const currentWeek = reviews[weekKey];
  const allWeeks = Object.entries(reviews).sort((a, b) => b[0].localeCompare(a[0]));

  const setAnswer = (key, val) => setAnswers(prev => ({ ...prev, [key]: val }));

  const submit = () => {
    if (Object.keys(answers).length < 3) {
      Alert.alert('Continuez', 'Répondez à au moins 3 questions pour compléter votre revue.');
      return;
    }
    const summary = generateSummary(answers);
    setReviews(prev => ({ ...prev, [weekKey]: { answers, summary, completedAt: new Date().toISOString() } }));
    Alert.alert('✨ Revue complétée !', summary, [{ text: 'Parfait !' }]);
    setStep(0);
    setAnswers({});
  };

  const generateSummary = (a) => {
    const parts = [];
    if (a.wins) parts.push(`Cette semaine : ${a.wins.split('\n')[0]}`);
    if (a.intention) parts.push(`Objectif : ${a.intention}`);
    if (a.gratitude) parts.push(`Gratitude : ${a.gratitude.split('\n')[0]}`);
    return parts.join(' · ') || 'Revue complétée avec succès.';
  };

  if (currentWeek && !viewingPast) {
    return (
      <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.header}>
          <Text style={styles.title}>📖 Revue hebdomadaire</Text>
        </View>
        <View style={styles.doneCard}>
          <Text style={styles.doneEmoji}>✅</Text>
          <Text style={styles.doneTitle}>Revue de cette semaine complétée !</Text>
          <Text style={styles.doneDate}>Complétée le {new Date(currentWeek.completedAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          {currentWeek.summary && <Text style={styles.doneSummary}>"{currentWeek.summary}"</Text>}
          <TouchableOpacity style={styles.redoBtn} onPress={() => { setAnswers(currentWeek.answers || {}); setStep(0); setViewingPast(true); }}>
            <Text style={styles.redoBtnText}>Voir / modifier ma revue</Text>
          </TouchableOpacity>
        </View>
        {allWeeks.length > 1 && (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>📚 Revues précédentes</Text>
            {allWeeks.slice(1, 5).map(([k, r]) => (
              <View key={k} style={styles.historyItem}>
                <Text style={styles.historyDate}>Semaine du {new Date(k).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</Text>
                {r.summary && <Text style={styles.historySummary} numberOfLines={2}>{r.summary}</Text>}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  }

  const q = QUESTIONS[step];
  const progress = (step / QUESTIONS.length) * 100;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { setStep(0); setViewingPast(false); }}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={styles.title}>📖 Revue hebdomadaire</Text>
        <Text style={styles.stepCounter}>{step + 1}/{QUESTIONS.length}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.questionContainer}>
        <Text style={styles.qEmoji}>{q.emoji}</Text>
        <Text style={styles.qLabel}>{q.label}</Text>
        <Text style={styles.qPrompt}>{q.prompt}</Text>
        <TextInput style={styles.qInput} placeholder="Écrivez ici..."
          placeholderTextColor={colors.textLight} value={answers[q.key] || ''}
          onChangeText={v => setAnswer(q.key, v)} multiline numberOfLines={5}
          textAlignVertical="top" autoFocus />

        <View style={styles.navRow}>
          {step > 0 && (
            <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(s => s - 1)}>
              <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
              <Text style={styles.prevText}>Précédent</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          {step < QUESTIONS.length - 1
            ? <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(s => s + 1)}>
                <Text style={styles.nextText}>Suivant</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.white} />
              </TouchableOpacity>
            : <TouchableOpacity style={styles.submitBtn} onPress={submit}>
                <Text style={styles.nextText}>Terminer ✨</Text>
              </TouchableOpacity>}
        </View>

        {/* Quick dots nav */}
        <View style={styles.dots}>
          {QUESTIONS.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setStep(i)}>
              <View style={[styles.dot, i===step && styles.dotActive, answers[QUESTIONS[i].key] && styles.dotDone]} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 },
  title: { ...typography.h3, flex: 1 },
  stepCounter: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  progressBg: { height: 4, backgroundColor: colors.border },
  progressFill: { height: 4, backgroundColor: colors.primary },
  questionContainer: { padding: 24, paddingBottom: 60 },
  qEmoji: { fontSize: 48, marginBottom: 12 },
  qLabel: { fontSize: 12, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  qPrompt: { ...typography.h3, marginBottom: 20, lineHeight: 28 },
  qInput: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, fontSize: 16, color: colors.text, minHeight: 120, borderWidth: 1, borderColor: colors.border, lineHeight: 24 },
  navRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
  prevBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 12 },
  prevText: { color: colors.textMuted, fontWeight: '600' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 20, paddingVertical: 12 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.success, borderRadius: radius.full, paddingHorizontal: 20, paddingVertical: 12 },
  nextText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  dots: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 24 },
  dotDone: { backgroundColor: colors.primary + '66' },
  doneCard: { backgroundColor: colors.surface, margin: 16, borderRadius: radius.lg, padding: 24, alignItems: 'center', ...shadow.md },
  doneEmoji: { fontSize: 48, marginBottom: 12 },
  doneTitle: { ...typography.h3, textAlign: 'center', marginBottom: 8 },
  doneDate: { ...typography.caption, marginBottom: 12 },
  doneSummary: { ...typography.body, fontStyle: 'italic', textAlign: 'center', color: colors.textMuted, lineHeight: 22 },
  redoBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.full, borderWidth: 1, borderColor: colors.primary },
  redoBtnText: { color: colors.primary, fontWeight: '600' },
  historyCard: { backgroundColor: colors.surface, margin: 16, marginTop: 0, borderRadius: radius.md, padding: 16, ...shadow.sm },
  historyTitle: { ...typography.h3, marginBottom: 12 },
  historyItem: { borderLeftWidth: 3, borderLeftColor: colors.primary + '66', paddingLeft: 12, marginBottom: 12 },
  historyDate: { fontSize: 12, fontWeight: '700', color: colors.primary, textTransform: 'capitalize' },
  historySummary: { ...typography.caption, marginTop: 4, lineHeight: 18 },
});
