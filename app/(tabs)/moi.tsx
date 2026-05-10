import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFlowiStore } from '@/store';
import { BreathingTimer } from '@/components/ui/BreathingTimer';
import { MeditationTimer } from '@/components/ui/MeditationTimer';
import { SwipeTask } from '@/components/ui/SwipeTask';
import { colors } from '@/constants/colors';
import { getToday, getEnergySlot } from '@/utils/date';
import { useSubTabSwipe } from '@/hooks/useSubTabSwipe';
import { GestureDetector } from 'react-native-gesture-handler';
import { AnimatedSubTab } from '@/components/ui/AnimatedSubTab';
import { StaggeredItem } from '@/components/ui/StaggeredItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useDarkOverrides } from '@/hooks/useDarkOverrides';

const pad = (n: number) => String(n).padStart(2, '0');
const mo = colors.moi;

const ENERGY_LEVELS: [string, string, number][] = [
  ['🪫', 'Épuisé', 1], ['⚡', 'Faible', 2], ['🔋', 'Moyen', 3], ['🔥', 'Élevé', 4], ['💥', 'Maximum', 5],
];
const WORKOUT_TYPES = ['🏃 Course', '🚴 Vélo', '💪 Muscu', '🧘 Yoga', '🏊 Natation', '🚶 Marche', '⚽ Sport', '🤸 Stretching'];
const DEFI_DURATIONS = [7, 14, 21, 30, 66, 100];

type SubTab = 'sante' | 'respiration' | 'meditation' | 'defis';

