import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStorage } from '../hooks/useStorage';
import { colors, radius, shadow, typography } from '../theme';
import { today, formatDate } from '../utils/lunar';

const MOODS = [
  { emoji: '😫', label: 'Épuisé·e', value: 1, color: '#ef4444' },
  { emoji: '😔', label: 'Bas·se', value: 2, color: '#f97316' },
  { emoji: '😐', label: 'Neutre', value: 3, color: '#f59e0b' },
  { emoji: '🙂', label: 'Bien', value: 4, color: '#84cc16' },
  { emoji: '😄', label: 'Super !', value: 5, color: '#10b981' },
];

const ENERGY_LEVELS = ['⚡ Faible', '⚡⚡ Modérée', '⚡⚡⚡ Haute'];

export default function MoodScreen() {
  const insets = useSafeAreaInsets();
  const [moods, setMoods] = useStorage('moods', {});
  const [notes, setNotes] = useStorage('mood_notes', {});
  const [energy, setEnergy] = useStorage('energy', {});
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState('');
  const [selectedEnergy, setSelectedEnergy] = useState(null);
  const todayKey = today();
  const todayMood = moods[todayKey];

  const save = () => {
    if (!selectedMood) return;
    setMoods(prev => ({ ...prev, [todayKey]: selectedMood.emoji }));
    if (note.trim()) setNotes(prev => ({ ...prev, [todayKey]: note.trim() }));
    if (selectedEnergy !== null) setEnergy(prev => ({ ...prev, [todayKey]: selectedEnergy }));
    setSelectedMood(null);
    setNote('');
    setSelectedEnergy(null);
  };

  // Last 7 days
  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const k = formatDate(d);
    const m = MOODS.find(x => x.emoji === moods[k]);
    return { key: k, day: d.toLocaleDateString('fr-FR', { weekday: 'short' }), mood: m };
  });

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={styles.title}>💚 Humeur & Bien-être</Text>

      {/* Today's mood */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Comment vous sentez-vous ?</Text>
        {todayMood && !selectedMood
          ? <View style={styles.todayRow}>
              <Text style={styles.todayEmoji}>{todayMood}</Text>
              <Text style={styles.todayLabel}>Noté aujourd'hui</Text>
              <TouchableOpacity onPress={() => {
                const m = MOODS.find(x => x.emoji === todayMood);
                setSelectedMood(m);
                setNote(notes[todayKey] || '');
              }}>
                <Text style={styles.editLink}>Modifier</Text>
              </TouchableOpacity>
            </View>
          : <>
              <View style={styles.moodRow}>
                {MOODS.map(m => (
                  <TouchableOpacity key={m.value} style={[styles.moodBtn, selectedMood?.value === m.value && { backgroundColor: m.color + '33', borderColor: m.color }]}
                    onPress={() => setSelectedMood(m)}>
                    <Text style={styles.moodEmoji}>{m.emoji}</Text>
                    <Text style={styles.moodLabel}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {selectedMood && <>
                <Text style={styles.label}>Niveau d'énergie</Text>
                <View style={styles.energyRow}>
                  {ENERGY_LEVELS.map((e, i) => (
                    <TouchableOpacity key={i} style={[styles.energyBtn, selectedEnergy===i && { backgroundColor: colors.warning + '33', borderColor: colors.warning }]}
                      onPress={() => setSelectedEnergy(i)}>
                      <Text style={styles.energyText}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.label}>Note (optionnel)</Text>
                <TextInput style={styles.noteInput} placeholder="Comment ça se passe ?"
                  placeholderTextColor={colors.textLight} value={note} onChangeText={setNote}
                  multiline numberOfLines={3} />
                <TouchableOpacity style={[styles.saveBtn, !selectedMood && styles.saveBtnDisabled]} onPress={save}>
                  <Text style={styles.saveBtnText}>Enregistrer</Text>
                </TouchableOpacity>
              </>}
            </>}
      </View>

      {/* Week overview */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Les 7 derniers jours</Text>
        <View style={styles.weekRow}>
          {last7.map(d => (
            <View key={d.key} style={styles.dayCol}>
              <Text style={[styles.dayEmoji, !d.mood && styles.empty]}>{d.mood?.emoji || '·'}</Text>
              <View style={[styles.dayBar, { height: d.mood ? d.mood.value * 8 : 4, backgroundColor: d.mood?.color || colors.border }]} />
              <Text style={styles.dayLabel}>{d.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Pattern note */}
      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>🔍 Conseil</Text>
        <Text style={styles.tipText}>Notez votre humeur chaque jour pendant 2 semaines pour commencer à voir des patterns : jours de la semaine, moments du mois, liens avec le sommeil.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { ...typography.h2, padding: 20, paddingBottom: 8 },
  card: { backgroundColor: colors.surface, margin: 16, marginTop: 8, borderRadius: 16, padding: 16, ...shadow.sm },
  cardTitle: { ...typography.h3, marginBottom: 16 },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  todayEmoji: { fontSize: 40 },
  todayLabel: { ...typography.body, flex: 1 },
  editLink: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  moodRow: { flexDirection: 'row', gap: 6, justifyContent: 'space-between' },
  moodBtn: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border },
  moodEmoji: { fontSize: 26 },
  moodLabel: { fontSize: 10, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  label: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  energyRow: { flexDirection: 'row', gap: 8 },
  energyBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  energyText: { fontSize: 12, fontWeight: '600', color: colors.text },
  noteInput: { backgroundColor: colors.background, borderRadius: 12, padding: 12, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border, minHeight: 80, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 999, padding: 14, alignItems: 'center', marginTop: 16 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 90 },
  dayCol: { alignItems: 'center', gap: 4, flex: 1 },
  dayEmoji: { fontSize: 18 },
  empty: { color: colors.textLight },
  dayBar: { width: 20, borderRadius: 4, minHeight: 4 },
  dayLabel: { fontSize: 10, color: colors.textMuted, textTransform: 'capitalize' },
  tipCard: { backgroundColor: colors.success + '15', margin: 16, marginTop: 0, borderRadius: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: colors.success },
  tipTitle: { fontSize: 13, fontWeight: '700', color: colors.success, marginBottom: 6 },
  tipText: { fontSize: 13, color: colors.text, lineHeight: 20 },
});
