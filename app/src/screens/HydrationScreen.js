import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStorage } from '../hooks/useStorage';
import { colors, radius, shadow, typography } from '../theme';
import { today, formatDate } from '../utils/lunar';

const GOAL = 8;

export default function HydrationScreen() {
  const insets = useSafeAreaInsets();
  const [hydration, setHydration] = useStorage('water', {});
  const todayKey = today();
  const count = hydration[todayKey] || 0;
  const pct = Math.min(count / GOAL, 1);

  const add = () => setHydration(p => ({ ...p, [todayKey]: Math.min((p[todayKey]||0) + 1, 20) }));
  const remove = () => setHydration(p => ({ ...p, [todayKey]: Math.max((p[todayKey]||0) - 1, 0) }));

  const last7 = Array.from({length:7}).map((_,i) => {
    const d = new Date(); d.setDate(d.getDate()-(6-i));
    const k = formatDate(d);
    return { key: k, day: d.toLocaleDateString('fr-FR',{weekday:'short'}).slice(0,3), count: hydration[k] || 0 };
  });

  const status = count === 0 ? { msg: 'Commencez la journée avec un verre d\'eau 💧', color: colors.textMuted }
    : count < 3 ? { msg: 'Buvez plus, votre corps en a besoin !', color: colors.danger }
    : count < GOAL ? { msg: `Bien ! Plus que ${GOAL - count} verre${GOAL - count > 1 ? 's' : ''}.`, color: colors.warning }
    : { msg: 'Objectif atteint ! Excellent ! 🎉', color: colors.success };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={{ paddingBottom: 80 }}>
      <Text style={styles.title}>💧 Hydratation</Text>

      {/* Big counter */}
      <View style={styles.mainCard}>
        <View style={styles.glassVisual}>
          <View style={[styles.glassFill, { height: `${pct * 100}%` }]} />
          <Text style={styles.glassCount}>{count}</Text>
        </View>
        <Text style={styles.goal}>/ {GOAL} verres</Text>
        <Text style={[styles.status, { color: status.color }]}>{status.msg}</Text>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.removeBtn} onPress={remove}>
            <Text style={styles.removeBtnText}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={add}>
            <Text style={styles.addBtnText}>💧 +1 verre</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Glasses visual */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Verres du jour</Text>
        <View style={styles.glassesRow}>
          {Array.from({length: GOAL}).map((_, i) => (
            <Text key={i} style={[styles.glassIcon, i < count ? styles.glassFull : styles.glassEmpty]}>💧</Text>
          ))}
        </View>
      </View>

      {/* 7-day chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Les 7 derniers jours</Text>
        <View style={styles.chartRow}>
          {last7.map(d => (
            <View key={d.key} style={styles.chartCol}>
              <Text style={styles.chartVal}>{d.count}</Text>
              <View style={styles.chartBarBg}>
                <View style={[styles.chartBar, { height: `${Math.min(d.count / GOAL, 1) * 100}%` }]} />
              </View>
              <Text style={styles.chartDay}>{d.day}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 Conseils</Text>
        <Text style={styles.tipText}>• Posez une bouteille d'eau sur votre bureau{'\n'}• Buvez un verre à chaque prise de médicament{'\n'}• Configurez des rappels toutes les 2h dans vos paramètres</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { ...typography.h2, padding: 20, paddingBottom: 8 },
  mainCard: { backgroundColor: colors.surface, margin: 16, marginTop: 8, borderRadius: radius.md, padding: 24, alignItems: 'center', ...shadow.md },
  glassVisual: { width: 100, height: 140, backgroundColor: colors.info + '22', borderRadius: radius.md, borderWidth: 2, borderColor: colors.info, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 12, position: 'relative' },
  glassFill: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.info + '66' },
  glassCount: { fontSize: 48, fontWeight: '800', color: colors.info, position: 'relative', zIndex: 1 },
  goal: { fontSize: 18, color: colors.textMuted, fontWeight: '600', marginBottom: 8 },
  status: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 20 },
  btnRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  removeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { fontSize: 24, color: colors.textMuted, fontWeight: '700' },
  addBtn: { backgroundColor: colors.info, borderRadius: radius.full, paddingHorizontal: 24, paddingVertical: 12 },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  card: { backgroundColor: colors.surface, margin: 16, marginTop: 0, borderRadius: radius.md, padding: 16, ...shadow.sm },
  cardTitle: { ...typography.h3, marginBottom: 14 },
  glassesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  glassIcon: { fontSize: 28 },
  glassFull: { opacity: 1 },
  glassEmpty: { opacity: 0.2 },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100 },
  chartCol: { alignItems: 'center', flex: 1 },
  chartVal: { fontSize: 11, fontWeight: '700', color: colors.info, marginBottom: 4 },
  chartBarBg: { width: 20, height: 60, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  chartBar: { backgroundColor: colors.info, borderRadius: 4 },
  chartDay: { fontSize: 10, color: colors.textMuted, marginTop: 4, textTransform: 'capitalize' },
  tipCard: { backgroundColor: colors.info + '15', margin: 16, marginTop: 0, borderRadius: radius.md, padding: 16, borderLeftWidth: 4, borderLeftColor: colors.info },
  tipTitle: { fontSize: 13, fontWeight: '700', color: colors.info, marginBottom: 8 },
  tipText: { fontSize: 13, color: colors.text, lineHeight: 22 },
});
