import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Pressable, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStorage } from '../hooks/useStorage';
import { colors, radius, shadow, typography } from '../theme';
import { formatDate, today } from '../utils/lunar';

const PRESETS = [
  { name: 'Méditation quotidienne', emoji: '🧘', duration: 30 },
  { name: 'Lire 10 pages/jour', emoji: '📚', duration: 30 },
  { name: 'Sans sucre ajouté', emoji: '🥗', duration: 21 },
  { name: '10 000 pas par jour', emoji: '🚶', duration: 30 },
  { name: 'Journal du matin', emoji: '✍️', duration: 21 },
  { name: 'Coucher avant 23h', emoji: '😴', duration: 30 },
];

export default function ChallengesScreen() {
  const insets = useSafeAreaInsets();
  const [challenges, setChallenges] = useStorage('challenges', []);
  const [log, setLog] = useStorage('challenges_log', {});
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [duration, setDuration] = useState(30);
  const todayKey = today();

  const startChallenge = (preset = null) => {
    const n = preset ? preset.name : name.trim();
    const e = preset ? preset.emoji : emoji;
    const d = preset ? preset.duration : duration;
    if (!n) return;
    const startDate = new Date();
    setChallenges(prev => [...prev, {
      id: Date.now().toString(),
      name: n, emoji: e, duration: d,
      startDate: formatDate(startDate),
      color: `hsl(${Math.random()*360},60%,50%)`,
    }]);
    setName(''); setShowAdd(false);
  };

  const toggleDay = (challengeId) => {
    setLog(prev => {
      const dayLog = prev[todayKey] || [];
      const done = dayLog.includes(challengeId);
      return { ...prev, [todayKey]: done ? dayLog.filter(id=>id!==challengeId) : [...dayLog, challengeId] };
    });
  };

  const getDaysGrid = (challenge) => {
    const start = new Date(challenge.startDate);
    return Array.from({length: challenge.duration}).map((_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const k = formatDate(d);
      const isPast = d < new Date() && formatDate(d) !== todayKey;
      const isToday = formatDate(d) === todayKey;
      const isDone = (log[k] || []).includes(challenge.id);
      return { key: k, day: i+1, isDone, isPast, isToday, isFuture: d > new Date() };
    });
  };

  const getStreak = (challenge) => {
    const grid = getDaysGrid(challenge);
    let streak = 0;
    const todayIdx = grid.findIndex(d => d.isToday);
    for (let i = todayIdx; i >= 0; i--) {
      if (grid[i].isDone) streak++;
      else break;
    }
    return streak;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>🔥 Défis 30 jours</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={challenges}
        keyExtractor={c => c.id}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>Aucun défi en cours</Text>
            <Text style={styles.emptyText}>Lancez un défi de 30 jours pour construire une nouvelle habitude, étape par étape.</Text>
            <TouchableOpacity style={styles.startBtn} onPress={() => setShowAdd(true)}>
              <Text style={styles.startBtnText}>Créer mon premier défi</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const grid = getDaysGrid(item);
          const streak = getStreak(item);
          const doneCount = grid.filter(d => d.isDone).length;
          const todayDone = (log[todayKey] || []).includes(item.id);

          return (
            <View style={styles.challengeCard}>
              <View style={styles.challengeHeader}>
                <Text style={styles.challengeEmoji}>{item.emoji}</Text>
                <View style={styles.challengeInfo}>
                  <Text style={styles.challengeName}>{item.name}</Text>
                  <Text style={styles.challengeMeta}>{doneCount}/{item.duration} jours · {streak > 0 ? `🔥 ${streak} de série` : 'Commencez aujourd\'hui'}</Text>
                </View>
                <TouchableOpacity style={[styles.checkBtn, todayDone && { backgroundColor: colors.success }]}
                  onPress={() => toggleDay(item.id)}>
                  {todayDone
                    ? <Ionicons name="checkmark" size={20} color={colors.white} />
                    : <Ionicons name="ellipse-outline" size={20} color={colors.textLight} />}
                </TouchableOpacity>
              </View>

              {/* Progress bar */}
              <View style={styles.progBg}>
                <View style={[styles.progFill, { width: `${(doneCount / item.duration) * 100}%`, backgroundColor: item.color }]} />
              </View>
              <Text style={styles.progText}>{Math.round(doneCount/item.duration*100)}% complété</Text>

              {/* Calendar grid */}
              <View style={styles.gridWrap}>
                {grid.map(d => (
                  <View key={d.key} style={[
                    styles.gridCell,
                    d.isDone && { backgroundColor: item.color },
                    d.isToday && styles.gridToday,
                    d.isFuture && styles.gridFuture,
                    d.isPast && !d.isDone && styles.gridMissed,
                  ]}>
                    <Text style={[styles.gridNum, d.isDone && styles.gridNumDone]}>{d.day}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.deleteChallenge} onPress={() => {
                Alert.alert('Abandonner', `Abandonner le défi "${item.name}" ?`, [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Abandonner', style: 'destructive', onPress: () => setChallenges(p => p.filter(c => c.id !== item.id)) },
                ]);
              }}>
                <Text style={styles.deleteChallengeText}>Abandonner ce défi</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <Modal visible={showAdd} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowAdd(false)} />
        <ScrollView style={styles.modal} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.modalTitle}>🎯 Nouveau défi</Text>
          <Text style={styles.modalSub}>Choisissez un défi prédéfini ou créez le vôtre</Text>

          <Text style={styles.presetLabel}>Défis populaires</Text>
          <View style={styles.presetGrid}>
            {PRESETS.map(p => (
              <TouchableOpacity key={p.name} style={styles.presetCard} onPress={() => startChallenge(p)}>
                <Text style={styles.presetEmoji}>{p.emoji}</Text>
                <Text style={styles.presetName}>{p.name}</Text>
                <Text style={styles.presetDuration}>{p.duration} jours</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.presetLabel}>Ou créez le vôtre</Text>
          <TextInput style={styles.input} placeholder="Nom du défi..."
            placeholderTextColor={colors.textLight} value={name} onChangeText={setName} />
          <View style={styles.durationRow}>
            {[7,14,21,30].map(d => (
              <TouchableOpacity key={d} style={[styles.durBtn, duration===d && styles.durBtnActive]}
                onPress={() => setDuration(d)}>
                <Text style={[styles.durBtnText, duration===d && styles.durBtnTextActive]}>{d}j</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={() => startChallenge()}>
            <Text style={styles.saveBtnText}>Lancer le défi</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { ...typography.h2 },
  addBtn: { backgroundColor: colors.success, borderRadius: radius.full, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  challengeCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, ...shadow.md },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  challengeEmoji: { fontSize: 28 },
  challengeInfo: { flex: 1 },
  challengeName: { ...typography.h3 },
  challengeMeta: { ...typography.caption, marginTop: 2 },
  checkBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  progBg: { height: 6, backgroundColor: colors.border, borderRadius: 3, marginBottom: 4 },
  progFill: { height: 6, borderRadius: 3 },
  progText: { ...typography.small, textAlign: 'right', marginBottom: 12 },
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 12 },
  gridCell: { width: 26, height: 26, borderRadius: 5, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  gridToday: { borderWidth: 2, borderColor: colors.primary },
  gridFuture: { opacity: 0.4 },
  gridMissed: { backgroundColor: colors.danger + '22', borderColor: colors.danger + '44' },
  gridNum: { fontSize: 9, fontWeight: '600', color: colors.textMuted },
  gridNumDone: { color: colors.white },
  deleteChallenge: { alignSelf: 'center' },
  deleteChallengeText: { fontSize: 12, color: colors.danger },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { ...typography.h3, marginBottom: 8 },
  emptyText: { ...typography.body, textAlign: 'center', color: colors.textMuted, lineHeight: 22 },
  startBtn: { backgroundColor: colors.success, borderRadius: radius.full, paddingHorizontal: 24, paddingVertical: 12, marginTop: 24 },
  startBtnText: { color: colors.white, fontWeight: '700' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modal: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalTitle: { ...typography.h2, marginBottom: 4 },
  modalSub: { ...typography.caption, marginBottom: 16 },
  presetLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  presetCard: { width: '47%', backgroundColor: colors.background, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.border },
  presetEmoji: { fontSize: 24, marginBottom: 4 },
  presetName: { fontSize: 13, fontWeight: '600', color: colors.text, lineHeight: 18 },
  presetDuration: { fontSize: 11, color: colors.primary, fontWeight: '700', marginTop: 2 },
  input: { backgroundColor: colors.background, borderRadius: radius.md, padding: 14, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  durationRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  durBtn: { flex: 1, padding: 12, borderRadius: radius.md, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  durBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  durBtnText: { fontWeight: '700', color: colors.textMuted },
  durBtnTextActive: { color: colors.white },
  saveBtn: { backgroundColor: colors.success, borderRadius: radius.full, padding: 16, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
