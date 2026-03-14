import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFlowiStore } from '@/store';
import { SwipeTask } from '@/components/ui/SwipeTask';
import { TimePicker } from '@/components/ui/TimePicker';
import { colors, CATEGORIES } from '@/constants/colors';
import { getToday } from '@/utils/date';

type SubTab = 'agenda' | 'routines';

export default function AujourdhuiScreen() {
  const [subTab, setSubTab] = useState<SubTab>('agenda');
  const todos = useFlowiStore((s) => s.todos);
  const events = useFlowiStore((s) => s.events);
  const habits = useFlowiStore((s) => s.habits);
  const routines = useFlowiStore((s) => s.routines);
  const addEvent = useFlowiStore((s) => s.addEvent);
  const toggleEventDone = useFlowiStore((s) => s.toggleEventDone);
  const completeTodo = useFlowiStore((s) => s.completeTodo);
  const deleteTodo = useFlowiStore((s) => s.deleteTodo);
  const toggleHabit = useFlowiStore((s) => s.toggleHabit);
  const today = getToday();

  const todayEvents = events
    .filter((e) => e.date === today)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const todayTodos = todos.filter((t) => t.scheduledDate === today);

  // New event form state
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');

  const handleAddEvent = () => {
    if (!newTitle.trim()) return;
    addEvent({
      title: newTitle.trim(),
      date: today,
      time: newTime || null,
      endTime: null,
      category: 'rdv',
    });
    setNewTitle('');
    setNewTime('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Aujourd'hui</Text>
        <View style={styles.tabs}>
          {(['agenda', 'routines'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, subTab === t && styles.tabActive]}
              onPress={() => setSubTab(t)}
            >
              <Text style={[styles.tabText, subTab === t && styles.tabTextActive]}>
                {t === 'agenda' ? 'Agenda' : 'Routines'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {subTab === 'agenda' ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* Events */}
            <Text style={styles.sectionTitle}>Rendez-vous</Text>
            {todayEvents.length === 0 && (
              <Text style={styles.empty}>Aucun rendez-vous aujourd'hui</Text>
            )}
            {todayEvents.map((ev) => (
              <Animated.View key={ev.id} entering={FadeIn.duration(200)} style={styles.eventCard}>
                <TouchableOpacity
                  style={[styles.checkbox, ev.done && styles.checkboxDone]}
                  onPress={() => { toggleEventDone(ev.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  {ev.done && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eventTitle, ev.done && styles.doneText]}>{ev.title}</Text>
                  {ev.time && <Text style={styles.eventTime}>{ev.time}{ev.endTime ? ` - ${ev.endTime}` : ''}</Text>}
                </View>
                <View style={[styles.catBadge, { backgroundColor: CATEGORIES[ev.category]?.bg }]}>
                  <Text style={[styles.catText, { color: CATEGORIES[ev.category]?.color }]}>
                    {CATEGORIES[ev.category]?.label}
                  </Text>
                </View>
              </Animated.View>
            ))}

            {/* Quick add event */}
            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="+ Ajouter un RDV..."
                placeholderTextColor={colors.muted}
                returnKeyType="done"
                onSubmitEditing={handleAddEvent}
              />
              <TimePicker value={newTime} onChange={setNewTime} />
            </View>

            {/* Today's tasks */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Tâches du jour</Text>
            {todayTodos.length === 0 && (
              <Text style={styles.empty}>Aucune tâche planifiée</Text>
            )}
            {todayTodos.map((todo) => (
              <SwipeTask
                key={todo.id}
                onComplete={() => completeTodo(todo.id)}
                onDelete={() => deleteTodo(todo.id)}
              >
                <View style={styles.todoRow}>
                  <View style={[styles.checkbox, todo.done && styles.checkboxDone]}>
                    {todo.done && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={[styles.prioDot, { backgroundColor: colors[todo.priority] }]} />
                  <Text style={[styles.todoText, todo.done && styles.doneText]} numberOfLines={1}>
                    {todo.text}
                  </Text>
                </View>
              </SwipeTask>
            ))}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.sectionTitle}>Mes routines</Text>
          {routines.map((routine) => (
            <View key={routine.id} style={[styles.routineCard, { borderLeftColor: routine.color }]}>
              <Text style={styles.routineHeader}>
                {routine.emoji} {routine.name}
              </Text>
              {routine.blocks.map((block) => (
                <View key={block.id} style={styles.blockRow}>
                  <Text style={styles.blockEmoji}>{block.emoji}</Text>
                  <Text style={styles.blockLabel}>{block.label}</Text>
                  <Text style={styles.blockDur}>{block.dur} min</Text>
                </View>
              ))}
              <Text style={styles.routineTotal}>
                Total: {routine.blocks.reduce((s, b) => s + b.dur, 0)} min
              </Text>
            </View>
          ))}

          {/* Habits */}
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Habitudes</Text>
          <View style={styles.habitsGrid}>
            {habits.map((habit) => {
              const done = habit.done[today];
              return (
                <TouchableOpacity
                  key={habit.id}
                  style={[styles.habitChip, done && styles.habitDone]}
                  onPress={() => { toggleHabit(habit.id, today); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Text style={styles.habitIcon}>{habit.icon}</Text>
                  <Text style={[styles.habitLabel, done && styles.habitLabelDone]}>
                    {habit.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: colors.text,
    marginBottom: 12,
  },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.agenda.light,
    borderColor: colors.agenda.accent,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.muted,
  },
  tabTextActive: {
    fontFamily: 'Inter_600SemiBold',
    color: colors.agenda.accent,
  },
  scroll: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: 10,
  },
  empty: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.muted,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: colors.moi.accent,
    borderColor: colors.moi.accent,
  },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  eventTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  eventTime: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.muted,
    marginTop: 2,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  catText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  doneText: { textDecorationLine: 'line-through', opacity: 0.5 },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
    backgroundColor: colors.surface,
  },
  timeInput: {
    width: 70,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
    backgroundColor: colors.surface,
    textAlign: 'center',
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  prioDot: { width: 8, height: 8, borderRadius: 4 },
  todoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
  },
  routineCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  routineHeader: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: colors.text,
    marginBottom: 10,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  blockEmoji: { fontSize: 16 },
  blockLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
  },
  blockDur: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.muted,
  },
  routineTotal: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.muted,
    marginTop: 8,
    textAlign: 'right',
  },
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  habitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  habitDone: {
    backgroundColor: colors.moi.light,
    borderColor: colors.moi.accent,
  },
  habitIcon: { fontSize: 16 },
  habitLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
  },
  habitLabelDone: {
    fontFamily: 'Inter_600SemiBold',
    color: colors.moi.accent,
  },
});
