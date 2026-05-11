import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useFlowiStore } from '@/store';
import { getLevel, getXpForNextLevel } from '@/store';
import { colors } from '@/constants/colors';
import { getToday, getTomorrow } from '@/utils/date';
import { BadDayModal } from '@/components/ui/BadDayModal';
import { showToast } from '@/components/ui/Toast';
import { useTheme } from '@/hooks/useTheme';
import { useDarkOverrides } from '@/hooks/useDarkOverrides';

// Hand-drawn wavy divider — irregular SVG path for a "drawn by hand" feel.
function InkRule({ color = colors.paper.rule, width = '100%' }: { color?: string; width?: number | string }) {
  return (
    <View style={{ width: width as any, alignItems: 'center', marginVertical: 14 }}>
      <Svg width="220" height="14" viewBox="0 0 220 14">
        <Path
          d="M 4 7 Q 30 1.5 56 7 T 110 7 T 164 7 T 216 7"
          stroke={color}
          strokeWidth="1.3"
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

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
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
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
  // Always show a message — fallback by time of day
  const defaultVoix = nowH < 12
    ? 'Chaque petit pas compte. Tu avances, même quand tu ne le vois pas. 🌿'
    : nowH < 18
      ? 'L\'après-midi est à toi. Choisis une chose et fonce. 🎯'
      : 'Bravo pour cette journée. Repose-toi bien ce soir. 🌙';
  const voixMsg = voixMsgs[0] || defaultVoix;

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
    <ScrollView
      style={[styles.container, { backgroundColor: colors.paper.bg }]}
      contentContainerStyle={[styles.scroll, isTablet && { padding: 20, paddingHorizontal: 24 }]}
      showsVerticalScrollIndicator={false}
    >

      {/* ── SALUTATION — page de carnet ── */}
      <Animated.View entering={FadeIn.duration(700)} style={styles.paperBanner}>
        {/* Date en tête de page, format journal */}
        <Text style={styles.paperDate}>
          {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
        </Text>

        {/* Salutation en serif élégant — la "voix" de la page */}
        <Text style={[styles.paperGreeting, isTablet && { fontSize: 40, lineHeight: 46 }]}>
          {greeting.replace(/[🌙☀️🌤🌆]/g, '').trim()}
          <Text style={styles.paperGreetingComma}>,</Text>
        </Text>

        <Text style={[styles.paperName, isTablet && { fontSize: 22 }]}>
          {userName || 'ami'}
        </Text>

        {voixMsg && (
          <>
            <InkRule />
            <Text style={[styles.paperQuote, isTablet && { fontSize: 16, lineHeight: 24 }]}>
              « {voixMsg.replace(/[🌿🎯🌙✨💚🔥]/g, '').trim()} »
            </Text>
          </>
        )}

        {/* Ligne de comptes — ledger style */}
        <View style={styles.paperLedger}>
          <View style={styles.paperLedgerCell}>
            <Text style={styles.paperLedgerVal}>{doneTodayCount}</Text>
            <Text style={styles.paperLedgerLabel}>fait</Text>
          </View>
          <View style={styles.paperLedgerSep} />
          <View style={styles.paperLedgerCell}>
            <Text style={styles.paperLedgerVal}>{pendingCount}</Text>
            <Text style={styles.paperLedgerLabel}>en attente</Text>
          </View>
          <View style={styles.paperLedgerSep} />
          <View style={styles.paperLedgerCell}>
            <Text style={styles.paperLedgerVal}>{bestStreak > 0 ? `${bestStreak}j` : '—'}</Text>
            <Text style={styles.paperLedgerLabel}>streak</Text>
          </View>
        </View>
      </Animated.View>

      {/* ── OUTILS DE SECOURS — cartes papier ── */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Text style={styles.paperSectionHeader}>Outils de secours</Text>
        <View style={[styles.secoursGrid, isTablet && { flexWrap: 'nowrap' }]}>
          {[
            { emoji: '🌿', title: 'Mode urgence', desc: 'Journée difficile ? Une chose à la fois.', accent: colors.paper.accent, onPress: () => setBadDayVisible(true) },
            { emoji: '⚡', title: 'Routine 5 min', desc: "Respirer, cibler, agir. C'est tout.", accent: '#A87C3F', onPress: () => { useFlowiStore.setState({ quickRoutineRequested: true }); navigateTo('aujourdhui'); } },
            { emoji: '🌫️', title: 'Vide-cerveau', desc: 'Dépose tout. Sans ordre. Sans pression.', accent: '#9886A8', onPress: () => { useFlowiStore.setState({ notesRequested: true }); navigateTo('taches'); } },
            { emoji: '🌙', title: "Pas aujourd'hui", desc: 'Reporter sans culpabilité.', accent: colors.paper.moss, onPress: () => {
              const tomorrow = getTomorrow();
              const todayTodos = todos.filter((t) => t.scheduledDate === today && !t.done);
              todayTodos.forEach((t) => updateTodo(t.id, { scheduledDate: tomorrow, rolledOver: false }));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast(`${todayTodos.length} tâche${todayTodos.length > 1 ? 's' : ''} reportée${todayTodos.length > 1 ? 's' : ''} à demain 🌙`, 'info');
            } },
          ].map((item, i) => (
            <Pressable key={i} onPress={item.onPress} style={{ flex: 1 }}>
              <View style={[styles.paperSecoursCard, { borderLeftColor: item.accent }]}>
                <Text style={{ fontSize: isTablet ? 22 : 24, marginBottom: 4 }}>{item.emoji}</Text>
                <Text style={styles.paperSecoursTitle}>{item.title}</Text>
                {!isTablet && <Text style={styles.paperSecoursDesc}>{item.desc}</Text>}
              </View>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* ── XP + NIVEAU ── */}
      <Pressable onPress={() => { useFlowiStore.setState({ xpRequested: true }); navigateTo('flowi'); }}>
      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[styles.xpCard, d.card, isTablet && { padding: 16, paddingHorizontal: 20 }]}>
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
      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={[styles.prioCard, d.prioCard, isTablet && { padding: 14, paddingHorizontal: 18 }]}>
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
      <Animated.View entering={FadeInDown.delay(400).duration(400)} style={[styles.rdvCard, d.rdvCard, isTablet && { padding: 14, paddingHorizontal: 18 }]}>
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
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={[styles.habCard, d.habCard, isTablet && { padding: 14, paddingHorizontal: 18 }]}>
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
  container: { flex: 1, backgroundColor: colors.paper.bg },
  scroll: { padding: 12, paddingHorizontal: 14, paddingBottom: 40, gap: 12 },

  // ── Paper banner (carnet d'auteur) ──
  paperBanner: {
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    // Subtle paper "edge" via warm border
    borderBottomWidth: 1,
    borderBottomColor: colors.paper.rule,
    marginBottom: 4,
  },
  paperDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.paper.inkMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 18,
  },
  paperGreeting: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    color: colors.paper.ink,
    lineHeight: 38,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  paperGreetingComma: {
    color: colors.paper.accent,
  },
  paperName: {
    fontFamily: 'PlayfairDisplay_900Black_Italic',
    fontSize: 18,
    color: colors.paper.inkSoft,
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 4,
  },
  paperQuote: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.paper.inkSoft,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
    maxWidth: 340,
  },
  paperLedger: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    gap: 18,
  },
  paperLedgerCell: {
    alignItems: 'center',
  },
  paperLedgerVal: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: colors.paper.ink,
    lineHeight: 26,
  },
  paperLedgerLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: colors.paper.inkMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  paperLedgerSep: {
    width: 1,
    height: 24,
    backgroundColor: colors.paper.rule,
  },

  // ── Legacy gradient banner (kept for fallback / dark mode) ──
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

  // ── Paper section header (commune à toutes les sections) ──
  paperSectionHeader: {
    fontFamily: 'PlayfairDisplay_900Black_Italic',
    fontSize: 14,
    color: colors.paper.inkSoft,
    fontStyle: 'italic',
    marginBottom: 10,
    marginTop: 4,
    letterSpacing: -0.2,
  },

  // ── Outils de secours — cartes papier ──
  secoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paperSecoursCard: {
    backgroundColor: colors.paper.bgLight,
    borderWidth: 1,
    borderColor: colors.paper.rule,
    borderLeftWidth: 3,
    borderRadius: 4,
    padding: 12,
    gap: 2,
    minHeight: 90,
  },
  paperSecoursTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 13,
    color: colors.paper.ink,
    lineHeight: 16,
    marginBottom: 2,
  },
  paperSecoursDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: colors.paper.inkMuted,
    lineHeight: 14,
    marginTop: 2,
  },

  // ── Paper card commune (XP, Prio, RDV, Habitudes) ──
  paperCard: {
    backgroundColor: colors.paper.bgLight,
    borderWidth: 1,
    borderColor: colors.paper.rule,
    borderRadius: 4,
    padding: 14,
    paddingHorizontal: 16,
  },
  paperCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  paperCardHeaderText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 13,
    color: colors.paper.ink,
    letterSpacing: -0.1,
  },
  paperCardLink: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: colors.paper.accent,
  },

  // XP — encre & rule
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  xpLevelLabel: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 16,
    color: colors.paper.ink,
  },
  xpAmount: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18,
    color: colors.paper.accent,
  },
  xpUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: colors.paper.inkMuted,
  },
  xpBarBg: {
    height: 4,
    backgroundColor: colors.paper.rule,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: colors.paper.accent,
    borderRadius: 2,
  },
  xpNext: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 11,
    fontStyle: 'italic',
    color: colors.paper.inkMuted,
    textAlign: 'right',
    marginTop: 6,
  },

  // Priorités — liste de cahier
  prioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.paper.rule,
  },
  prioText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.paper.ink,
    flex: 1,
    lineHeight: 19,
  },

  // RDV — entrée d'agenda manuscrite
  rdvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.paper.rule,
  },
  rdvBar: {
    width: 2,
    alignSelf: 'stretch',
    minHeight: 24,
    backgroundColor: colors.paper.accent,
  },
  rdvTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 14,
    color: colors.paper.ink,
  },
  rdvDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.paper.inkMuted,
    marginTop: 2,
    letterSpacing: 0.4,
  },

  // Empty states
  emptyText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.paper.inkMuted,
    textAlign: 'center',
    paddingVertical: 10,
  },
  emptyTextItalic: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.paper.inkMuted,
    textAlign: 'center',
    paddingVertical: 10,
  },

  // Habitudes — petits chips
  habCount: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 17,
    color: colors.paper.moss,
  },
  habTotal: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.paper.inkMuted,
  },
  habChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  habChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  habChipLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },

  // Aliases — keep old names alive so JSX referencing them still works
  // until the rest of the screen is migrated.
  prioCard: { backgroundColor: colors.paper.bgLight, borderWidth: 1, borderColor: colors.paper.rule, borderRadius: 4, padding: 14, paddingHorizontal: 16 },
  rdvCard: { backgroundColor: colors.paper.bgLight, borderWidth: 1, borderColor: colors.paper.rule, borderRadius: 4, padding: 14, paddingHorizontal: 16 },
  habCard: { backgroundColor: colors.paper.bgLight, borderWidth: 1, borderColor: colors.paper.rule, borderRadius: 4, padding: 14, paddingHorizontal: 16 },
  xpCard: { backgroundColor: colors.paper.bgLight, borderWidth: 1, borderColor: colors.paper.rule, borderRadius: 4, padding: 14, paddingHorizontal: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  prioHeaderText: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 13, color: colors.paper.ink, letterSpacing: -0.1 },
  rdvHeaderText: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 13, color: colors.paper.ink, letterSpacing: -0.1 },
  habHeaderText: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 13, color: colors.paper.ink, letterSpacing: -0.1 },
  prioLink: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.paper.accent },
  rdvLink: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.paper.accent },
});
