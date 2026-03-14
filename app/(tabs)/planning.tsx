import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useFlowiStore } from '@/store';
import { colors, CATEGORIES } from '@/constants/colors';
import {
  getToday, MONTHS_FR, DAYS_FR,
  daysInMonth, firstDayOfMonth,
} from '@/utils/date';

type SubTab = 'semaine' | 'calendrier' | 'bilan';

export default function PlanningScreen() {
  const [subTab, setSubTab] = useState<SubTab>('semaine');
  const events = useFlowiStore((s) => s.events);
  const todos = useFlowiStore((s) => s.todos);
  const today = getToday();

  // Week view: current week Mon-Sun
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // Mon=0
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - dayOfWeek + i);
    weekDates.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    );
  }

  // Calendar view
  const [calDate, setCalDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const yr = calDate.getFullYear();
  const mo = calDate.getMonth();
  const days = daysInMonth(yr, mo);
  const offset = firstDayOfMonth(yr, mo);

  const eventsForDate = (d: string) => events.filter((e) => e.date === d);
  const todosForDate = (d: string) => todos.filter((t) => t.scheduledDate === d);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Planning</Text>
        <View style={styles.tabs}>
          {(['semaine', 'calendrier', 'bilan'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, subTab === t && styles.tabActive]}
              onPress={() => setSubTab(t)}
            >
              <Text style={[styles.tabText, subTab === t && styles.tabTextActive]}>
                {t === 'semaine' ? 'Semaine' : t === 'calendrier' ? 'Calendrier' : 'Bilan'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {subTab === 'semaine' && (
          <Animated.View entering={FadeIn.duration(300)}>
            {weekDates.map((date, i) => {
              const dayEvents = eventsForDate(date);
              const dayTodos = todosForDate(date);
              const isToday = date === today;
              const dayNum = parseInt(date.split('-')[2], 10);
              return (
                <View key={date} style={[styles.dayRow, isToday && styles.dayRowToday]}>
                  <View style={styles.dayLabel}>
                    <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                      {DAYS_FR[i]}
                    </Text>
                    <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>
                      {dayNum}
                    </Text>
                  </View>
                  <View style={styles.dayContent}>
                    {dayEvents.map((ev) => (
                      <View key={ev.id} style={[styles.chip, { backgroundColor: CATEGORIES[ev.category]?.bg }]}>
                        <Text style={[styles.chipText, { color: CATEGORIES[ev.category]?.color }]} numberOfLines={1}>
                          {ev.time ? `${ev.time} ` : ''}{ev.title}
                        </Text>
                      </View>
                    ))}
                    {dayTodos.filter((t) => !t.done).slice(0, 3).map((t) => (
                      <View key={t.id} style={styles.miniTodo}>
                        <View style={[styles.miniDot, { backgroundColor: colors[t.priority] }]} />
                        <Text style={styles.miniText} numberOfLines={1}>{t.text}</Text>
                      </View>
                    ))}
                    {dayEvents.length === 0 && dayTodos.filter((t) => !t.done).length === 0 && (
                      <Text style={styles.emptyDay}>—</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </Animated.View>
        )}

        {subTab === 'calendrier' && (
          <Animated.View entering={FadeIn.duration(300)}>
            <View style={styles.calNav}>
              <TouchableOpacity onPress={() => setCalDate(new Date(yr, mo - 1, 1))}>
                <Text style={styles.calArrow}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.calMonth}>{MONTHS_FR[mo]} {yr}</Text>
              <TouchableOpacity onPress={() => setCalDate(new Date(yr, mo + 1, 1))}>
                <Text style={styles.calArrow}>›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.calHeader}>
              {DAYS_FR.map((d) => (
                <Text key={d} style={styles.calHeaderCell}>{d}</Text>
              ))}
            </View>
            <View style={styles.calGrid}>
              {Array.from({ length: offset }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.calCell} />
              ))}
              {Array.from({ length: days }).map((_, i) => {
                const d = i + 1;
                const dateStr = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const hasEvents = eventsForDate(dateStr).length > 0;
                const hasTodos = todosForDate(dateStr).filter((t) => !t.done).length > 0;
                const isT = dateStr === today;
                return (
                  <View key={d} style={[styles.calCell, isT && styles.calCellToday]}>
                    <Text style={[styles.calDay, isT && styles.calDayToday]}>{d}</Text>
                    <View style={styles.calDots}>
                      {hasEvents && <View style={[styles.calDot, { backgroundColor: colors.agenda.accent }]} />}
                      {hasTodos && <View style={[styles.calDot, { backgroundColor: colors.todos.accent }]} />}
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {subTab === 'bilan' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.bilanContainer}>
            <Text style={styles.bilanTitle}>Bilan de la semaine</Text>
            <View style={styles.bilanCard}>
              <Text style={styles.bilanStat}>
                {todos.filter((t) => t.doneDate && weekDates.includes(t.doneDate)).length}
              </Text>
              <Text style={styles.bilanLabel}>tâches complétées</Text>
            </View>
            <View style={styles.bilanCard}>
              <Text style={styles.bilanStat}>
                {events.filter((e) => weekDates.includes(e.date)).length}
              </Text>
              <Text style={styles.bilanLabel}>rendez-vous</Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.text, marginBottom: 12 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.planning.light, borderColor: colors.planning.accent },
  tabText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted },
  tabTextActive: { fontFamily: 'Inter_600SemiBold', color: colors.planning.accent },
  scroll: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  // Week view
  dayRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  dayRowToday: { backgroundColor: colors.planning.light, borderRadius: 10, marginHorizontal: -8, paddingHorizontal: 8 },
  dayLabel: { width: 50, alignItems: 'center' },
  dayName: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.muted },
  dayNameToday: { color: colors.planning.accent },
  dayNum: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.text },
  dayNumToday: { color: colors.planning.accent },
  dayContent: { flex: 1, paddingLeft: 12, gap: 4 },
  chip: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, alignSelf: 'flex-start' },
  chipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  miniTodo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniDot: { width: 6, height: 6, borderRadius: 3 },
  miniText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text },
  emptyDay: { fontSize: 13, color: colors.muted },
  // Calendar
  calNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  calArrow: { fontSize: 28, color: colors.planning.accent, paddingHorizontal: 12 },
  calMonth: { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: colors.text },
  calHeader: { flexDirection: 'row' },
  calHeaderCell: { flex: 1, textAlign: 'center', fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.muted, marginBottom: 8 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  calCellToday: { backgroundColor: colors.planning.light, borderRadius: 10 },
  calDay: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text },
  calDayToday: { fontFamily: 'Inter_700Bold', color: colors.planning.accent },
  calDots: { flexDirection: 'row', gap: 3, marginTop: 2 },
  calDot: { width: 4, height: 4, borderRadius: 2 },
  // Bilan
  bilanContainer: { gap: 12 },
  bilanTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.text, marginBottom: 8 },
  bilanCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  bilanStat: { fontSize: 36, fontFamily: 'Inter_700Bold', color: colors.planning.accent },
  bilanLabel: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.muted, marginTop: 4 },
});
