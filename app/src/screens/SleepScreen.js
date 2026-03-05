import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStorage } from '../hooks/useStorage';
import { colors, radius, shadow, typography } from '../theme';
import { today, formatDate } from '../utils/lunar';

const QUALITY_STARS = [1,2,3,4,5];
const HOURS = Array.from({length:24},(_,i)=>i);
const MINUTES = ['00','15','30','45'];

function TimeSelector({ value, onChange, label }) {
  const [h, m] = (value || '22:00').split(':').map(Number);
  return (
    <View style={styles.timeSel}>
      <Text style={styles.timeLabel}>{label}</Text>
      <View style={styles.timeRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
          {HOURS.map(hr => (
            <TouchableOpacity key={hr} style={[styles.timePill, hr===h && styles.timePillActive]}
              onPress={() => onChange(`${String(hr).padStart(2,'0')}:${String(m).padStart(2,'0')}`)}>
              <Text style={[styles.timePillText, hr===h && styles.timePillTextActive]}>{String(hr).padStart(2,'0')}h</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

export default function SleepScreen() {
  const insets = useSafeAreaInsets();
  const [sleepLog, setSleepLog] = useStorage('sleep_log', {});
  const todayKey = today();
  const entry = sleepLog[todayKey] || { bedtime: '22:30', wakeup: '07:00', quality: 3 };
  const [bedtime, setBedtime] = useState(entry.bedtime);
  const [wakeup, setWakeup] = useState(entry.wakeup);
  const [quality, setQuality] = useState(entry.quality);

  const save = () => {
    setSleepLog(prev => ({ ...prev, [todayKey]: { bedtime, wakeup, quality, saved: true } }));
  };

  const duration = () => {
    const [bh, bm] = bedtime.split(':').map(Number);
    const [wh, wm] = wakeup.split(':').map(Number);
    let mins = (wh * 60 + wm) - (bh * 60 + bm);
    if (mins < 0) mins += 1440;
    return `${Math.floor(mins/60)}h${String(mins%60).padStart(2,'0')}`;
  };

  const last7 = Array.from({length:7}).map((_,i) => {
    const d = new Date(); d.setDate(d.getDate()-(6-i));
    const k = formatDate(d);
    const e = sleepLog[k];
    return { key: k, day: d.toLocaleDateString('fr-FR',{weekday:'short'}).slice(0,3), quality: e?.quality };
  });

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={{ paddingBottom: 80 }}>
      <Text style={styles.title}>😴 Suivi du sommeil</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ce soir / cette nuit</Text>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{duration()}</Text>
          <Text style={styles.durationLabel}>de sommeil</Text>
        </View>

        <TimeSelector value={bedtime} onChange={setBedtime} label="🌙 Coucher" />
        <TimeSelector value={wakeup} onChange={setWakeup} label="☀️ Réveil" />

        <Text style={styles.qualityLabel}>Qualité ressentie</Text>
        <View style={styles.starsRow}>
          {QUALITY_STARS.map(s => (
            <TouchableOpacity key={s} onPress={() => setQuality(s)}>
              <Text style={[styles.star, s <= quality ? styles.starActive : styles.starInactive]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.qualityNote}>
          {quality <= 2 ? '😫 Mauvaise nuit' : quality === 3 ? '😐 Nuit correcte' : quality === 4 ? '🙂 Bonne nuit' : '😄 Excellente nuit !'}
        </Text>

        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Les 7 derniers jours</Text>
        <View style={styles.weekRow}>
          {last7.map(d => (
            <View key={d.key} style={styles.dayCol}>
              <View style={styles.starsCol}>
                {[1,2,3,4,5].map(s => (
                  <View key={s} style={[styles.starDot, d.quality >= s ? styles.starDotActive : {}]} />
                ))}
              </View>
              <Text style={styles.dayLabel}>{d.day}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 Patterns & insights</Text>
        <Text style={styles.tipText}>Après 2 semaines de suivi, regardez s'il y a des corrélations entre votre qualité de sommeil et votre humeur du lendemain dans le module Bien-être.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { ...typography.h2, padding: 20, paddingBottom: 8 },
  card: { backgroundColor: colors.surface, margin: 16, marginTop: 8, borderRadius: radius.md, padding: 16, ...shadow.sm },
  cardTitle: { ...typography.h3, marginBottom: 16 },
  durationBadge: { backgroundColor: colors.primary + '15', borderRadius: radius.md, padding: 16, alignItems: 'center', marginBottom: 20 },
  durationText: { fontSize: 36, fontWeight: '800', color: colors.primary },
  durationLabel: { ...typography.caption, color: colors.primary, marginTop: 4 },
  timeSel: { marginBottom: 16 },
  timeLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 8 },
  timeRow: {},
  timeScroll: { flexDirection: 'row' },
  timePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  timePillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  timePillText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  timePillTextActive: { color: colors.white },
  qualityLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 10 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  star: { fontSize: 36 },
  starActive: { color: colors.warning },
  starInactive: { color: colors.border },
  qualityNote: { ...typography.caption, fontStyle: 'italic', marginBottom: 16 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.full, padding: 14, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 6 },
  starsCol: { gap: 3 },
  starDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.border },
  starDotActive: { backgroundColor: colors.warning },
  dayLabel: { fontSize: 10, color: colors.textMuted, textTransform: 'capitalize' },
  tipCard: { backgroundColor: colors.primary + '15', margin: 16, marginTop: 0, borderRadius: radius.md, padding: 16, borderLeftWidth: 4, borderLeftColor: colors.primary },
  tipTitle: { fontSize: 13, fontWeight: '700', color: colors.primary, marginBottom: 6 },
  tipText: { fontSize: 13, color: colors.text, lineHeight: 20 },
});
