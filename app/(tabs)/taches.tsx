import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideOutLeft } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFlowiStore } from '@/store';
import { colors } from '@/constants/colors';
import { getToday } from '@/utils/date';
import type { PriorityKey } from '@/constants/colors';

type SubTab = 'todos' | 'notes';

const PRIORITIES: { key: PriorityKey; label: string }[] = [
  { key: 'urgente', label: 'Urgente' },
  { key: 'haute', label: 'Haute' },
  { key: 'normale', label: 'Normale' },
  { key: 'basse', label: 'Basse' },
];

export default function TachesScreen() {
  const [subTab, setSubTab] = useState<SubTab>('todos');
  const {
    todos, notes, selectedDate,
    addTodo, completeTodo, deleteTodo,
    addNote, deleteNote,
    setSelectedDate,
  } = useFlowiStore();
  const today = getToday();

  const [newText, setNewText] = useState('');
  const [newPrio, setNewPrio] = useState<PriorityKey>('normale');
  const [newNoteText, setNewNoteText] = useState('');

  const viewDate = selectedDate || today;
  const filteredTodos = todos.filter((t) => t.scheduledDate === viewDate);
  const pendingTodos = filteredTodos.filter((t) => !t.done);
  const doneTodos = filteredTodos.filter((t) => t.done);

  const handleAddTodo = () => {
    if (!newText.trim()) return;
    addTodo(newText.trim(), newPrio, '', viewDate);
    setNewText('');
    setNewPrio('normale');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Date nav: prev/next day
  const navDate = (offset: number) => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + offset);
    const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setSelectedDate(str);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Tâches</Text>
        <View style={styles.tabs}>
          {(['todos', 'notes'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, subTab === t && styles.tabActive]}
              onPress={() => setSubTab(t)}
            >
              <Text style={[styles.tabText, subTab === t && styles.tabTextActive]}>
                {t === 'todos' ? 'Tâches' : 'Notes'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {subTab === 'todos' ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Date navigator */}
          <View style={styles.dateNav}>
            <TouchableOpacity onPress={() => navDate(-1)}>
              <Text style={styles.dateArrow}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedDate(today)}>
              <Text style={[styles.dateText, viewDate === today && styles.dateTextToday]}>
                {viewDate === today ? "Aujourd'hui" : viewDate}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navDate(1)}>
              <Text style={styles.dateArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* Add todo */}
            <View style={styles.addSection}>
              <TextInput
                style={styles.addInput}
                value={newText}
                onChangeText={setNewText}
                placeholder="+ Nouvelle tâche..."
                placeholderTextColor={colors.muted}
                returnKeyType="done"
                onSubmitEditing={handleAddTodo}
              />
              <View style={styles.prioRow}>
                {PRIORITIES.map((p) => (
                  <TouchableOpacity
                    key={p.key}
                    style={[styles.prioPill, newPrio === p.key && { backgroundColor: colors[p.key], borderColor: colors[p.key] }]}
                    onPress={() => setNewPrio(p.key)}
                  >
                    <Text style={[styles.prioPillText, newPrio === p.key && { color: '#fff' }]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Pending */}
            {pendingTodos.map((todo) => (
              <Animated.View key={todo.id} entering={FadeIn.duration(200)} style={styles.todoCard}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => { completeTodo(todo.id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
                >
                  <View style={[styles.checkInner, { borderColor: colors[todo.priority] }]} />
                </TouchableOpacity>
                <Text style={styles.todoText} numberOfLines={2}>{todo.text}</Text>
                <TouchableOpacity onPress={() => deleteTodo(todo.id)}>
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}

            {pendingTodos.length === 0 && (
              <Text style={styles.empty}>
                {viewDate === today ? 'Aucune tâche pour aujourd\'hui' : 'Aucune tâche ce jour'}
              </Text>
            )}

            {/* Done */}
            {doneTodos.length > 0 && (
              <>
                <Text style={styles.doneHeader}>Complétées ({doneTodos.length})</Text>
                {doneTodos.map((todo) => (
                  <View key={todo.id} style={[styles.todoCard, styles.todoCardDone]}>
                    <View style={styles.checkboxDone}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                    <Text style={styles.todoTextDone} numberOfLines={1}>{todo.text}</Text>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.addSection}>
              <TextInput
                style={[styles.addInput, { minHeight: 80, textAlignVertical: 'top' }]}
                value={newNoteText}
                onChangeText={setNewNoteText}
                placeholder="Écrire une note..."
                placeholderTextColor={colors.muted}
                multiline
              />
              {newNoteText.trim().length > 0 && (
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => {
                    addNote(newNoteText.trim());
                    setNewNoteText('');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={styles.addBtnText}>Ajouter</Text>
                </TouchableOpacity>
              )}
            </View>

            {notes.slice().reverse().map((note) => (
              <Animated.View key={note.id} entering={FadeIn.duration(200)} style={styles.noteCard}>
                <Text style={styles.noteDate}>{note.date}</Text>
                <Text style={styles.noteText}>{note.text}</Text>
                <TouchableOpacity
                  style={styles.noteDelete}
                  onPress={() => deleteNote(note.id)}
                >
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.text, marginBottom: 12 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.todos.light, borderColor: colors.todos.accent },
  tabText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.muted },
  tabTextActive: { fontFamily: 'Inter_600SemiBold', color: colors.todos.accent },
  dateNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  dateArrow: { fontSize: 28, color: colors.todos.accent, paddingHorizontal: 12 },
  dateText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.text },
  dateTextToday: { color: colors.todos.accent },
  scroll: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  addSection: { marginBottom: 16, gap: 8 },
  addInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.text, backgroundColor: colors.surface },
  prioRow: { flexDirection: 'row', gap: 6 },
  prioPill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  prioPillText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.muted },
  todoCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  todoCardDone: { opacity: 0.5 },
  checkbox: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  checkInner: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
  checkboxDone: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.moi.accent, alignItems: 'center', justifyContent: 'center' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  todoText: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.text },
  todoTextDone: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.muted, textDecorationLine: 'line-through' },
  deleteBtn: { fontSize: 16, color: colors.muted, padding: 4 },
  empty: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.muted, fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  doneHeader: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.muted, marginTop: 16, marginBottom: 8 },
  addBtn: { backgroundColor: colors.todos.accent, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  noteCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  noteDate: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.muted, marginBottom: 4 },
  noteText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text, lineHeight: 20 },
  noteDelete: { position: 'absolute', top: 10, right: 10 },
});
