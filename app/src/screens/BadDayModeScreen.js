import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStorage } from '../hooks/useStorage';
import { colors, radius, shadow, typography } from '../theme';

const GENTLE_MESSAGES = [
  'Vous faites du mieux que vous pouvez. C\'est suffisant.',
  'Les mauvais jours font partie du voyage. Ils passent.',
  'Vous n\'avez pas à tout accomplir aujourd\'hui.',
  'Un pas à la fois. Juste le prochain pas.',
  'Il est normal de ne pas être au maximum chaque jour.',
  'Votre valeur ne dépend pas de votre productivité.',
];

export default function BadDayModeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [todos] = useStorage('todos', []);
  const message = GENTLE_MESSAGES[new Date().getDay() % GENTLE_MESSAGES.length];
  const top3 = todos.filter(t => !t.done && t.priority === 'high').slice(0, 3);
  const fallback3 = todos.filter(t => !t.done).slice(0, 3);
  const prioritized = top3.length > 0 ? top3 : fallback3;

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={{ paddingBottom: 80 }}>
      {/* Gentle hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>💙</Text>
        <Text style={styles.heroTitle}>Mode mauvais jour</Text>
        <Text style={styles.heroSub}>Interface simplifiée · Bienveillance · 3 tâches max</Text>
      </View>

      {/* Message */}
      <View style={styles.messageCard}>
        <Text style={styles.messageQuote}>{message}</Text>
      </View>

      {/* Only 3 tasks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✅ Si vous ne faites que 3 choses aujourd'hui</Text>
        {prioritized.length === 0
          ? <Text style={styles.noTasks}>Aucune tâche en attente 🎉{'\n'}C'est peut-être votre jour de repos.</Text>
          : prioritized.map((t, i) => (
            <View key={t.id} style={[styles.taskItem, { borderLeftColor: t.color || colors.primary }]}>
              <Text style={styles.taskNumber}>{i + 1}</Text>
              <Text style={styles.taskTitle}>{t.title}</Text>
            </View>
          ))
        }
        <TouchableOpacity style={styles.editLink} onPress={() => navigation.navigate('Planning')}>
          <Text style={styles.editLinkText}>Modifier mes tâches →</Text>
        </TouchableOpacity>
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌿 Prenez soin de vous</Text>
        {CARE_ACTIONS.map(a => (
          <TouchableOpacity key={a.label} style={styles.careBtn} onPress={() => a.screen && navigation.navigate(a.screen)}>
            <Text style={styles.careEmoji}>{a.emoji}</Text>
            <View>
              <Text style={styles.careLabel}>{a.label}</Text>
              <Text style={styles.careDesc}>{a.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Permission to rest */}
      <View style={styles.permissionCard}>
        <Text style={styles.permissionTitle}>🛌 Permission de ne pas en faire plus</Text>
        <Text style={styles.permissionText}>Aujourd'hui, vous avez la permission de faire le minimum. De vous reposer. De dire non. De ne pas être productif·ve. Demain est un autre jour.</Text>
      </View>

      <TouchableOpacity style={styles.breathBtn} onPress={() => navigation.navigate('Breathing')}>
        <Text style={styles.breathBtnText}>🫁 Exercice de respiration guidé</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const CARE_ACTIONS = [
  { emoji: '🫁', label: 'Exercice de respiration', desc: 'Cohérence cardiaque ou box breathing', screen: 'Breathing' },
  { emoji: '🧰', label: 'Kit de secours émotionnel', desc: 'Vos ressources préparées à l\'avance', screen: 'EmergencyKit' },
  { emoji: '🫙', label: 'Bocal à souvenirs', desc: 'Ajouter un petit moment de joie', screen: 'Jar' },
  { emoji: '💧', label: 'Boire un verre d\'eau', desc: 'Simple et efficace', screen: 'Hydration' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  hero: { backgroundColor: '#2d3a6b', padding: 32, alignItems: 'center' },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: colors.white, marginBottom: 6 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  messageCard: { backgroundColor: '#e8effe', margin: 16, borderRadius: radius.lg, padding: 24, borderLeftWidth: 4, borderLeftColor: '#6b7fdb' },
  messageQuote: { fontSize: 18, fontStyle: 'italic', color: '#2d3a6b', lineHeight: 28, textAlign: 'center' },
  section: { backgroundColor: colors.surface, margin: 16, marginTop: 0, borderRadius: radius.md, padding: 16, ...shadow.sm },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#2d3a6b', marginBottom: 16 },
  taskItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderLeftWidth: 3, backgroundColor: '#f8f9ff', borderRadius: 8, marginBottom: 8 },
  taskNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#6b7fdb', color: colors.white, textAlign: 'center', lineHeight: 24, fontWeight: '700', fontSize: 12 },
  taskTitle: { ...typography.body, flex: 1, fontWeight: '600' },
  noTasks: { ...typography.body, textAlign: 'center', color: colors.textMuted, lineHeight: 24, paddingVertical: 8 },
  editLink: { marginTop: 8 },
  editLinkText: { color: '#6b7fdb', fontWeight: '600', fontSize: 13 },
  careBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  careEmoji: { fontSize: 26, width: 36, textAlign: 'center' },
  careLabel: { ...typography.body, fontWeight: '600' },
  careDesc: { ...typography.caption, marginTop: 2 },
  permissionCard: { backgroundColor: '#fff7ed', margin: 16, marginTop: 0, borderRadius: radius.md, padding: 20, borderWidth: 1, borderColor: '#fed7aa' },
  permissionTitle: { fontSize: 15, fontWeight: '700', color: '#c2410c', marginBottom: 10 },
  permissionText: { fontSize: 14, color: '#7c2d12', lineHeight: 22 },
  breathBtn: { backgroundColor: '#6b7fdb', margin: 16, marginTop: 0, borderRadius: radius.full, padding: 16, alignItems: 'center' },
  breathBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
