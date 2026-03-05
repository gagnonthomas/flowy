import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Modal, Pressable, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStorage } from '../hooks/useStorage';
import { colors, radius, shadow, typography, spacing } from '../theme';

const PRIORITIES = [
  { key: 'high', label: '🔴 Haute', color: '#ef4444' },
  { key: 'medium', label: '🟡 Moyenne', color: '#f59e0b' },
  { key: 'low', label: '🟢 Basse', color: '#10b981' },
];

const CARD_COLORS = ['#7c6fcd','#ec4899','#f59e0b','#10b981','#0ea5e9','#e8775a','#8b5cf6','#14b8a6'];

export default function TodoScreen() {
  const insets = useSafeAreaInsets();
  const [todos, setTodos] = useStorage('todos', []);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0]);
  const [filter, setFilter] = useState('all');

  const filtered = todos.filter(t =>
    filter === 'all' ? true : filter === 'done' ? t.done : !t.done
  );

  const addTodo = () => {
    if (!title.trim()) return;
    const newTodo = {
      id: Date.now().toString(),
      title: title.trim(),
      priority,
      color: selectedColor,
      done: false,
      createdAt: new Date().toISOString(),
    };
    setTodos(prev => [newTodo, ...prev]);
    setTitle('');
    setPriority('medium');
    setShowModal(false);
  };

  const toggleTodo = (id) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTodo = (id) => {
    Alert.alert('Supprimer', 'Retirer cette tâche ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => setTodos(prev => prev.filter(t => t.id !== id)) },
    ]);
  };

  const priorityColor = (p) => PRIORITIES.find(x => x.key === p)?.color || colors.primary;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>✅ To-Do List</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {['all','pending','done'].map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Toutes' : f === 'pending' ? 'À faire' : 'Faites'}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.count}>{todos.filter(t=>!t.done).length} restantes</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={t => t.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 10 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.empty}>Aucune tâche ici 🎉</Text>}
        renderItem={({ item }) => (
          <View style={[styles.todoCard, { borderLeftColor: item.color || colors.primary }]}>
            <TouchableOpacity onPress={() => toggleTodo(item.id)} style={styles.checkbox}>
              {item.done
                ? <Ionicons name="checkmark-circle" size={26} color={colors.success} />
                : <Ionicons name="ellipse-outline" size={26} color={colors.border} />}
            </TouchableOpacity>
            <View style={styles.todoContent}>
              <Text style={[styles.todoTitle, item.done && styles.done]}>{item.title}</Text>
              <View style={[styles.priorityBadge, { backgroundColor: priorityColor(item.priority) + '22' }]}>
                <Text style={[styles.priorityText, { color: priorityColor(item.priority) }]}>
                  {PRIORITIES.find(p=>p.key===item.priority)?.label}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => deleteTodo(item.id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color={colors.textLight} />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Add Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowModal(false)} />
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Nouvelle tâche</Text>
          <TextInput style={styles.input} placeholder="Titre de la tâche..."
            placeholderTextColor={colors.textLight} value={title} onChangeText={setTitle}
            autoFocus multiline />
          <Text style={styles.label}>Priorité</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map(p => (
              <TouchableOpacity key={p.key} style={[styles.priorityPill, priority===p.key && { backgroundColor: p.color }]}
                onPress={() => setPriority(p.key)}>
                <Text style={[styles.priorityPillText, priority===p.key && { color: '#fff' }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Couleur</Text>
          <View style={styles.colorRow}>
            {CARD_COLORS.map(c => (
              <TouchableOpacity key={c} style={[styles.colorDot, { backgroundColor: c }, selectedColor===c && styles.colorSelected]}
                onPress={() => setSelectedColor(c)} />
            ))}
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={addTodo}>
            <Text style={styles.saveBtnText}>Ajouter</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { ...typography.h2 },
  addBtn: { backgroundColor: colors.primary, borderRadius: radius.full, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  filters: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: colors.surface, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.background },
  filterActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  filterTextActive: { color: colors.white },
  count: { marginLeft: 'auto', color: colors.textLight, fontSize: 12 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 60, fontSize: 16 },
  todoCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, ...shadow.sm, gap: 12 },
  checkbox: {},
  todoContent: { flex: 1 },
  todoTitle: { ...typography.body, fontWeight: '600' },
  done: { textDecorationLine: 'line-through', color: colors.textLight },
  priorityBadge: { alignSelf: 'flex-start', borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  priorityText: { fontSize: 11, fontWeight: '700' },
  deleteBtn: { padding: 4 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modal: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 24, paddingBottom: 40 },
  modalTitle: { ...typography.h2, marginBottom: 16 },
  input: { backgroundColor: colors.background, borderRadius: radius.md, padding: 14, fontSize: 16, color: colors.text, minHeight: 60, borderWidth: 1, borderColor: colors.border },
  label: { ...typography.small, marginTop: 16, marginBottom: 8, textTransform: 'uppercase' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  priorityPillText: { fontSize: 13, fontWeight: '600', color: colors.text },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorSelected: { borderWidth: 3, borderColor: colors.text },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.full, padding: 16, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
