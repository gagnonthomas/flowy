import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFlowiStore } from '@/store';
import { colors } from '@/constants/colors';
import { getToday, getEnergySlot } from '@/utils/date';

type SubTab = 'sante' | 'respiration' | 'meditation' | 'defis';

const ENERGY_LABELS = ['😫', '😕', '😐', '🙂', '😄'];
const BREATH_EXERCISES = [
  { name: 'Cohérence cardiaque', phases: [{ label: 'Inspirer', sec: 5 }, { label: 'Expirer', sec: 5 }], rounds: 6 },
  { name: '4-7-8 Relaxation', phases: [{ label: 'Inspirer', sec: 4 }, { label: 'Retenir', sec: 7 }, { label: 'Expirer', sec: 8 }], rounds: 4 },
  { name: 'Box Breathing', phases: [{ label: 'Inspirer', sec: 4 }, { label: 'Retenir', sec: 4 }, { label: 'Expirer', sec: 4 }, { label: 'Retenir', sec: 4 }], rounds: 4 },
];

export default function MoiScreen() {
  const [subTab, setSubTab] = useState<SubTab>('sante');
  const {
    energyLog, setEnergy,
    waterLog, setWater,
    habits, toggleHabit,
    defis, addDefi, toggleDefiDay, deleteDefi,
  } = useFlowiStore();
  const today = getToday();
  const slot = getEnergySlot();
  const energyKey = `${today}-${slot}`;

  const [newDefiText, setNewDefiText] = useState('');
  const [breathActive, setBreathActive] = useState(false);
  const [breathIdx, setBreathIdx] = useState(0);

  const waterToday = waterLog[today] || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Moi</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          <View style={styles.tabs}>
            {(['sante', 'respiration', 'meditation', 'defis'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tab, subTab === t && styles.tabActive]}
                onPress={() => setSubTab(t)}
              >
                <Text style={[styles.tabText, subTab === t && styles.tabTextActive]}>
                  {t === 'sante' ? 'Santé' : t === 'respiration' ? 'Respiration' : t === 'meditation' ? 'Méditation' : 'Défis'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {subTab === 'sante' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
            {/* Energy check-in */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Énergie ({slot})</Text>
              <View style={styles.energyRow}>
                {ENERGY_LABELS.map((emoji, i) => {
                  const val = i + 1;
                  const selected = energyLog[energyKey] === val;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.energyBtn, selected && styles.energyBtnActive]}
                      onPress={() => { setEnergy(energyKey, val); setEnergy(today, val); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    >
                      <Text style={styles.energyEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Water */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Hydratation</Text>
              <View style={styles.waterRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => { setWater(today, n); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  >
                    <Text style={[styles.waterDrop, n <= waterToday && styles.waterDropFull]}>
                      💧
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.waterCount}>{waterToday} / 8 verres</Text>
            </View>

            {/* Habits */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Habitudes</Text>
              {habits.map((h) => {
                const done = h.done[today];
                return (
                  <TouchableOpacity
                    key={h.id}
                    style={styles.habitRow}
                    onPress={() => { toggleHabit(h.id, today); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  >
                    <Text style={styles.habitIcon}>{h.icon}</Text>
                    <Text style={[styles.habitLabel, done && styles.habitDone]}>{h.label}</Text>
                    <View style={[styles.habitCheck, done && styles.habitCheckDone]}>
                      {done && <Text style={styles.habitCheckmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}

        {subTab === 'respiration' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
            {BREATH_EXERCISES.map((ex, idx) => (
              <TouchableOpacity
                key={ex.name}
                style={[styles.breathCard, breathIdx === idx && breathActive && styles.breathCardActive]}
                onPress={() => { setBreathIdx(idx); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
              >
                <Text style={styles.breathName}>{ex.name}</Text>
                <Text style={styles.breathDetail}>
                  {ex.phases.map((p) => `${p.label} ${p.sec}s`).join(' → ')}
                </Text>
                <Text style={styles.breathRounds}>{ex.rounds} cycles</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {subTab === 'meditation' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
            <View style={styles.meditCard}>
              <Text style={styles.meditEmoji}>🧘</Text>
              <Text style={styles.meditTitle}>Méditation guidée</Text>
              <Text style={styles.meditSubtitle}>
                Choisis une durée et laisse-toi guider
              </Text>
              {[3, 5, 10, 15].map((min) => (
                <TouchableOpacity key={min} style={styles.meditOption}>
                  <Text style={styles.meditOptionText}>{min} minutes</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {subTab === 'defis' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                value={newDefiText}
                onChangeText={setNewDefiText}
                placeholder="Nouveau défi (ex: 30 jours sans sucre)"
                placeholderTextColor={colors.muted}
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (newDefiText.trim()) {
                    addDefi(newDefiText.trim(), 30);
                    setNewDefiText('');
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                }}
              />
            </View>
            {defis.map((defi) => {
              const daysCompleted = Object.values(defi.log).filter(Boolean).length;
              return (
                <View key={defi.id} style={styles.defiCard}>
                  <View style={styles.defiHeader}>
                    <Text style={styles.defiLabel}>{defi.label}</Text>
                    <TouchableOpacity onPress={() => deleteDefi(defi.id)}>
                      <Text style={styles.deleteBtn}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.defiProgress}>
                    <View style={styles.defiBarBg}>
                      <View style={[styles.defiBarFill, { width: `${(daysCompleted / defi.days) * 100}%` }]} />
                    </View>
                    <Text style={styles.defiCount}>{daysCompleted}/{defi.days}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.defiTodayBtn, defi.log[today] && styles.defiTodayDone]}
                    onPress={() => { toggleDefiDay(defi.id, today); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  >
                    <Text style={styles.defiTodayText}>
                      {defi.log[today] ? '✓ Fait aujourd\'hui' : 'Marquer aujourd\'hui'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
            {defis.length === 0 && (
              <Text style={styles.empty}>Aucun défi en cours. Lance-toi !</Text>
            )}
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
  tabScroll: { marginBottom: 8 },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.moi.light, borderColor: colors.moi.accent },
  tabText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted },
  tabTextActive: { fontFamily: 'Inter_600SemiBold', color: colors.moi.accent },
  scroll: { paddingBottom: 40 },
  content: { padding: 20, gap: 12 },
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.text, marginBottom: 12 },
  energyRow: { flexDirection: 'row', justifyContent: 'space-around' },
  energyBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  energyBtnActive: { borderColor: colors.moi.accent, backgroundColor: colors.moi.light },
  energyEmoji: { fontSize: 28 },
  waterRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  waterDrop: { fontSize: 24, opacity: 0.3 },
  waterDropFull: { opacity: 1 },
  waterCount: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted, textAlign: 'center' },
  habitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  habitIcon: { fontSize: 20 },
  habitLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.text },
  habitDone: { textDecorationLine: 'line-through', color: colors.muted },
  habitCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  habitCheckDone: { backgroundColor: colors.moi.accent, borderColor: colors.moi.accent },
  habitCheckmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  breathCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
  breathCardActive: { borderColor: colors.moi.accent },
  breathName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.text },
  breathDetail: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.muted, marginTop: 4 },
  breathRounds: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.muted, marginTop: 2 },
  meditCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 24, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  meditEmoji: { fontSize: 48, marginBottom: 12 },
  meditTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text },
  meditSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.muted, marginBottom: 16 },
  meditOption: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, backgroundColor: colors.moi.light, marginBottom: 8, width: '100%', alignItems: 'center' },
  meditOptionText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.moi.accent },
  addRow: { marginBottom: 12 },
  addInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.text, backgroundColor: colors.surface },
  defiCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
  defiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  defiLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.text },
  deleteBtn: { fontSize: 16, color: colors.muted, padding: 4 },
  defiProgress: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  defiBarBg: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3 },
  defiBarFill: { height: 6, backgroundColor: colors.moi.accent, borderRadius: 3 },
  defiCount: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.muted },
  defiTodayBtn: { marginTop: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.moi.light, alignItems: 'center' },
  defiTodayDone: { backgroundColor: colors.moi.accent },
  defiTodayText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.moi.accent },
  empty: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.muted, fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
});
