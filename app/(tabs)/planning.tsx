import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFlowiStore } from '@/store';
import { colors } from '@/constants/colors';
import { getToday, MONTHS_FR, daysInMonth, firstDayOfMonth } from '@/utils/date';
import { useSubTabSwipe } from '@/hooks/useSubTabSwipe';
import { AnimatedSubTab } from '@/components/ui/AnimatedSubTab';
import { useTheme } from '@/hooks/useTheme';
import { useDarkOverrides } from '@/hooks/useDarkOverrides';

const pad = (n: number) => String(n).padStart(2, '0');
const pm = colors.planning;
const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const CAT_COLORS: Record<string, string> = {
  rdv: '#3B82F6', sante: '#10B981', perso: '#8B5CF6', famille: '#F59E0B', tache: '#6B7280',
};

export default function PlanningScreen() {
  const { t } = useTheme();
  const d = useDarkOverrides();
  const TABS = ['semaine', 'calendrier', 'bilan'] as const;
  const [subTab, setSubTab] = useState<'semaine' | 'calendrier' | 'bilan'>('semaine');
  const events = useFlowiStore((s) => s.events);
  const todos = useFlowiStore((s) => s.todos);
  const storeWeekReview = useFlowiStore((s) => s.weekReview);
  const setWeekReview = useFlowiStore((s) => s.setWeekReview);
  const storeMonthReview = useFlowiStore((s) => s.monthReview);
  const setMonthReview = useFlowiStore((s) => s.setMonthReview);
  const weekGoals = useFlowiStore((s) => s.weekGoals);
  const addWeekGoal = useFlowiStore((s) => s.addWeekGoal);
  const toggleWeekGoal = useFlowiStore((s) => s.toggleWeekGoal);
  const deleteWeekGoal = useFlowiStore((s) => s.deleteWeekGoal);
  const monthGoals = useFlowiStore((s) => s.monthGoals);
  const addMonthGoal = useFlowiStore((s) => s.addMonthGoal);
  const toggleMonthGoal = useFlowiStore((s) => s.toggleMonthGoal);
  const deleteMonthGoal = useFlowiStore((s) => s.deleteMonthGoal);
  const today = getToday();
  const [newWeekGoal, setNewWeekGoal] = useState('');
  const [newMonthGoal, setNewMonthGoal] = useState('');

  // ─── Week logic ───
  const [weekOffset, setWeekOffset] = useState(0);
  const now = new Date();
  const dow = (now.getDay() + 6) % 7;
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - dow + i + weekOffset * 7);
    weekDates.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  }
  const fmtShort = (ds: string) =>
    new Date(ds + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  const goWeek = (dir: number) => () => {
    setWeekOffset((o) => o + dir);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // ─── Calendar logic ───
  const [calDate, setCalDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const yr = calDate.getFullYear();
  const mo = calDate.getMonth();
  const totalDays = daysInMonth(yr, mo);
  const firstDow = firstDayOfMonth(yr, mo);

  const goMonth = (dir: number) => () => {
    setCalDate(new Date(yr, mo + dir, 1));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // ─── Swipe gestures ───
  const weekSwipe = Gesture.Pan().activeOffsetX([-20, 20]).failOffsetY([-15, 15])
    .onEnd((e) => { 'worklet'; if (e.translationX < -50) runOnJS(goWeek(1))(); else if (e.translationX > 50) runOnJS(goWeek(-1))(); });
  const calSwipe = Gesture.Pan().activeOffsetX([-20, 20]).failOffsetY([-15, 15])
    .onEnd((e) => { 'worklet'; if (e.translationX < -50) runOnJS(goMonth(1))(); else if (e.translationX > 50) runOnJS(goMonth(-1))(); });

  // ─── Helpers ───
  const eventsFor = (d: string) => events.filter((e) => e.date === d).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const todosFor = (d: string) => todos.filter((t) => t.scheduledDate === d && !t.done);

  // Bilan
  const weekCompleted = todos.filter((t) => t.doneDate && weekDates.includes(t.doneDate)).length;
  const weekEventsCount = events.filter((e) => weekDates.includes(e.date)).length;

  // Calendar grid (flat, 7 per row)
  const calCells: ({ day: number; ds: string; isToday: boolean } | null)[] = [];
  for (let i = 0; i < firstDow; i++) calCells.push(null);
  for (let d = 1; d <= totalDays; d++) {
    const ds = `${yr}-${pad(mo + 1)}-${pad(d)}`;
    calCells.push({ day: d, ds, isToday: ds === today });
  }
  while (calCells.length % 7 !== 0) calCells.push(null);

  return (
    <View style={{ flex: 1, backgroundColor: t.screenBg }}>
      {/* Sub-tabs */}
      <View style={s.tabBar}>
        {(['semaine', 'calendrier', 'bilan'] as const).map((t) => (
          <Pressable key={t} onPress={() => setSubTab(t)} style={[s.tab, d.tab, subTab === t && s.tabActive]}>
            <Text style={[s.tabText, subTab === t && s.tabTextActive]}>
              {t === 'semaine' ? 'Semaine' : t === 'calendrier' ? 'Calendrier' : 'Bilan'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ════════ SEMAINE ════════ */}
        {subTab === 'semaine' && (
          <GestureDetector gesture={weekSwipe}>
            <AnimatedSubTab>
              {/* Nav */}
              <View style={s.nav}>
                <Pressable onPress={goWeek(-1)} style={s.navBtn}>
                  <Text style={s.navIcon}>‹</Text>
                </Pressable>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={s.navTitle}>Semaine du {fmtShort(weekDates[0])}</Text>
                  <Text style={s.navSub}>au {fmtShort(weekDates[6])}</Text>
                </View>
                <Pressable onPress={goWeek(1)} style={s.navBtn}>
                  <Text style={s.navIcon}>›</Text>
                </Pressable>
              </View>

              {/* Scan agenda papier */}
              <Pressable style={s.scanBtn}>
                <Text style={{ fontSize: 14 }}>📷</Text>
                <Text style={s.scanText}>Importer depuis un agenda papier</Text>
              </Pressable>

              {/* Objectifs de la semaine */}
              <View style={s.goalsCard}>
                <Text style={s.goalsTitle}>🎯 Objectifs de la semaine</Text>
                {weekGoals.map((g) => (
                  <View key={g.id} style={s.goalRow}>
                    <Pressable
                      onPress={() => { toggleWeekGoal(g.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                      style={[s.goalCheck, g.done && { backgroundColor: pm.accent, borderColor: pm.accent }]}
                    >
                      {g.done && <Text style={s.goalCheckMark}>✓</Text>}
                    </Pressable>
                    <Text style={[s.goalText, g.done && { color: '#A0A0C0', textDecorationLine: 'line-through' }]}>{g.text}</Text>
                    <Pressable onPress={() => deleteWeekGoal(g.id)}>
                      <Text style={s.goalDelete}>×</Text>
                    </Pressable>
                  </View>
                ))}
                <View style={s.goalAddRow}>
                  <TextInput
                    style={s.goalInput}
                    value={newWeekGoal}
                    onChangeText={setNewWeekGoal}
                    placeholder="Ajouter un objectif..."
                    placeholderTextColor="#C4B5FD"
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      if (newWeekGoal.trim()) { addWeekGoal(newWeekGoal.trim()); setNewWeekGoal(''); }
                    }}
                  />
                  <Pressable
                    onPress={() => { if (newWeekGoal.trim()) { addWeekGoal(newWeekGoal.trim()); setNewWeekGoal(''); } }}
                    style={s.goalAddBtn}
                  >
                    <Text style={s.goalAddBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>

              {/* 7-col grid */}
              <View style={s.grid7}>
                {weekDates.map((wd, wi) => {
                  const isToday = wd === today;
                  const dayEvts = eventsFor(wd);
                  const dayTodos = todosFor(wd);
                  const dayNum = new Date(wd + 'T12:00:00').getDate();
                  return (
                    <View
                      key={wd}
                      style={[
                        s.weekCol,
                        {
                          borderColor: isToday ? pm.accent : '#EEF0F8',
                          backgroundColor: isToday ? pm.light : '#FAFBFF',
                        },
                      ]}
                    >
                      <Text style={[s.weekLetter, isToday && { color: pm.accent }]}>
                        {DAY_LETTERS[wi]}
                      </Text>
                      <Text style={[s.weekNum, isToday && { color: pm.accent }]}>
                        {dayNum}
                      </Text>

                      {dayEvts.slice(0, 2).map((ev) => {
                        const cc = CAT_COLORS[ev.category] || '#6B7280';
                        return (
                          <View key={ev.id} style={[s.weekEvt, { backgroundColor: cc + '15', borderColor: cc + '44' }]}>
                            {ev.time && (
                              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 7, color: cc, lineHeight: 9 }}>
                                {ev.time}
                              </Text>
                            )}
                            <Text
                              numberOfLines={1}
                              style={{
                                fontFamily: 'Inter_600SemiBold',
                                fontSize: 8,
                                color: ev.done ? '#9CA3AF' : cc,
                                lineHeight: 11,
                                textDecorationLine: ev.done ? 'line-through' : 'none',
                              }}
                            >
                              {ev.title}
                            </Text>
                          </View>
                        );
                      })}

                      {dayTodos.slice(0, 2).map((t) => (
                        <View key={t.id} style={s.weekTodo}>
                          <View style={[s.weekDot, { backgroundColor: colors[t.priority] || pm.accent }]} />
                          <Text style={s.weekTodoText} numberOfLines={1}>{t.text}</Text>
                        </View>
                      ))}

                      {dayEvts.length + dayTodos.length === 0 && (
                        <Text style={{ fontSize: 10, color: '#D1D5DB', textAlign: 'center', marginTop: 4 }}>—</Text>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Review */}
              <View style={s.reviewCard}>
                <Text style={s.reviewLabel}>📝 Bilan de la semaine</Text>
                <TextInput
                  style={s.reviewInput}
                  value={storeWeekReview[weekDates[0]] || ''}
                  onChangeText={(v) => setWeekReview(weekDates[0], v)}
                  placeholder="Ce qui a bien fonctionné, ce que j'améliore..."
                  placeholderTextColor="#D2AB75"
                  multiline
                />
              </View>
            </AnimatedSubTab>
          </GestureDetector>
        )}

        {/* ════════ CALENDRIER ════════ */}
        {subTab === 'calendrier' && (
          <GestureDetector gesture={calSwipe}>
            <AnimatedSubTab>
              {/* Nav */}
              <View style={s.nav}>
                <Pressable onPress={goMonth(-1)} style={s.navBtn}>
                  <Text style={s.navIcon}>‹</Text>
                </Pressable>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={[s.navTitle, { textTransform: 'capitalize' }]}>{MONTHS_FR[mo]}</Text>
                  <Text style={s.navSub}>{yr}</Text>
                </View>
                <Pressable onPress={goMonth(1)} style={s.navBtn}>
                  <Text style={s.navIcon}>›</Text>
                </Pressable>
              </View>

              {/* Day headers */}
              <View style={s.grid7row}>
                {DAY_LETTERS.map((d, i) => (
                  <View key={i} style={s.calHeaderCell}>
                    <Text style={[s.calHeaderText, i >= 5 && { color: '#F87171' }]}>{d}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar cells */}
              <View style={s.calContainer}>
                {calCells.map((cell, idx) => {
                  if (!cell) {
                    return <View key={`e${idx}`} style={s.calCellEmpty} />;
                  }
                  const evts = eventsFor(cell.ds);
                  const hasTodos = todosFor(cell.ds).length > 0;
                  const isWE = idx % 7 >= 5;
                  return (
                    <View key={cell.day} style={s.calCell}>
                      <View style={[s.calDayCircle, cell.isToday && { backgroundColor: pm.accent }]}>
                        <Text
                          style={[
                            s.calDayText,
                            {
                              color: cell.isToday ? '#FFF' : isWE ? '#F87171' : '#3D4A6A',
                              fontWeight: cell.isToday ? '800' : '500',
                            },
                          ]}
                        >
                          {cell.day}
                        </Text>
                      </View>
                      {/* Indicators */}
                      <View style={s.calDots}>
                        {evts.length > 0 && <View style={[s.calDot, { backgroundColor: colors.agenda.accent }]} />}
                        {hasTodos && <View style={[s.calDot, { backgroundColor: colors.todos.accent }]} />}
                      </View>
                      {/* First event pill */}
                      {evts.length > 0 && (
                        <View style={[s.calEvtPill, { backgroundColor: (CAT_COLORS[evts[0].category] || '#6B7280') + '18' }]}>
                          <Text style={[s.calEvtText, { color: CAT_COLORS[evts[0].category] || '#6B7280' }]} numberOfLines={1}>
                            {evts[0].title}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </AnimatedSubTab>
          </GestureDetector>
        )}

        {/* ════════ BILAN ════════ */}
        {subTab === 'bilan' && (
          <AnimatedSubTab>
            {/* Nav */}
            <View style={s.nav}>
              <Pressable onPress={goWeek(-1)} style={s.navBtn}>
                <Text style={s.navIcon}>‹</Text>
              </Pressable>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={s.navTitle}>Semaine du {fmtShort(weekDates[0])}</Text>
                <Text style={s.navSub}>au {fmtShort(weekDates[6])}</Text>
              </View>
              <Pressable onPress={goWeek(1)} style={s.navBtn}>
                <Text style={s.navIcon}>›</Text>
              </Pressable>
            </View>

            {/* Stat cards */}
            <View style={s.bilanRow}>
              <View style={[s.bilanCard, { borderColor: pm.border, backgroundColor: pm.light }]}>
                <Text style={s.bilanNum}>{weekCompleted}</Text>
                <Text style={s.bilanLabel}>tâches complétées</Text>
              </View>
              <View style={[s.bilanCard, { borderColor: colors.agenda.border, backgroundColor: colors.agenda.light }]}>
                <Text style={[s.bilanNum, { color: colors.agenda.accent }]}>{weekEventsCount}</Text>
                <Text style={s.bilanLabel}>rendez-vous</Text>
              </View>
            </View>

            {/* Scan agenda papier */}
            <Pressable style={s.scanBtn}>
              <Text style={{ fontSize: 14 }}>📷</Text>
              <Text style={s.scanText}>Importer depuis un agenda papier</Text>
            </Pressable>

            {/* Objectifs du mois */}
            <View style={[s.goalsCard, { marginBottom: 12 }]}>
              <Text style={s.goalsTitle}>🎯 Objectifs du mois</Text>
              {monthGoals.map((g) => (
                <View key={g.id} style={[s.monthGoalCard, g.done && { backgroundColor: pm.light + '88', borderColor: pm.border }]}>
                  <View style={s.goalRow}>
                    <Pressable
                      onPress={() => { toggleMonthGoal(g.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                      style={[s.monthGoalCheck, g.done && { backgroundColor: pm.accent, borderColor: pm.accent }]}
                    >
                      {g.done && <Text style={s.goalCheckMark}>✓</Text>}
                    </Pressable>
                    <Text style={[s.monthGoalText, g.done && { color: '#A0A0C0', textDecorationLine: 'line-through' }]}>{g.text}</Text>
                    <Pressable onPress={() => deleteMonthGoal(g.id)}>
                      <Text style={s.goalDelete}>×</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
              <View style={s.goalAddRow}>
                <TextInput
                  style={s.goalInput}
                  value={newMonthGoal}
                  onChangeText={setNewMonthGoal}
                  placeholder="Nouvel objectif du mois..."
                  placeholderTextColor="#C4B5FD"
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    if (newMonthGoal.trim()) { addMonthGoal(newMonthGoal.trim()); setNewMonthGoal(''); }
                  }}
                />
                <Pressable
                  onPress={() => { if (newMonthGoal.trim()) { addMonthGoal(newMonthGoal.trim()); setNewMonthGoal(''); } }}
                  style={s.goalAddBtn}
                >
                  <Text style={s.goalAddBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* Review */}
            {(() => {
              const monthKey = `${yr}-${pad(mo + 1)}`;
              const review = storeMonthReview[monthKey] || { wins: '', improve: '', focus: '' };
              const fields: [string, string, 'wins' | 'improve' | 'focus'][] = [
                ['✅ Ce que j\'ai accompli', '#059669', 'wins'],
                ['🔄 Ce que j\'améliore', '#F59E0B', 'improve'],
                ['🎯 Mon intention pour la suite', '#6366F1', 'focus'],
              ];
              return (
            <View style={s.bilanReview}>
              <View style={s.bilanReviewHead}>
                <Text style={s.bilanReviewHeadText}>📝 Bilan du mois</Text>
              </View>
              {fields.map(([label, color, field]) => (
                <View key={field} style={s.bilanSection}>
                  <Text style={[s.bilanSectionLabel, { color }]}>{label}</Text>
                  <TextInput
                    style={s.bilanSectionInput}
                    value={review[field]}
                    onChangeText={(v) => setMonthReview(monthKey, field, v)}
                    placeholder="..."
                    placeholderTextColor="#D1D5DB"
                    multiline
                  />
                </View>
              ))}
            </View>
              );
            })()}
          </AnimatedSubTab>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  // Tabs
  tabBar: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 },
  tab: {
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12,
    backgroundColor: '#FAFBFF', borderWidth: 1.5, borderColor: '#E8EDF5',
  },
  tabActive: { backgroundColor: pm.light, borderColor: pm.accent },
  tabText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#9CA3AF' },
  tabTextActive: { fontFamily: 'Inter_700Bold', color: pm.accent },

  scroll: { paddingHorizontal: 14, paddingBottom: 40 },

  // Shared nav
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10, paddingHorizontal: 2,
  },
  navBtn: {
    width: 28, height: 28, borderRadius: 7, borderWidth: 1.5,
    borderColor: pm.border, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
  },
  navIcon: { fontSize: 16, color: pm.accent, fontWeight: '700', lineHeight: 20 },
  navTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 13, color: pm.accent, lineHeight: 17 },
  navSub: { fontFamily: 'Inter_400Regular', fontSize: 9, color: '#B0A090', marginTop: 1 },

  // Scan button
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, marginBottom: 10, paddingVertical: 7, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: pm.border, backgroundColor: pm.light,
  },
  scanText: {
    fontFamily: 'Inter_600SemiBold', fontSize: 11, color: pm.text,
  },

  // Goals (shared)
  goalsCard: {
    marginBottom: 10, padding: 10, paddingHorizontal: 12,
    borderRadius: 12, backgroundColor: pm.light,
    borderWidth: 1.5, borderColor: pm.border,
  },
  goalsTitle: {
    fontFamily: 'Inter_700Bold', fontSize: 10, color: pm.text,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
  },
  goalRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4,
  },
  goalCheck: {
    width: 18, height: 18, borderRadius: 5, borderWidth: 2,
    borderColor: '#C4B5FD', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  goalCheckMark: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  goalText: {
    fontFamily: 'Inter_600SemiBold', fontSize: 13, color: pm.text, flex: 1,
  },
  goalDelete: { fontSize: 14, color: '#CCC', paddingHorizontal: 4 },
  goalAddRow: {
    flexDirection: 'row', gap: 6, marginTop: 4,
  },
  goalInput: {
    flex: 1, borderWidth: 1.5, borderColor: pm.border, borderRadius: 8,
    paddingVertical: 5, paddingHorizontal: 9, fontSize: 12,
    fontFamily: 'Inter_400Regular', backgroundColor: '#FFFFFF', color: pm.text,
  },
  goalAddBtn: {
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 8,
    backgroundColor: pm.accent, alignItems: 'center', justifyContent: 'center',
  },
  goalAddBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  // Month goal card
  monthGoalCard: {
    marginBottom: 8, padding: 8, paddingHorizontal: 10, borderRadius: 10,
    backgroundColor: '#FAFBFF', borderWidth: 1.5, borderColor: '#E8EDF5',
  },
  monthGoalCheck: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 2,
    borderColor: '#FCA5A5', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  monthGoalText: {
    fontFamily: 'Inter_700Bold', fontSize: 13, color: pm.text, flex: 1,
  },

  // ── Semaine: 7-col ──
  grid7: {
    flexDirection: 'row', gap: 3, marginBottom: 10,
  },
  weekCol: {
    flex: 1, borderRadius: 8, borderWidth: 1.5,
    paddingVertical: 4, paddingHorizontal: 2, minHeight: 80,
    alignItems: 'center',
  },
  weekLetter: {
    fontFamily: 'Inter_700Bold', fontSize: 9, color: '#8090B0',
    textTransform: 'uppercase', letterSpacing: 0.3, textAlign: 'center',
  },
  weekNum: {
    fontFamily: 'Inter_700Bold', fontSize: 13, color: '#3D4A6A',
    textAlign: 'center', marginBottom: 3,
  },
  weekEvt: {
    width: '100%', marginBottom: 2, padding: 2, paddingHorizontal: 3,
    borderRadius: 4, borderWidth: 1, overflow: 'hidden',
  },
  weekTodo: {
    flexDirection: 'row', gap: 2, alignItems: 'center',
    width: '100%', marginBottom: 1,
  },
  weekDot: { width: 4, height: 4, borderRadius: 2, flexShrink: 0 },
  weekTodoText: {
    fontFamily: 'Inter_400Regular', fontSize: 8, color: '#3D4A6A',
    lineHeight: 11, flex: 1,
  },

  // Review
  reviewCard: {
    borderRadius: 10, backgroundColor: '#FFFBF0',
    borderWidth: 1.5, borderColor: '#FDE68A', padding: 10,
  },
  reviewLabel: {
    fontFamily: 'Inter_700Bold', fontSize: 10, color: '#92400E',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
  },
  reviewInput: {
    fontFamily: 'Inter_400Regular', fontSize: 12, color: '#92400E',
    lineHeight: 19, textAlignVertical: 'top', minHeight: 36, padding: 0,
  },

  // ── Calendrier ──
  grid7row: { flexDirection: 'row', marginBottom: 4, paddingHorizontal: 2 },
  calHeaderCell: { flex: 1, alignItems: 'center' },
  calHeaderText: {
    fontFamily: 'Inter_700Bold', fontSize: 9, color: '#B0A090',
    textAlign: 'center',
  },
  calContainer: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 2,
  },
  calCellEmpty: { width: `${100 / 7}%`, aspectRatio: 0.85, padding: 2 },
  calCell: {
    width: `${100 / 7}%`, aspectRatio: 0.85,
    alignItems: 'center', padding: 2, paddingTop: 3,
  },
  calDayCircle: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  calDayText: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 13 },
  calDots: { flexDirection: 'row', gap: 2, marginTop: 1 },
  calDot: { width: 4, height: 4, borderRadius: 2 },
  calEvtPill: {
    width: '100%', marginTop: 1, paddingVertical: 1, paddingHorizontal: 2,
    borderRadius: 3, overflow: 'hidden',
  },
  calEvtText: { fontFamily: 'Inter_600SemiBold', fontSize: 7, lineHeight: 10 },

  // ── Bilan ──
  bilanRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  bilanCard: {
    flex: 1, borderRadius: 12, borderWidth: 1.5,
    padding: 16, alignItems: 'center',
  },
  bilanNum: {
    fontFamily: 'PlayfairDisplay_700Bold', fontSize: 32,
    color: pm.accent, lineHeight: 36,
  },
  bilanLabel: {
    fontFamily: 'Inter_400Regular', fontSize: 11,
    color: '#9CA3AF', marginTop: 4,
  },
  bilanReview: {
    borderRadius: 12, borderWidth: 1.5, borderColor: '#FCA5A5', overflow: 'hidden',
  },
  bilanReviewHead: {
    backgroundColor: pm.light, paddingVertical: 8, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: '#FCA5A5',
  },
  bilanReviewHeadText: {
    fontFamily: 'Inter_700Bold', fontSize: 10, color: pm.text,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  bilanSection: {
    paddingVertical: 8, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: '#FEE2E2',
  },
  bilanSectionLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, marginBottom: 4 },
  bilanSectionInput: {
    fontFamily: 'Inter_400Regular', fontSize: 12, color: '#374151',
    lineHeight: 19, textAlignVertical: 'top', minHeight: 28, padding: 0,
  },
});
