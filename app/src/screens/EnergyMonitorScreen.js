import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStorage } from '../hooks/useStorage';
import { colors, radius, shadow, typography } from '../theme';
import { today, formatDate } from '../utils/lunar';

const LEVELS = [
  { value: 1, label: '⚡ Très bas', color: '#ef4444' },
  { value: 2, label: '⚡⚡ Bas', color: '#f97316' },
  { value: 3, label: '⚡⚡⚡ Moyen', color: '#f59e0b' },
  { value: 4, label: '⚡⚡⚡⚡ Bon', color: '#84cc16' },
  { value: 5, label: '⚡⚡⚡⚡⚡ Excellent', color: '#10b981' },
];

const SLOTS = [
  { key: 'morning', label: 'Matin', emoji: '☀️', time: '8h–12h' },
  { key: 'afternoon', label: 'Après-midi', emoji: '🌤️', time: '12h–17h' },
  { key: 'evening', label: 'Soir', emoji: '🌙', time: '17h–22h' },
];

export default function EnergyMonitorScreen() {
  const insets = useSafeAreaInsets();
  const [energyLog, setEnergyLog] = useStorage('energy_monitor', {});
  const todayKey = today();
  const todayLog = energyLog[todayKey] || {};

  const setSlot = (slot, value) => {
    setEnergyLog(prev => ({ ...prev, [todayKey]: { ...(prev[todayKey] || {}), [slot]: value } }));
  };

  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const k = formatDate(d);
    const e = energyLog[k] || {};
    const avg = Object.values(e).length > 0 ? Object.values(e).reduce((a,b)=>a+b,0)/Object.values(e).length : null;
    return { key: k, day: d.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3), avg, slots: e };
  });

  const avgLevel = Object.values(todayLog).length > 0
    ? Object.values(todayLog).reduce((a, b) => a + b, 0) / Object.values(todayLog).length
    : null;

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={{ paddingBottom: 80 }}>
      <Text style={styles.title}>🔋 Energy Monitor</Text>

      {/* Today */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Aujourd'hui</Text>
        {avgLevel && (
          <View style={[styles.avgBadge, { backgroundColor: LEVELS[Math.round(avgLevel)-1]?.color + '22' }]}>
            <Text style={[styles.avgValue, { color: LEVELS[Math.round(avgLevel)-1]?.color }]}>
              {avgLevel.toFixed(1)}/5
            </Text>
            <Text style={styles.avgLabel}>Énergie moyenne</Text>
          </View>
        )}
        {SLOTS.map(slot => (
          <View key={slot.key} style={styles.slotBlock}>
            <View style={styles.slotHeader}>
              <Text style={styles.slotEmoji}>{slot.emoji}</Text>
              <Text style={styles.slotLabel}>{slot.label}</Text>
              <Text style={styles.slotTime}>{slot.time}</Text>
            </View>
            <View style={styles.levelsRow}>
              {LEVELS.map(l => (
                <TouchableOpacity key={l.value}
                  style={[styles.levelBtn, todayLog[slot.key] === l.value && { backgroundColor: l.color, borderColor: l.color }]}
                  onPress={() => setSlot(slot.key, l.value)}>
                  <Text style={[styles.levelVal, todayLog[slot.key] === l.value && styles.levelValActive]}>{l.value}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {todayLog[slot.key] && (
              <Text style={[styles.levelDesc, { color: LEVELS[todayLog[slot.key]-1].color }]}>
                {LEVELS[todayLog[slot.key]-1].label}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* 7-day chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Les 7 derniers jours</Text>
        <View style={styles.chartRow}>
          {last7.map(d => (
            <View key={d.key} style={styles.chartCol}>
              {d.avg ? (
                <Text style={[styles.chartEmoji, { color: LEVELS[Math.round(d.avg)-1]?.color }]}>⚡</Text>
              ) : (
                <Text style={styles.chartEmpty}>·</Text>
              )}
              <View style={styles.chartBarBg}>
                {d.avg && <View style={[styles.chartBar, { height: `${(d.avg/5)*100}%`, backgroundColor: LEVELS[Math.round(d.avg)-1]?.color }]} />}
              </View>
              <Text style={styles.chartDay}>{d.day}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 Utilisez vos patterns</Text>
        <Text style={styles.tipText}>Après 2 semaines, vous verrez à quels moments vous êtes naturellement au meilleur. Planifiez vos tâches importantes dans ces créneaux, et les tâches légères dans les creux.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { ...typography.h2, padding: 20, paddingBottom: 8 },
  card: { backgroundColor: colors.surface, margin: 16, marginTop: 8, borderRadius: radius.md, padding: 16, ...shadow.sm },
  cardTitle: { ...typography.h3, marginBottom: 16 },
  avgBadge: { borderRadius: radius.md, padding: 16, alignItems: 'center', marginBottom: 16 },
  avgValue: { fontSize: 32, fontWeight: '800' },
  avgLabel: { ...typography.caption, marginTop: 4 },
  slotBlock: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  slotHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  slotEmoji: { fontSize: 20 },
  slotLabel: { ...typography.body, fontWeight: '700', flex: 1 },
  slotTime: { ...typography.caption },
  levelsRow: { flexDirection: 'row', gap: 8 },
  levelBtn: { flex: 1, height: 40, borderRadius: radius.md, backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  levelVal: { fontSize: 16, fontWeight: '700', color: colors.textMuted },
  levelValActive: { color: colors.white },
  levelDesc: { fontSize: 12, fontWeight: '600', marginTop: 6 },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100 },
  chartCol: { alignItems: 'center', flex: 1 },
  chartEmoji: { fontSize: 14, marginBottom: 4 },
  chartEmpty: { fontSize: 14, color: colors.textLight },
  chartBarBg: { width: 20, height: 60, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  chartBar: { borderRadius: 4 },
  chartDay: { fontSize: 10, color: colors.textMuted, marginTop: 4, textTransform: 'capitalize' },
  tipCard: { backgroundColor: colors.warning + '15', margin: 16, marginTop: 0, borderRadius: radius.md, padding: 16, borderLeftWidth: 4, borderLeftColor: colors.warning },
  tipTitle: { fontSize: 13, fontWeight: '700', color: colors.warning, marginBottom: 6 },
  tipText: { fontSize: 13, color: colors.text, lineHeight: 20 },
});
