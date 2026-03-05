import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, typography } from '../theme';

const SECTIONS = [
  {
    title: '🌙 Rythme de vie',
    items: [
      { emoji: '💭', label: 'Journal des rêves', screen: 'DreamJournal', desc: 'Capturer ses rêves au réveil' },
      { emoji: '😴', label: 'Suivi du sommeil', screen: 'Sleep', desc: 'Qualité et horaires de sommeil' },
      { emoji: '🌙', label: 'Cycle lunaire', screen: 'LunarScreen', desc: 'Phase lunaire & intentions' },
    ],
  },
  {
    title: '⚡ Énergie & Corps',
    items: [
      { emoji: '🔋', label: 'Energy Monitor', screen: 'EnergyMonitor', desc: 'Matin / midi / soir' },
      { emoji: '💧', label: 'Hydratation', screen: 'Hydration', desc: 'Compteur de verres d\'eau' },
      { emoji: '🌸', label: 'Cycle menstruel', screen: 'Cycle', desc: 'Phases & conseils planning' },
    ],
  },
  {
    title: '🎯 Objectifs',
    items: [
      { emoji: '🔥', label: 'Défis 30 jours', screen: 'Challenges', desc: 'Ne cassez pas la chaîne' },
      { emoji: '🗺️', label: 'Tableau 365 jours', screen: 'AnnualBoard', desc: 'Vue GitHub-style de l\'année' },
      { emoji: '📖', label: 'Revue hebdomadaire', screen: 'WeeklyReview', desc: '7 questions guidées chaque dimanche' },
    ],
  },
  {
    title: '🧠 Productivité',
    items: [
      { emoji: '🔍', label: 'Audit du temps', screen: 'TimeAudit', desc: 'Ce que vous faites vraiment' },
      { emoji: '🛟', label: 'Mode mauvais jour', screen: 'BadDayMode', desc: 'Interface simplifiée & bienveillante' },
    ],
  },
  {
    title: '💭 Émotionnel',
    items: [
      { emoji: '🧰', label: 'Kit de secours', screen: 'EmergencyKit', desc: 'Préparé à l\'avance pour les crises' },
      { emoji: '🫙', label: 'Bocal à souvenirs', screen: 'Jar', desc: 'Moments de joie quotidiens' },
      { emoji: '✉️', label: 'Lettre à moi-même', screen: 'Letter', desc: 'Capsule temporelle 3-12 mois' },
      { emoji: '🫁', label: 'Respiration guidée', screen: 'Breathing', desc: '3 techniques avec animation' },
    ],
  },
  {
    title: '🌍 Vie pratique',
    items: [
      { emoji: '✈️', label: 'Planificateur voyage', screen: 'Travel', desc: 'Itinéraire + liste de valise' },
      { emoji: '💌', label: 'Tracker relations', screen: 'Relationships', desc: 'Rappels de contact doux' },
    ],
  },
  {
    title: '🎨 Créativité',
    items: [
      { emoji: '🌅', label: 'Inspiration du jour', screen: 'Inspiration', desc: 'Citation personnalisée chaque matin' },
      { emoji: '🖍️', label: 'Journal créatif', screen: 'CreativeJournal', desc: 'Espace d\'expression libre' },
    ],
  },
];

export default function MoreScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={styles.title}>☰ Explorer</Text>
      {SECTIONS.map(sec => (
        <View key={sec.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{sec.title}</Text>
          {sec.items.map(item => (
            <TouchableOpacity key={item.screen} style={styles.item} onPress={() => navigation.navigate(item.screen)}>
              <Text style={styles.itemEmoji}>{item.emoji}</Text>
              <View style={styles.itemContent}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <Text style={styles.itemDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { ...typography.h2, padding: 20, paddingBottom: 8 },
  section: { backgroundColor: colors.surface, margin: 16, marginTop: 8, borderRadius: radius.md, overflow: 'hidden', ...shadow.sm },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.6, padding: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  item: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemEmoji: { fontSize: 24, width: 36, textAlign: 'center' },
  itemContent: { flex: 1 },
  itemLabel: { ...typography.body, fontWeight: '600' },
  itemDesc: { ...typography.caption, marginTop: 2 },
});
