import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStorage } from '../hooks/useStorage';
import { colors, radius, shadow, typography } from '../theme';
import { today, formatDate } from '../utils/lunar';

const HABIT_ICONS = ['🏃','🧘','📚','💧','🥗','😴','🎨','💪','🧹','🌿','✍️','🎵'];
const HABIT_COLORS = ['#7c6fcd','#10b981','#f59e0b','#0ea5e9','#ec4899','#e8775a','#8b5cf6','#14b8a6'];

function getLast7Keys() {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return { key: formatDate(d), label: d.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0,3) };
  });
}

export default function HabitsScreen() {
  const insets = useSafeAreaInsets();
  const [habits, setHabits] = useStorage('habits', []);
  const [log, setLog] = useStorage('habits_log', {});
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏃');
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const todayKey = today();
  const last7 = getLast7Keys();

  const toggleHabit = (habitId) => {
    setLog(prev => {
      const dayLog = prev[todayKey] || [];
      const done = dayLog.includes(habitId);
      return { ...prev, [todayKey]: done ? dayLog.filter(id => id !== habitId) : [...dayLog, habitId] };
    });
  };

  const addHabit = () => {
    if (!name.trim()) return;
    setHabits(prev => [...prev, { id: Date.now().toString(), name: name.trim(), icon, color, createdAt: todayKey }]);
    setName(''); setIcon('🏃'); setColor(HABIT_COLORS[0]); setShowAdd(false);
  };

  const deleteHabit = (id) => {
    Alert.alert('Supprimer', 'Supprimer cette habitude et tout son historique ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => setHabits(prev => prev.filter(h => h.id !== id)) },
    ]);
  };

  const getStreak = (habitId) => {
    let streak = 0;
    const d = new Date();
    while (true) {
      const k = formatDate(d);
      if (!(log[k] || []).includes(habitId)) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  };

  const todayLog = log[todayKey] || [];
  const completedToday = habits.filter(h => todayLog.includes(h.id)).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🔗 Habitudes</Text>
          <Text style={styles.sub}>{completedToday}/{habits.length} complétées aujourd'hui</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Summary bar */}
      {habits.length > 0 && (
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${(completedToday / habits.length) * 100}%` }]} />
        </View>
      )}

      <FlatList
        data={habits}
        keyExtractor={h => h.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>Aucune habitude</Text>
            <Text style={styles.emptyText}>Créez votre première habitude pour commencer à construire votre routine.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const done = todayLog.includes(item.id);
          const streak = getStreak(item.id);
          return (
            <TouchableOpacity style={[styles.habitCard, done && styles.habitDone, { borderLeftColor: item.color }]}
              onPress={() => toggleHabit(item.id)} onLongPress={() => deleteHabit(item.id)} activeOpacity={0.8}>
              <View style={[styles.habitIcon, { backgroundColor: item.color + (done ? 'ff' : '33') }]}>
                <Text style={styles.habitEmoji}>{item.icon}</Text>
              </View>
              <View style={styles.habitContent}>
                <Text style={[styles.habitName, done && styles.habitNameDone]}>{item.name}</Text>
                <View style={styles.habitMeta}>
                  {streak > 0 && <Text style={styles.streak}>🔥 {streak} jour{streak > 1 ? 's' : ''}</Text>}
                  {/* Last 7 days dots */}
                  <View style={styles.weekDots}>
                    {last7.map(({ key, label }) => (
                      <View key={key} style={[styles.weekDot, (log[key] || []).includes(item.id) && { backgroundColor: item.color }]} />
                    ))}
                  </View>
                </View>
              </View>
              <View style={[styles.checkCircle, done && { backgroundColor: item.color, borderColor: item.color }]}>
                {done && <Ionicons name="checkmark" size={18} color={colors.white} />}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={showAdd} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowAdd(false)} />
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Nouvelle habitude</Text>
          <TextInput style={styles.input} placeholder="Ex : Méditation, Lire 10 pages..."
            placeholderTextColor={colors.textLight} value={name} onChangeText={setName} autoFocus />
          <Text style={styles.label}>Icône</Text>
          <View style={styles.iconGrid}>
            {HABIT_ICONS.map(ic => (
              <TouchableOpacity key={ic} style={[styles.iconBtn, icon===ic && styles.iconSelected]} onPress={() => setIcon(ic)}>
                <Text style={styles.iconText}>{ic}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Couleur</Text>
          <View style={styles.colorRow}>
            {HABIT_COLORS.map(c => (
              <TouchableOpacity key={c} style={[styles.colorDot, { backgroundColor: c }, color===c && styles.colorSelected]}
                onPress={() => setColor(c)} />
            ))}
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={addHabit}>
            <Text style={styles.saveBtnText}>Créer l'habitude</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { ...typography.h2 },
  sub: { ...typography.caption, marginTop: 2 },
  addBtn: { backgroundColor: colors.success, borderRadius: radius.full, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  progressBg: { height: 4, backgroundColor: colors.border },
  progressFill: { height: 4, backgroundColor: colors.success },
  habitCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderLeftWidth: 4, ...shadow.sm },
  habitDone: { opacity: 0.85 },
  habitIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  habitEmoji: { fontSize: 22 },
  habitContent: { flex: 1 },
  habitName: { ...typography.body, fontWeight: '600' },
  habitNameDone: { textDecorationLine: 'line-through', color: colors.textLight },
  habitMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  streak: { fontSize: 12, fontWeight: '700', color: colors.warning },
  weekDots: { flexDirection: 'row', gap: 4 },
  weekDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  checkCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { ...typography.h3, marginBottom: 8 },
  emptyText: { ...typography.body, textAlign: 'center', color: colors.textMuted },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modal: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { ...typography.h2, marginBottom: 16 },
  input: { backgroundColor: colors.background, borderRadius: radius.md, padding: 14, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border },
  iconSelected: { backgroundColor: colors.primary + '33', borderColor: colors.primary },
  iconText: { fontSize: 22 },
  colorRow: { flexDirection: 'row', gap: 10 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorSelected: { borderWidth: 3, borderColor: colors.text },
  saveBtn: { backgroundColor: colors.success, borderRadius: 999, padding: 16, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
