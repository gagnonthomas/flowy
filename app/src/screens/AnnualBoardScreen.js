import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStorage } from '../hooks/useStorage';
import { colors, radius, typography, shadow } from '../theme';
import { formatDate, getDayOfYear } from '../utils/lunar';

const MOOD_COLORS = {
  '😫': '#ef4444', '😔': '#f97316', '😐': '#f59e0b', '🙂': '#84cc16', '😄': '#10b981',
};

const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

export default function AnnualBoardScreen() {
  const insets = useSafeAreaInsets();
  const [moods] = useStorage('moods', {});
  const [habits] = useStorage('habits_log', {});
  const year = new Date().getFullYear();
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const totalDays = isLeap ? 366 : 365;
  const todayDoy = getDayOfYear(new Date());

  // Build all days of current year
  const days = useMemo(() => {
    return Array.from({ length: totalDays }).map((_, i) => {
      const d = new Date(year, 0, i + 1);
      const key = formatDate(d);
      const mood = moods[key];
      const habitCount = (habits[key] || []).length;
      return {
        key, day: i + 1, month: d.getMonth(),
        color: mood ? MOOD_COLORS[mood] : habitCount > 0 ? colors.primary + 'aa' : null,
        isToday: i + 1 === todayDoy,
        isFuture: i + 1 > todayDoy,
        mood, habitCount,
      };
    });
  }, [moods, habits, year]);

  // Group by month
  const byMonth = useMemo(() => {
    return MONTHS_FR.map((name, m) => ({ name, days: days.filter(d => d.month === m) }));
  }, [days]);

  const daysLogged = days.filter(d => d.color && !d.isFuture).length;
  const streak = useMemo(() => {
    let count = 0;
    for (let i = todayDoy - 1; i >= 0; i--) {
      if (days[i]?.color) count++;
      else break;
    }
    return count;
  }, [days, todayDoy]);

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Tableau de bord {year}</Text>
        <Text style={styles.sub}>Inspiré des GitHub Contributions</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard value={daysLogged} label="Jours notés" color={colors.primary} />
        <StatCard value={`${Math.round(daysLogged/todayDoy*100)}%`} label="Régularité" color={colors.success} />
        <StatCard value={streak} label="Série actuelle" color={colors.warning} />
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Légende</Text>
        <View style={styles.legendRow}>
          {Object.entries(MOOD_COLORS).map(([e, c]) => (
            <View key={e} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: c }]} />
              <Text style={styles.legendEmoji}>{e}</Text>
            </View>
          ))}
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
            <Text style={styles.legendEmoji}>—</Text>
          </View>
        </View>
      </View>

      {/* Grid by month */}
      {byMonth.map(({ name, days: mDays }) => (
        <View key={name} style={styles.monthBlock}>
          <Text style={styles.monthName}>{name}</Text>
          <View style={styles.monthGrid}>
            {mDays.map(d => (
              <View key={d.key}
                style={[
                  styles.dayDot,
                  { backgroundColor: d.color || (d.isFuture ? 'transparent' : colors.border + '66') },
                  d.isToday && styles.dayToday,
                  d.isFuture && styles.dayFuture,
                ]}
              />
            ))}
          </View>
        </View>
      ))}

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 Comment fonctionne ce tableau</Text>
        <Text style={styles.tipText}>Chaque carré représente un jour de l'année. Sa couleur reflète votre humeur du jour. Plus vous notez régulièrement, plus le tableau devient révélateur de vos patterns annuels.</Text>
      </View>
    </ScrollView>
  );
}

function StatCard({ value, label, color }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { ...typography.h2 },
  sub: { ...typography.caption, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, padding: 16 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, borderTopWidth: 3, ...shadow.sm, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  legend: { backgroundColor: colors.surface, marginHorizontal: 16, borderRadius: radius.md, padding: 12, marginBottom: 8, ...shadow.sm },
  legendTitle: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  legendRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendEmoji: { fontSize: 14 },
  monthBlock: { marginHorizontal: 16, marginBottom: 12 },
  monthName: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  dayDot: { width: 16, height: 16, borderRadius: 3 },
  dayToday: { borderWidth: 2, borderColor: colors.primary },
  dayFuture: { borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  tipCard: { backgroundColor: colors.primary + '15', margin: 16, borderRadius: radius.md, padding: 16, borderLeftWidth: 4, borderLeftColor: colors.primary },
  tipTitle: { fontSize: 13, fontWeight: '700', color: colors.primary, marginBottom: 6 },
  tipText: { fontSize: 13, color: colors.text, lineHeight: 20 },
});
