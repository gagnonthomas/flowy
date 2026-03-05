import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStorage } from '../hooks/useStorage';
import { getLunarPhase, today } from '../utils/lunar';
import { colors, spacing, radius, shadow, typography } from '../theme';

const MOODS = ['😫','😔','😐','🙂','😄'];
const INTENTIONS = [
  'Commencer par la tâche la plus difficile',
  'Faire une chose à la fois',
  'Boire 8 verres d\'eau aujourd\'hui',
  'Prendre 5 min pour respirer',
  'Être bienveillant·e envers moi-même',
  'Célébrer mes petites victoires',
];

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [todos] = useStorage('todos', []);
  const [moods] = useStorage('moods', {});
  const [water] = useStorage('water', {});
  const [hydration, setHydration] = useStorage('water', {});
  const lunar = getLunarPhase();
  const todayKey = today();
  const todayMood = moods[todayKey];
  const todayWater = hydration[todayKey] || 0;
  const pendingTodos = todos.filter(t => !t.done).slice(0, 3);
  const [intention] = useState(INTENTIONS[new Date().getDay() % INTENTIONS.length]);

  const addWater = () => {
    setHydration(h => ({ ...h, [todayKey]: (h[todayKey] || 0) + 1 }));
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.greeting}>{greeting} 👋</Text>
        <Text style={styles.date}>{dateStr}</Text>
        <View style={styles.intentionBox}>
          <Text style={styles.intentionLabel}>✨ Intention du jour</Text>
          <Text style={styles.intentionText}>{intention}</Text>
        </View>
      </View>

      {/* Quick stats */}
      <View style={styles.statsRow}>
        <StatPill emoji="💧" value={`${todayWater}/8`} label="Verres" onPress={addWater} color={colors.info} />
        <StatPill emoji={lunar.emoji} value={lunar.name.split(' ').slice(-1)[0]} label="Lune" color={colors.primary} />
        <StatPill emoji={todayMood || '❓'} value={todayMood ? 'Noté' : 'À noter'} label="Humeur"
          onPress={() => navigation.navigate('Bien-être')} color={colors.accent} />
        <StatPill emoji="✅" value={`${todos.filter(t=>t.done).length}/${todos.length}`} label="Tâches"
          onPress={() => navigation.navigate('Planning')} color={colors.success} />
      </View>

      {/* Lunar */}
      <TouchableOpacity style={styles.lunarCard} onPress={() => navigation.navigate('LunarScreen')}>
        <Text style={styles.lunarEmoji}>{lunar.emoji}</Text>
        <View>
          <Text style={styles.lunarName}>{lunar.name}</Text>
          <Text style={styles.lunarIntention}>{lunar.intention}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.primaryLight} />
      </TouchableOpacity>

      {/* Tâches prioritaires */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Priorités du jour</Text>
        {pendingTodos.length === 0
          ? <Text style={styles.empty}>Toutes les tâches sont faites 🎉</Text>
          : pendingTodos.map(t => (
            <View key={t.id} style={styles.todoRow}>
              <View style={[styles.todoDot, { backgroundColor: t.color || colors.primary }]} />
              <Text style={styles.todoText}>{t.title}</Text>
            </View>
          ))
        }
        <TouchableOpacity onPress={() => navigation.navigate('Planning')}>
          <Text style={styles.link}>Voir toutes les tâches →</Text>
        </TouchableOpacity>
      </View>

      {/* Accès rapide */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Accès rapide</Text>
        <View style={styles.quickGrid}>
          {QUICK_LINKS.map(q => (
            <TouchableOpacity key={q.label} style={styles.quickBtn}
              onPress={() => navigation.navigate(q.screen)}>
              <Text style={styles.quickEmoji}>{q.emoji}</Text>
              <Text style={styles.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bouton mauvais jour */}
      <TouchableOpacity style={styles.badDayBtn} onPress={() => navigation.navigate('BadDayMode')}>
        <Ionicons name="heart" size={18} color={colors.white} />
        <Text style={styles.badDayText}>Mode mauvais jour</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatPill({ emoji, value, label, onPress, color }) {
  return (
    <TouchableOpacity style={[styles.statPill, { borderColor: color + '33' }]} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const QUICK_LINKS = [
  { emoji: '🧰', label: 'Kit urgence', screen: 'EmergencyKit' },
  { emoji: '🫙', label: 'Bocal', screen: 'Jar' },
  { emoji: '🫁', label: 'Respiration', screen: 'Breathing' },
  { emoji: '⏱️', label: 'Focus', screen: 'Focus' },
  { emoji: '✉️', label: 'Ma lettre', screen: 'Letter' },
  { emoji: '🛟', label: 'Mauvais jour', screen: 'BadDayMode' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: { backgroundColor: colors.primary, padding: 24, paddingBottom: 32 },
  greeting: { fontSize: 26, fontWeight: '700', color: colors.white },
  date: { color: colors.primaryLight, fontSize: 14, marginTop: 4, textTransform: 'capitalize' },
  intentionBox: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.md, padding: 12, marginTop: 14 },
  intentionLabel: { color: colors.accentLight, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  intentionText: { color: colors.white, fontSize: 14, fontStyle: 'italic', lineHeight: 20 },

  statsRow: { flexDirection: 'row', padding: 16, gap: 8, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  statPill: { flex: 1, alignItems: 'center', backgroundColor: colors.background, borderRadius: radius.md, padding: 10, borderWidth: 1 },
  statEmoji: { fontSize: 20 },
  statValue: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  statLabel: { fontSize: 10, color: colors.textLight, marginTop: 1 },

  lunarCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, margin: 16, borderRadius: radius.md, padding: 16, gap: 12, ...shadow.sm },
  lunarEmoji: { fontSize: 32 },
  lunarName: { ...typography.h3, fontSize: 15 },
  lunarIntention: { ...typography.caption, fontStyle: 'italic', marginTop: 2 },

  section: { backgroundColor: colors.surface, margin: 16, marginTop: 0, borderRadius: radius.md, padding: 16, ...shadow.sm },
  sectionTitle: { ...typography.h3, marginBottom: 12 },
  empty: { ...typography.caption, fontStyle: 'italic' },
  todoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  todoDot: { width: 8, height: 8, borderRadius: 4 },
  todoText: { ...typography.body, flex: 1 },
  link: { color: colors.primary, fontSize: 13, fontWeight: '600', marginTop: 8 },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickBtn: { width: '30%', alignItems: 'center', backgroundColor: colors.background, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.border },
  quickEmoji: { fontSize: 24 },
  quickLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4, fontWeight: '600', textAlign: 'center' },

  badDayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.danger, margin: 16, borderRadius: radius.full, padding: 14 },
  badDayText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
