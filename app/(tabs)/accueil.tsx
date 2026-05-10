import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFlowiStore } from '@/store';
import { getLevel, getXpForNextLevel } from '@/store';
import { colors } from '@/constants/colors';
import { getToday, getTomorrow } from '@/utils/date';
import { BadDayModal } from '@/components/ui/BadDayModal';
import { showToast } from '@/components/ui/Toast';
import { useTheme } from '@/hooks/useTheme';
import { useDarkOverrides } from '@/hooks/useDarkOverrides';

const XP_LEVELS = [
  { lvl: 1, label: 'Débutant', min: 0, emoji: '🌱' },
  { lvl: 2, label: 'Curieux', min: 50, emoji: '🌿' },
  { lvl: 3, label: 'Régulier', min: 150, emoji: '⚡' },
  { lvl: 4, label: 'Motivé', min: 300, emoji: '🔥' },
  { lvl: 5, label: 'Focalisé', min: 500, emoji: '🎯' },
  { lvl: 6, label: 'Champion', min: 800, emoji: '💪' },
  { lvl: 7, label: 'Expert', min: 1200, emoji: '🧠' },
  { lvl: 8, label: 'Maître', min: 1800, emoji: '💎' },
  { lvl: 9, label: 'Légende', min: 2500, emoji: '🌟' },
  { lvl: 10, label: 'Flow Master', min: 3500, emoji: '🏆' },
];

function getLevelData(xp: number) {
  const cur = [...XP_LEVELS].reverse().find((l) => xp >= l.min) || XP_LEVELS[0];
  const next = XP_LEVELS[cur.lvl] || null;
  const pct = next ? Math.min(100, Math.round(((xp - cur.min) / (next.min - cur.min)) * 100)) : 100;
  return { cur, next, pct };
}