export default function MoiScreen() {
  const [subTab, setSubTab] = useState<SubTab>('sante');
  const energyLog = useFlowiStore((s) => s.energyLog);
  const setEnergy = useFlowiStore((s) => s.setEnergy);
  const waterLog = useFlowiStore((s) => s.waterLog);
  const setWater = useFlowiStore((s) => s.setWater);
  const habits = useFlowiStore((s) => s.habits);
  const toggleHabit = useFlowiStore((s) => s.toggleHabit);
  const deleteHabit = useFlowiStore((s) => s.deleteHabit);
  const addHabit = useFlowiStore((s) => s.addHabit);
  const defis = useFlowiStore((s) => s.defis);
  const addDefi = useFlowiStore((s) => s.addDefi);
  const toggleDefiDay = useFlowiStore((s) => s.toggleDefiDay);
  const deleteDefi = useFlowiStore((s) => s.deleteDefi);
  const workouts = useFlowiStore((s) => s.workouts);
  const addWorkout = useFlowiStore((s) => s.addWorkout);
  const { t } = useTheme();
  const d = useDarkOverrides();
  const TABS = ['sante', 'respiration', 'meditation', 'defis'] as const;
  const tabSwipe = useSubTabSwipe(TABS, subTab, setSubTab as any);
  const today = getToday();
  const slot = getEnergySlot();
  const energyKey = `${today}-${slot}`;
  const currentEnergy = energyLog[energyKey] || 0;
  const waterToday = waterLog[today] || 0;
  const todayWorkouts = workouts.filter((w) => w.date === today);

  const [newHabitText, setNewHabitText] = useState('');
  const [newGratitude, setNewGratitude] = useState('');
  const storeGratitude = useFlowiStore((s) => s.gratitude);
  const addGratitude = useFlowiStore((s) => s.addGratitude);
  const removeGratitude = useFlowiStore((s) => s.removeGratitude);
  const gratitudeList = storeGratitude[today] || [];
  const [newDefiText, setNewDefiText] = useState('');
  const [newDefiDays, setNewDefiDays] = useState(30);
  const [workoutType, setWorkoutType] = useState('');
  const [workoutDur, setWorkoutDur] = useState('');

  const dateLabel = new Date(today + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

  return (
    <View style={{ flex: 1, backgroundColor: t.screenBg }}>
      {/* Sub-tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll} contentContainerStyle={s.tabBar}>
        {(['sante', 'respiration', 'meditation', 'defis'] as const).map((t) => (
          <Pressable key={t} onPress={() => setSubTab(t)} style={[s.tab, d.tab, subTab === t && s.tabActive]}>
            <Text style={[s.tabText, subTab === t && s.tabTextActive]}>
              {t === 'sante' ? 'Santé' : t === 'respiration' ? 'Respiration' : t === 'meditation' ? 'Méditation' : 'Défis'}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <GestureDetector gesture={tabSwipe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ═══ SANTÉ ═══ */}
        {subTab === 'sante' && (
          <AnimatedSubTab key="sante">
            {/* Énergie */}
            <Text style={s.sectionLabel}>Niveau d'énergie</Text>
            <View style={s.energyRow}>
              {ENERGY_LEVELS.map(([emoji, label, val]) => {
                const sel = currentEnergy === val;
                return (
                  <Pressable
                    key={val}
                    onPress={() => { setEnergy(energyKey, val); setEnergy(today, val); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={[s.energyBtn, { borderColor: sel ? mo.accent : '#E8EDF5', backgroundColor: sel ? mo.light : '#F8FAFF' }]}
                  >
                    <Text style={{ fontSize: 18 }}>{emoji}</Text>
                    <Text style={[s.energyLabel, { color: sel ? mo.text : '#8090B0' }]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={s.divider} />

            {/* Habitudes */}
            <Text style={s.sectionLabel}>Habitudes du {dateLabel}</Text>
            {habits.map((h) => {
              const done = h.done[today];
              return (
                <SwipeTask key={h.id} onComplete={done ? undefined : () => toggleHabit(h.id, today)} onDelete={() => deleteHabit(h.id)}>
                  <Pressable
                    onPress={() => { toggleHabit(h.id, today); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={[s.habitRow, { backgroundColor: done ? mo.light : '#F8FAFF', borderColor: done ? mo.border : '#E8EDF5' }]}
                  >
                    <Text style={{ fontSize: 20 }}>{h.icon}</Text>
                    <Text style={[s.habitLabel, { color: done ? mo.text : '#3D4A6A', textDecorationLine: done ? 'line-through' : 'none' }]}>{h.label}</Text>
                    <View style={[s.habitCheck, done && { backgroundColor: mo.accent, borderColor: mo.accent }]}>
                      {done && <Text style={s.habitCheckMark}>✓</Text>}
                    </View>
                  </Pressable>
                </SwipeTask>
              );
            })}
            <View style={s.addRow}>
              <TextInput
                style={s.addInput}
                value={newHabitText}
                onChangeText={setNewHabitText}
                placeholder="Ajouter une habitude..."
                placeholderTextColor="#B0B8C8"
                returnKeyType="done"
                onSubmitEditing={() => { if (newHabitText.trim()) { addHabit(newHabitText.trim(), '⭐'); setNewHabitText(''); } }}
              />
              <Pressable onPress={() => { if (newHabitText.trim()) { addHabit(newHabitText.trim(), '⭐'); setNewHabitText(''); } }} style={s.addBtn}>
                <Text style={s.addBtnText}>+</Text>
              </Pressable>
            </View>

            <View style={s.divider} />

            {/* Gratitude */}
            <Text style={s.sectionLabel}>Gratitude du jour</Text>
            <View style={s.addRow}>
              <TextInput
                style={s.addInput}
                value={newGratitude}
                onChangeText={setNewGratitude}
                placeholder="Je suis reconnaissant(e) pour..."
                placeholderTextColor="#B0B8C8"
                returnKeyType="done"
                onSubmitEditing={() => { if (newGratitude.trim()) { addGratitude(today, newGratitude.trim()); setNewGratitude(''); } }}
              />
              <Pressable onPress={() => { if (newGratitude.trim()) { addGratitude(today, newGratitude.trim()); setNewGratitude(''); } }} style={s.addBtn}>
                <Text style={s.addBtnText}>+</Text>
              </Pressable>
            </View>
            {gratitudeList.map((g, i) => (
              <View key={i} style={s.gratitudeRow}>
                <Text style={{ fontSize: 14, marginTop: 1 }}>🙏</Text>
                <Text style={s.gratitudeText}>{g}</Text>
                <Pressable onPress={() => removeGratitude(today, i)}>
                  <Text style={{ fontSize: 14, color: '#CCC' }}>×</Text>
                </Pressable>
              </View>
            ))}

            <View style={s.divider} />

            {/* Hydratation */}
            <Text style={s.sectionLabel}>Hydratation</Text>
            <View style={s.waterRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
                const filled = waterToday >= n;
                return (
                  <Pressable
                    key={n}
                    onPress={() => { setWater(today, n); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={[s.waterBtn, { borderColor: filled ? '#29B6F6' : '#E8EDF5', backgroundColor: filled ? '#E1F5FE' : '#F8FAFF' }]}
                  >
                    <Text style={{ fontSize: 15 }}>💧</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={s.waterCount}>{waterToday} / 8 verres</Text>

            <View style={s.divider} />

            {/* Séance du jour */}
            <Text style={s.sectionLabel}>Séance du jour</Text>
            <View style={s.workoutTypes}>
              {WORKOUT_TYPES.map((t) => {
                const sel = workoutType === t;
                return (
                  <Pressable key={t} onPress={() => setWorkoutType(sel ? '' : t)} style={[s.workoutPill, { borderColor: sel ? mo.accent : '#E8EDF5', backgroundColor: sel ? mo.light : '#F8FAFF' }]}>
                    <Text style={[s.workoutPillText, { color: sel ? mo.text : '#6070A0' }]}>{t}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={s.addRow}>
              <TextInput
                style={[s.addInput, { flex: 1 }]}
                value={workoutDur}
                onChangeText={setWorkoutDur}
                placeholder="Durée (min)"
                placeholderTextColor="#B0B8C8"
                keyboardType="numeric"
              />
              <Pressable
                onPress={() => {
                  if (!workoutType || !workoutDur) return;
                  addWorkout(workoutType, workoutDur);
                  setWorkoutType('');
                  setWorkoutDur('');
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
                style={s.workoutAddBtn}
              >
                <Text style={s.addBtnText}>+ Ajouter</Text>
              </Pressable>
            </View>
            {todayWorkouts.map((w) => (
              <View key={w.id} style={s.workoutRow}>
                <Text style={{ fontSize: 15 }}>{w.type.split(' ')[0]}</Text>
                <Text style={s.workoutLabel}>{w.type.slice(w.type.indexOf(' ') + 1)}</Text>
                <Text style={s.workoutDur}>{w.dur} min</Text>
              </View>
            ))}
          </AnimatedSubTab>
        )}

        {/* ═══ RESPIRATION ═══ */}
        {subTab === 'respiration' && (
          <AnimatedSubTab>
            <BreathingTimer />
          </AnimatedSubTab>
        )}

        {/* ═══ MÉDITATION ═══ */}
        {subTab === 'meditation' && (
          <AnimatedSubTab>
            <MeditationTimer />
          </AnimatedSubTab>
        )}

        {/* ═══ DÉFIS ═══ */}
        {subTab === 'defis' && (
          <AnimatedSubTab>
            <Text style={s.sectionLabel}>Nouveau défi</Text>
            <View style={s.defiAddCard}>
              <TextInput
                style={s.defiInput}
                value={newDefiText}
                onChangeText={setNewDefiText}
                placeholder="Ex: 30 jours sans réseaux sociaux..."
                placeholderTextColor="#B0B8C8"
              />
              <Text style={s.defiDurLabel}>Durée :</Text>
              <View style={s.defiDurRow}>
                {DEFI_DURATIONS.map((d) => {
                  const sel = newDefiDays === d;
                  return (
                    <Pressable key={d} onPress={() => setNewDefiDays(d)} style={[s.defiDurBtn, { borderColor: sel ? mo.accent : '#E8EDF5', backgroundColor: sel ? mo.accent : '#F8FAFF' }]}>
                      <Text style={[s.defiDurText, { color: sel ? '#FFFFFF' : '#6070A0' }]}>{d}j</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                onPress={() => {
                  if (newDefiText.trim()) {
                    addDefi(newDefiText.trim(), newDefiDays);
                    setNewDefiText('');
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                }}
                style={s.defiLaunchBtn}
              >
                <Text style={s.defiLaunchText}>Lancer le défi 🎯</Text>
              </Pressable>
            </View>

            {defis.length === 0 && (
              <EmptyState
                emoji="🎯"
                title="Lance ton premier défi !"
                subtitle="Choisis un objectif et tiens bon. Chaque jour compte."
                floatingEmojis={['🔥', '💪', '🏆']}
              />
            )}

            {defis.map((defi, di) => {
              const streak = Object.values(defi.log).filter(Boolean).length;
              const pct = Math.min(100, Math.round((streak / defi.days) * 100));
              const badge = pct >= 100 ? '🏆' : pct >= 75 ? '🥇' : pct >= 50 ? '🥈' : pct >= 25 ? '🥉' : '🎯';
              const doneToday = defi.log[today];
              const startDate = defi.startDate;
              return (
                <StaggeredItem key={defi.id} index={di}>
                <View style={[s.defiCard, { backgroundColor: doneToday ? mo.light : '#F8FAFF', borderColor: doneToday ? mo.border : '#E8EDF5' }]}>
                  {/* Header */}
                  <View style={s.defiHeader}>
                    <Text style={{ fontSize: 20 }}>{badge}</Text>
                    <Text style={s.defiTitle}>{defi.label}</Text>
                    <View style={s.defiBadge}>
                      <Text style={s.defiBadgeText}>{streak}/{defi.days}j</Text>
                    </View>
                    <Pressable onPress={() => deleteDefi(defi.id)}>
                      <Text style={{ fontSize: 15, color: '#CCC' }}>×</Text>
                    </Pressable>
                  </View>
                  {/* Progress bar */}
                  <View style={s.defiBarBg}>
                    <View style={[s.defiBarFill, { width: `${pct}%`, backgroundColor: pct >= 100 ? '#F59E0B' : mo.accent }]} />
                  </View>
                  <Text style={s.defiPctText}>
                    {pct}% — Commence le {new Date(startDate + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                  </Text>
                  {/* Day grid */}
                  <View style={s.defiGrid}>
                    {Array.from({ length: Math.min(defi.days, 30) }).map((_, i) => {
                      const dt = new Date(startDate + 'T12:00:00');
                      dt.setDate(dt.getDate() + i);
                      const ds = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
                      const isDone = defi.log[ds];
                      const isToday2 = ds === today;
                      return (
                        <Pressable
                          key={i}
                          onPress={() => { toggleDefiDay(defi.id, ds); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                          style={[s.defiDayCell, { backgroundColor: isDone ? mo.accent : '#E8EDF5' }, isToday2 && { borderWidth: 2, borderColor: mo.text }]}
                        />
                      );
                    })}
                  </View>
                  {/* Today button */}
                  <Pressable
                    onPress={() => { toggleDefiDay(defi.id, today); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                    style={[s.defiTodayBtn, { backgroundColor: doneToday ? '#F0F4FF' : mo.accent }]}
                  >
                    <Text style={[s.defiTodayText, { color: doneToday ? mo.text : '#FFFFFF' }]}>
                      {doneToday ? "✓ Fait aujourd'hui" : "Marquer comme fait aujourd'hui"}
                    </Text>
                  </Pressable>
                </View>
                </StaggeredItem>
              );
            })}
          </AnimatedSubTab>
        )}
      </ScrollView>
      </GestureDetector>
    </View>
  );
}

const s = StyleSheet.create({
  tabScroll: { flexGrow: 0, flexShrink: 0 },
  tabBar: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 },
  tab: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, backgroundColor: '#FAFBFF', borderWidth: 1.5, borderColor: '#E8EDF5' },
  tabActive: { backgroundColor: mo.light, borderColor: mo.accent },
  tabText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#9CA3AF' },
  tabTextActive: { fontFamily: 'Inter_700Bold', color: mo.accent },

  scroll: { paddingHorizontal: 14, paddingBottom: 40, gap: 0 },

  sectionLabel: {
    fontFamily: 'Inter_700Bold', fontSize: 10, color: '#B0A090',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 2,
  },
  divider: { height: 1, backgroundColor: '#E8EDF5', marginVertical: 12 },

  // Energy
  energyRow: { flexDirection: 'row', gap: 5, marginBottom: 10 },
  energyBtn: {
    flex: 1, paddingVertical: 8, paddingHorizontal: 3, borderRadius: 10,
    borderWidth: 2, alignItems: 'center', gap: 2,
  },
  energyLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, lineHeight: 11 },

  // Habits
  habitRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 9, paddingHorizontal: 12, marginBottom: 5,
    borderRadius: 12, borderWidth: 1.5,
  },
  habitLabel: { fontFamily: 'Inter_700Bold', fontSize: 14, flex: 1 },
  habitCheck: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: '#D0D8EA', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  habitCheckMark: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  // Add row (shared)
  addRow: { flexDirection: 'row', gap: 6, marginTop: 8, marginBottom: 4 },
  addInput: {
    flex: 1, borderWidth: 1.5, borderColor: '#E8EDF5', borderRadius: 9,
    paddingVertical: 6, paddingHorizontal: 10, fontSize: 13,
    fontFamily: 'Inter_400Regular', backgroundColor: '#FFFFFF', color: colors.text,
  },
  addBtn: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 9,
    backgroundColor: mo.accent, alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  // Gratitude
  gratitudeRow: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    paddingVertical: 6, paddingHorizontal: 10, marginBottom: 4,
    borderRadius: 9, backgroundColor: mo.light, borderWidth: 1.5, borderColor: mo.border,
  },
  gratitudeText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: mo.text, flex: 1, lineHeight: 18 },

  // Water
  waterRow: { flexDirection: 'row', gap: 4, marginBottom: 5 },
  waterBtn: {
    flex: 1, height: 34, borderRadius: 9, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  waterCount: { fontFamily: 'Inter_700Bold', fontSize: 12, color: '#29B6F6', textAlign: 'center' },

  // Workout
  workoutTypes: { flexDirection: 'row', gap: 5, flexWrap: 'wrap', marginBottom: 8 },
  workoutPill: {
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 16,
    borderWidth: 1.5,
  },
  workoutPillText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  workoutAddBtn: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 9,
    backgroundColor: mo.accent, alignItems: 'center', justifyContent: 'center',
  },
  workoutRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 5, paddingHorizontal: 10, marginBottom: 3,
    borderRadius: 9, backgroundColor: mo.light, borderWidth: 1.5, borderColor: mo.border,
  },
  workoutLabel: { fontFamily: 'Inter_700Bold', fontSize: 13, color: mo.text, flex: 1 },
  workoutDur: { fontFamily: 'Inter_700Bold', fontSize: 12, color: mo.accent },

  // Défis
  defiAddCard: {
    padding: 10, paddingHorizontal: 12, borderRadius: 14,
    backgroundColor: mo.light, borderWidth: 1.5, borderColor: mo.border, marginBottom: 12,
  },
  defiInput: {
    borderWidth: 1.5, borderColor: '#E8EDF5', borderRadius: 9,
    paddingVertical: 7, paddingHorizontal: 10, fontSize: 13,
    fontFamily: 'Inter_400Regular', backgroundColor: '#FFFFFF', color: colors.text, marginBottom: 8,
  },
  defiDurLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, color: '#8090B0', marginBottom: 6 },
  defiDurRow: { flexDirection: 'row', gap: 5, marginBottom: 8 },
  defiDurBtn: {
    flex: 1, paddingVertical: 5, paddingHorizontal: 2, borderRadius: 9,
    borderWidth: 1.5, alignItems: 'center',
  },
  defiDurText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  defiLaunchBtn: {
    width: '100%', paddingVertical: 8, borderRadius: 9,
    backgroundColor: mo.accent, alignItems: 'center',
  },
  defiLaunchText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#FFFFFF' },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#C8D0E0', textAlign: 'center', paddingTop: 10 },

  defiCard: {
    marginBottom: 12, padding: 12, paddingHorizontal: 14,
    borderRadius: 14, borderWidth: 1.5,
  },
  defiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  defiTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, color: mo.text, flex: 1 },
  defiBadge: {
    backgroundColor: mo.light, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8,
  },
  defiBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 11, color: mo.accent },
  defiBarBg: { height: 8, backgroundColor: '#E8EDF5', borderRadius: 4, marginBottom: 6, overflow: 'hidden' },
  defiBarFill: { height: '100%', borderRadius: 4 },
  defiPctText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#8090B0', marginBottom: 8 },
  defiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginBottom: 8 },
  defiDayCell: { width: '9.5%', aspectRatio: 1, borderRadius: 3 },
  defiTodayBtn: { width: '100%', paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  defiTodayText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
});
