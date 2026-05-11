import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useFlowiStore } from '@/store';
import { colors } from '@/constants/colors';
import { getToday } from '@/utils/date';

/**
 * Top-of-screen banner that frames the day like a journal page.
 *
 * Reads what it needs (userName, todos, habits, routine log) directly from the
 * Zustand store, so any screen can drop it in without prop plumbing.
 */
function InkRule({ color = colors.paper.rule }: { color?: string }) {
  return (
    <View style={{ alignItems: 'center', marginVertical: 14 }}>
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

function getVoixMessage(args: {
  nowH: number;
  doneTodayCount: number;
  pendingCount: number;
  habDoneToday: number;
  bestStreak: number;
}): string {
  const { nowH, doneTodayCount, pendingCount, habDoneToday, bestStreak } = args;
  const candidates = [
    nowH < 10 ? 'Un jour de plus pour avancer à ton rythme. 🌿' : null,
    nowH >= 10 && nowH < 14 && doneTodayCount > 0 ? 'Tu avances bien. Continue comme ça. ✨' : null,
    nowH >= 14 && nowH < 18 && pendingCount > 3 ? "L'après-midi est encore là. Une tâche à la fois. 🎯" : null,
    nowH >= 18 ? 'La journée tire à sa fin. Ce que tu as fait compte. 🌙' : null,
    bestStreak >= 5 ? `${bestStreak} jours de streak — la constance, c'est du courage. 🔥` : null,
    habDoneToday >= 3 ? `${habDoneToday} habitudes cochées aujourd'hui. Ça s'accumule. 💚` : null,
  ].filter(Boolean) as string[];
  if (candidates.length > 0) return candidates[0];
  return nowH < 12
    ? 'Chaque petit pas compte. Tu avances, même quand tu ne le vois pas. 🌿'
    : nowH < 18
      ? "L'après-midi est à toi. Choisis une chose et fonce. 🎯"
      : 'Bravo pour cette journée. Repose-toi bien ce soir. 🌙';
}

export function PaperGreetingBanner() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const userName = useFlowiStore((s) => s.userName);
  const todos = useFlowiStore((s) => s.todos);
  const habits = useFlowiStore((s) => s.habits);
  const routines = useFlowiStore((s) => s.routines);
  const routineLog = useFlowiStore((s) => s.routineLog);
  const today = getToday();

  const nowH = new Date().getHours();
  const greeting =
    nowH < 6 ? 'Bonne nuit 🌙'
    : nowH < 12 ? 'Bonjour ☀️'
    : nowH < 18 ? 'Bon après-midi 🌤'
    : nowH < 21 ? 'Bonne soirée 🌆'
    : 'Bonsoir 🌙';

  const doneTodayCount = todos.filter((t) => t.done && t.doneDate === today).length;
  const pendingCount = todos.filter((t) => !t.done).length;
  const habDoneToday = habits.filter((h) => h.done && h.done[today]).length;

  let bestStreak = 0;
  routines.forEach((r) => {
    let streak = 0;
    const d = new Date();
    while (true) {
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (routineLog[`${r.id}-${ds}`]) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    if (streak > bestStreak) bestStreak = streak;
  });

  const voixMsg = getVoixMessage({ nowH, doneTodayCount, pendingCount, habDoneToday, bestStreak });
  const dateLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <Animated.View entering={FadeIn.duration(700)} style={s.paperBanner}>
      <Text style={s.paperDate}>
        {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
      </Text>

      <Text style={[s.paperGreeting, isTablet && { fontSize: 40, lineHeight: 46 }]}>
        {greeting.replace(/[🌙☀️🌤🌆]/g, '').trim()}
        <Text style={s.paperGreetingComma}>,</Text>
      </Text>

      <Text style={[s.paperName, isTablet && { fontSize: 22 }]}>
        {userName || 'ami'}
      </Text>

      {voixMsg && (
        <>
          <InkRule />
          <Text style={[s.paperQuote, isTablet && { fontSize: 16, lineHeight: 24 }]}>
            « {voixMsg.replace(/[🌿🎯🌙✨💚🔥]/g, '').trim()} »
          </Text>
        </>
      )}

      <View style={s.paperLedger}>
        <View style={s.paperLedgerCell}>
          <Text style={s.paperLedgerVal}>{doneTodayCount}</Text>
          <Text style={s.paperLedgerLabel}>fait</Text>
        </View>
        <View style={s.paperLedgerSep} />
        <View style={s.paperLedgerCell}>
          <Text style={s.paperLedgerVal}>{pendingCount}</Text>
          <Text style={s.paperLedgerLabel}>en attente</Text>
        </View>
        <View style={s.paperLedgerSep} />
        <View style={s.paperLedgerCell}>
          <Text style={s.paperLedgerVal}>{bestStreak > 0 ? `${bestStreak}j` : '—'}</Text>
          <Text style={s.paperLedgerLabel}>streak</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  paperBanner: {
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.paper.rule,
    backgroundColor: colors.paper.bg,
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
  paperGreetingComma: { color: colors.paper.accent },
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
  paperLedgerCell: { alignItems: 'center' },
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
});