export default function AccueilScreen() {
  const [badDayVisible, setBadDayVisible] = useState(false);
  const { t } = useTheme();
  const d = useDarkOverrides();
  const router = useRouter();
  const userName = useFlowiStore((s) => s.userName);
  const updateTodo = useFlowiStore((s) => s.updateTodo);
  const todos = useFlowiStore((s) => s.todos);
  const events = useFlowiStore((s) => s.events);
  const habits = useFlowiStore((s) => s.habits);
  const routines = useFlowiStore((s) => s.routines);
  const routineLog = useFlowiStore((s) => s.routineLog);
  const xp = useFlowiStore((s) => s.xp);
  const today = getToday();

  const nowH = new Date().getHours();
  const greeting = nowH < 6 ? 'Bonne nuit 🌙' : nowH < 12 ? 'Bonjour ☀️' : nowH < 18 ? 'Bon après-midi 🌤' : nowH < 21 ? 'Bonne soirée 🌆' : 'Bonsoir 🌙';

  const doneTodayCount = todos.filter((t) => t.done && t.doneDate === today).length;
  const pendingCount = todos.filter((t) => !t.done).length;
  const habDoneToday = habits.filter((h) => h.done && h.done[today]).length;

  // Best streak
  let bestStreak = 0;
  routines.forEach((r) => {
    let s = 0;
    const d = new Date();
    while (true) {
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (routineLog[`${r.id}-${ds}`]) { s++; d.setDate(d.getDate() - 1); } else break;
    }
    if (s > bestStreak) bestStreak = s;
  });

  // Voix Flowi
  const voixMsgs = [
    nowH < 10 ? 'Un jour de plus pour avancer à ton rythme. 🌿' : null,
    nowH >= 10 && nowH < 14 && doneTodayCount > 0 ? 'Tu avances bien. Continue comme ça. ✨' : null,
    nowH >= 14 && nowH < 18 && pendingCount > 3 ? "L'après-midi est encore là. Une tâche à la fois. 🎯" : null,
    nowH >= 18 ? 'La journée tire à sa fin. Ce que tu as fait compte. 🌙' : null,
    bestStreak >= 5 ? `${bestStreak} jours de streak — la constance, c'est du courage. 🔥` : null,
    habDoneToday >= 3 ? `${habDoneToday} habitudes cochées aujourd'hui. Ça s'accumule. 💚` : null,
  ].filter(Boolean);
  const voixMsg = voixMsgs[0] || null;

  // Upcoming events (2 weeks)
  const twoWeeksDate = (() => { const d = new Date(); d.setDate(d.getDate() + 14); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
  const upcomingEvts = events
    .filter((e) => e.date >= today && e.date <= twoWeeksDate)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, 3);

  // Today's priorities (jourPrios not in store yet, skip for now)
  const { cur: curLvl, next: nextLvl, pct: xpPct } = getLevelData(xp);

  const dateLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const CAT_COLORS: Record<string, string> = { rdv: '#3B82F6', sante: '#10B981', perso: '#8B5CF6', famille: '#F59E0B', tache: '#6B7280' };

  const navigateTo = (tab: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace(`/(tabs)/${tab}` as any);
  };

  return (
    <>
    <BadDayModal visible={badDayVisible} onClose={() => setBadDayVisible(false)} />
    <ScrollView style={[styles.container, { backgroundColor: t.screenBg }]} contentContainerStyle={[styles.scroll]} showsVerticalScrollIndicator={false}>

      {/* ── SALUTATION ── */}
      <Animated.View entering={FadeIn.duration(500)}>
        <LinearGradient
          colors={['#3730A3', '#6D28D9', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.greetingBanner}
        >
          {/* Decorative circles */}
          <View style={[styles.decorCircle, { width: 120, height: 120, right: -20, top: -20, opacity: 0.05 }]} />
          <View style={[styles.decorCircle, { width: 80, height: 80, right: 30, bottom: -40, opacity: 0.04 }]} />
          <View style={[styles.decorCircle, { width: 60, height: 60, left: -10, bottom: -20, opacity: 0.03 }]} />

          <Text style={styles.dateLabel}>{dateLabel}</Text>
          <Text style={styles.greetingText}>{greeting}</Text>

          {voixMsg && (
            <Text style={styles.voixFlowi}>{voixMsg}</Text>
          )}

          {/* Stats row */}
          <View style={styles.bannerStats}>
            {[
              { val: String(doneTodayCount), label: 'fait aujourd\'hui', icon: '✅' },
              { val: String(pendingCount), label: 'en attente', icon: '📋' },
              { val: bestStreak > 0 ? `${bestStreak}j` : '—', label: 'streak', icon: '🔥' },
            ].map((s, i) => (
              <View key={i} style={styles.bannerStatCard}>
                <Text style={styles.bannerStatVal}>{s.val}</Text>
                <Text style={styles.bannerStatLabel}>{s.icon} {s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ── OUTILS DE SECOURS ── */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Text style={[styles.sectionHeader, d.textMuted]}>Outils de secours</Text>
        <View style={styles.secoursGrid}>
          <Pressable onPress={() => setBadDayVisible(true)} style={{ flex: 1 }}>
            <LinearGradient colors={['#1E1B4B', '#3730A3']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.secoursCard}>
              <Text style={{ fontSize: 26 }}>🌿</Text>
              <View>
                <Text style={styles.secoursTitle}>Mode urgence</Text>
                <Text style={styles.secoursDesc}>Journée difficile ? Une chose à la fois.</Text>
              </View>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={() => { useFlowiStore.setState({ quickRoutineRequested: true }); navigateTo('aujourdhui'); }} style={{ flex: 1 }}>
            <LinearGradient colors={['#92400E', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.secoursCard}>
              <Text style={{ fontSize: 26 }}>⚡</Text>
              <View>
                <Text style={styles.secoursTitle}>Routine 5 min</Text>
                <Text style={styles.secoursDesc}>Respirer, cibler, agir. C'est tout.</Text>
              </View>
            </LinearGradient>
          </Pressable>
        </View>
        <View style={[styles.secoursGrid, { marginTop: 8 }]}>
          <Pressable onPress={() => { useFlowiStore.setState({ notesRequested: true }); navigateTo('taches'); }} style={{ flex: 1 }}>
            <LinearGradient colors={['#312E81', '#6D28D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.secoursCard}>
              <Text style={{ fontSize: 26 }}>🌫️</Text>
              <View>
                <Text style={styles.secoursTitle}>Vide-cerveau</Text>
                <Text style={styles.secoursDesc}>Dépose tout. Sans ordre. Sans pression.</Text>
              </View>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={() => {
            const tomorrow = getTomorrow();
            const todayTodos = todos.filter((t) => t.scheduledDate === today && !t.done);
            todayTodos.forEach((t) => updateTodo(t.id, { scheduledDate: tomorrow, rolledOver: false }));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToast(`${todayTodos.length} tâche${todayTodos.length > 1 ? 's' : ''} reportée${todayTodos.length > 1 ? 's' : ''} à demain 🌙`, 'info');
          }} style={{ flex: 1 }}>
            <LinearGradient colors={['#1F2937', '#374151']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.secoursCard}>
              <Text style={{ fontSize: 26 }}>🌙</Text>
              <View>
                <Text style={styles.secoursTitle}>Pas aujourd'hui</Text>
                <Text style={styles.secoursDesc}>Reporter sans culpabilité. C'est correct.</Text>
              </View>
            </LinearGradient>
          </Pressable>
        </View>
      </Animated.View>

      {/* ── XP + NIVEAU ── */}
      <Pressable onPress={() => { useFlowiStore.setState({ xpRequested: true }); navigateTo('flowi'); }}>
      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[styles.xpCard, d.card]}>
        <View style={styles.xpRow}>
          <Text style={{ fontSize: 32 }}>{curLvl.emoji}</Text>
          <View style={{ flex: 1 }}>
            <View style={styles.xpHeader}>
              <Text style={styles.xpLevelLabel}>{curLvl.label}</Text>
              <Text style={styles.xpAmount}>{xp}<Text style={styles.xpUnit}> XP</Text></Text>
            </View>
            <View style={styles.xpBarBg}>
              <View style={[styles.xpBarFill, { width: `${xpPct}%` }]} />
            </View>
          </View>
        </View>
        {nextLvl && (
          <Text style={styles.xpNext}>{nextLvl.min - xp} XP pour {nextLvl.label} {nextLvl.emoji}</Text>
        )}
      </Animated.View>
      </Pressable>

      {/* ── PRIORITÉS DU JOUR ── */}
      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={[styles.prioCard, d.prioCard]}>
        <View style={styles.cardHeader}>
          <Text style={styles.prioHeaderText}>🎯 Priorités du jour</Text>
          <Pressable onPress={() => navigateTo('aujourdhui')}>
            <Text style={styles.prioLink}>Modifier →</Text>
          </Pressable>
        </View>
        {(() => {
          const topTodos = todos.filter((t) => !t.done && t.scheduledDate === today).slice(0, 3);
          if (topTodos.length === 0) {
            return <Text style={styles.emptyText}>Aucune priorité définie</Text>;
          }
          return topTodos.map((t, i) => (
            <View key={t.id} style={styles.prioRow}>
              <Text style={{ fontSize: 12, flexShrink: 0 }}>{['🥇', '🥈', '🥉'][i]}</Text>
              <Text style={styles.prioText} numberOfLines={1}>{t.text}</Text>
            </View>
          ));
        })()}
      </Animated.View>

      {/* ── PROCHAINS RDV ── */}
      <Animated.View entering={FadeInDown.delay(400).duration(400)} style={[styles.rdvCard, d.rdvCard]}>
        <View style={styles.cardHeader}>
          <Text style={styles.rdvHeaderText}>📅 Prochains rendez-vous</Text>
          <Pressable onPress={() => navigateTo('aujourdhui')}>
            <Text style={styles.rdvLink}>Voir tout →</Text>
          </Pressable>
        </View>
        {upcomingEvts.length === 0 ? (
          <Text style={styles.emptyTextItalic}>Aucun rendez-vous dans les 2 prochaines semaines 🌿</Text>
        ) : (
          upcomingEvts.map((ev) => {
            const cc = CAT_COLORS[ev.category] || '#3B82F6';
            const isToday = ev.date === today;
            const evDate = new Date(ev.date + 'T12:00:00');
            const evLabel = isToday
              ? "Aujourd'hui"
              : evDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
            return (
              <View key={ev.id} style={[styles.rdvRow, { borderColor: cc + '33' }]}>
                <View style={[styles.rdvBar, { backgroundColor: cc }]} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.rdvTitle} numberOfLines={1}>{ev.title}</Text>
                  <Text style={styles.rdvDate}>{evLabel}{ev.time ? ` · ${ev.time}` : ''}</Text>
                </View>
                <Text style={{ fontSize: 10, color: '#D1D5DB' }}>›</Text>
              </View>
            );
          })
        )}
      </Animated.View>

      {/* ── HABITUDES DU JOUR ── */}
      {habits.length > 0 && (
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={[styles.habCard, d.habCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.habHeaderText}>💚 Habitudes</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={styles.habCount}>{habDoneToday}</Text>
              <Text style={styles.habTotal}>/ {habits.length}</Text>
            </View>
          </View>
          <View style={styles.habChips}>
            {habits.map((h) => {
              const done = h.done && h.done[today];
              return (
                <View
                  key={h.id}
                  style={[
                    styles.habChip,
                    {
                      backgroundColor: done ? '#D1FAE5' : '#FFFFFF',
                      borderColor: done ? '#6EE7B7' : '#D1FAE5',
                    },
                  ]}
                >
                  <Text style={{ fontSize: 13 }}>{h.icon}</Text>
                  <Text
                    style={[
                      styles.habChipLabel,
                      { color: done ? '#065F46' : '#9CA3AF', fontWeight: done ? '700' : '400' },
                    ]}
                  >
                    {h.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>
      )}
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { padding: 12, paddingHorizontal: 14, paddingBottom: 40, gap: 12 },

  // Greeting banner
  greetingBanner: {
    borderRadius: 20,
    padding: 20,
    paddingBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
  },
  dateLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  greetingText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 31,
  },
  voixFlowi: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 19,
  },
  bannerStats: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  bannerStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  bannerStatVal: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  bannerStatLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 3,
    lineHeight: 12,
  },

  // Secours
  sectionHeader: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  secoursGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  secoursCard: {
    borderRadius: 14,
    padding: 14,
    paddingHorizontal: 12,
    gap: 6,
  },
  secoursTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 15,
    marginBottom: 2,
  },
  secoursDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 13,
  },

  // XP Card
  xpCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
    padding: 10,
    paddingHorizontal: 14,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  xpLevelLabel: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 15,
    color: '#4C1D95',
  },
  xpAmount: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18,
    color: '#6D28D9',
  },
  xpUnit: {
    fontSize: 10,
    fontWeight: '400',
    color: '#A78BFA',
  },
  xpBarBg: {
    height: 6,
    backgroundColor: '#DDD6FE',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 3,
  },
  xpNext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: '#7C3AED',
    textAlign: 'right',
  },

  // Priorités
  prioCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    backgroundColor: '#FFFBEB',
    padding: 10,
    paddingHorizontal: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  prioHeaderText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#92400E',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  prioLink: {
    fontSize: 9,
    color: '#D97706',
    fontFamily: 'Inter_700Bold',
  },
  prioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 5,
  },
  prioText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#78350F',
    flex: 1,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#D1B896',
    textAlign: 'center',
    paddingVertical: 6,
  },

  // RDV
  rdvCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    padding: 10,
    paddingHorizontal: 12,
  },
  rdvHeaderText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#1E40AF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  rdvLink: {
    fontSize: 9,
    color: '#3B82F6',
    fontFamily: 'Inter_700Bold',
  },
  rdvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    marginBottom: 5,
  },
  rdvBar: {
    width: 3,
    borderRadius: 2,
    alignSelf: 'stretch',
    minHeight: 20,
  },
  rdvTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#1F2937',
  },
  rdvDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: '#6B7280',
    marginTop: 1,
  },
  emptyTextItalic: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 11,
    color: '#93C5FD',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },

  // Habitudes
  habCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
    padding: 10,
    paddingHorizontal: 12,
  },
  habHeaderText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#065F46',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  habCount: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 16,
    color: '#059669',
  },
  habTotal: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: '#6EE7B7',
  },
  habChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  habChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  habChipLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
  },
});
