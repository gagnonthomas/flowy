import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStorage } from '../hooks/useStorage';
import { getLunarPhase, today } from '../utils/lunar';
import { colors, radius, shadow, typography } from '../theme';

const PHASES = [
  { name: 'Nouvelle Lune', emoji: '🌑', theme: 'Intention & renouveau', tips: ['Posez de nouvelles intentions','Faites le bilan du cycle précédent','Commencez un nouveau projet','Méditez sur vos désirs profonds'] },
  { name: 'Premier croissant', emoji: '🌒', theme: 'Semences & initiation', tips: ['Faites vos premiers pas','Partagez votre intention','Bougez votre corps','Cultivez l\'enthousiasme'] },
  { name: 'Premier quartier', emoji: '🌓', theme: 'Action & décision', tips: ['Affrontez les défis qui se présentent','Prenez des décisions','Augmentez vos efforts','Résolvez les obstacles'] },
  { name: 'Gibbeuse croissante', emoji: '🌔', theme: 'Croissance & raffinement', tips: ['Ajustez votre approche','Persistez dans vos efforts','Cherchez des conseils','Affinez votre vision'] },
  { name: 'Pleine Lune', emoji: '🌕', theme: 'Célébration & gratitude', tips: ['Célébrez vos accomplissements','Soyez reconnaissant·e','Partagez avec vos proches','Rituels de gratitude'] },
  { name: 'Gibbeuse décroissante', emoji: '🌖', theme: 'Lâcher-prise & partage', tips: ['Donnez ce que vous n\'utilisez plus','Exprimez votre gratitude','Réduisez ce qui ne vous sert pas','Enseignez ce que vous avez appris'] },
  { name: 'Dernier quartier', emoji: '🌗', theme: 'Bilan & pardon', tips: ['Faites le bilan','Pardonnez-vous et pardonnez aux autres','Lâchez les vieilles habitudes','Méditez en silence'] },
  { name: 'Dernier croissant', emoji: '🌘', theme: 'Repos & intégration', tips: ['Reposez-vous','Méditez','Rêvez','Préparez-vous pour le prochain cycle'] },
];

export default function LunarScreen() {
  const insets = useSafeAreaInsets();
  const lunar = getLunarPhase();
  const [intentions, setIntentions] = useStorage('lunar_intentions', {});
  const [note, setNote] = useState(intentions[today()] || '');
  const currentPhase = PHASES.find(p => p.name === lunar.name) || PHASES[0];

  const saveIntention = () => {
    if (note.trim()) setIntentions(prev => ({ ...prev, [today()]: note.trim() }));
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>{lunar.emoji}</Text>
        <Text style={styles.heroPhase}>{lunar.name}</Text>
        <Text style={styles.heroTheme}>{currentPhase.theme}</Text>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${lunar.pct * 100}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{Math.round(lunar.pct * 100)}% du cycle lunaire</Text>
      </View>

      {/* Tips for this phase */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>✨ En phase avec votre énergie</Text>
        {currentPhase.tips.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipItem}>{tip}</Text>
          </View>
        ))}
      </View>

      {/* Intention */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🌟 Mon intention pour ce cycle</Text>
        <TextInput style={styles.input} placeholder="Quelle intention souhaitez-vous poser ?"
          placeholderTextColor={colors.textLight} value={note} onChangeText={setNote}
          multiline numberOfLines={3} textAlignVertical="top" onBlur={saveIntention} />
        <TouchableOpacity style={styles.saveBtn} onPress={saveIntention}>
          <Text style={styles.saveBtnText}>Ancrer cette intention</Text>
        </TouchableOpacity>
      </View>

      {/* All phases */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🌙 Le cycle complet</Text>
        {PHASES.map(p => (
          <View key={p.name} style={[styles.phaseRow, p.name === lunar.name && styles.phaseRowActive]}>
            <Text style={styles.phaseEmoji}>{p.emoji}</Text>
            <View style={styles.phaseInfo}>
              <Text style={[styles.phaseName, p.name === lunar.name && styles.phaseNameActive]}>{p.name}</Text>
              <Text style={styles.phaseTheme}>{p.theme}</Text>
            </View>
            {p.name === lunar.name && <Text style={styles.currentBadge}>Maintenant</Text>}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0c1a' },
  hero: { backgroundColor: '#1a1033', padding: 32, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#2d1f5e' },
  heroEmoji: { fontSize: 72, marginBottom: 12 },
  heroPhase: { fontSize: 24, fontWeight: '700', color: '#e2d9f3', marginBottom: 6 },
  heroTheme: { fontSize: 15, color: '#a78bfa', fontStyle: 'italic', marginBottom: 16 },
  progressBg: { width: '80%', height: 6, backgroundColor: '#2d1f5e', borderRadius: 3, marginBottom: 6 },
  progressFill: { height: 6, backgroundColor: '#a78bfa', borderRadius: 3 },
  progressLabel: { fontSize: 12, color: '#6b5ea8' },
  card: { backgroundColor: '#1a1033', margin: 16, marginTop: 8, borderRadius: radius.md, padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#e2d9f3', marginBottom: 14 },
  tipRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tipBullet: { color: '#a78bfa', fontWeight: '700', fontSize: 16 },
  tipItem: { color: '#c4b5fd', fontSize: 14, flex: 1, lineHeight: 22 },
  input: { backgroundColor: '#0f0c1a', borderRadius: radius.md, padding: 14, fontSize: 15, color: '#e2d9f3', minHeight: 80, borderWidth: 1, borderColor: '#2d1f5e' },
  saveBtn: { backgroundColor: '#a78bfa', borderRadius: radius.full, padding: 14, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: colors.white, fontWeight: '700' },
  phaseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderRadius: radius.sm },
  phaseRowActive: { backgroundColor: '#2d1f5e', padding: 10, borderRadius: radius.md },
  phaseEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  phaseInfo: { flex: 1 },
  phaseName: { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  phaseNameActive: { color: '#e2d9f3' },
  phaseTheme: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  currentBadge: { fontSize: 11, color: '#a78bfa', fontWeight: '700', backgroundColor: '#a78bfa22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
});
