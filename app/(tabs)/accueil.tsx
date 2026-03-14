import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useFlowiStore } from '@/store';
import { getLevel, getXpForNextLevel } from '@/store';
import { colors } from '@/constants/colors';
import { getToday, MONTHS_FR, formatDate } from '@/utils/date';

export default function AccueilScreen() {
  const userName = useFlowiStore((s) => s.userName);
  const todos = useFlowiStore((s) => s.todos);
  const events = useFlowiStore((s) => s.events);
  const habits = useFlowiStore((s) => s.habits);
  const xp = useFlowiStore((s) => s.xp);
  const today = getToday();
  const level = getLevel(xp);
  const { current, needed } = getXpForNextLevel(xp);

  const todayTodos = todos.filter((t) => t.scheduledDate === today && !t.done);
  const todayEvents = events.filter((e) => e.date === today && !e.done);
  const todayHabits = habits.filter((h) => !h.done[today]);
  const completedToday = todos.filter((t) => t.doneDate === today).length;

  const d = new Date();
  const greeting = d.getHours() < 12 ? 'Bonjour' : d.getHours() < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(500)}>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.name}>{userName || 'ami'} 🌿</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.card}>
          <View style={styles.xpRow}>
            <Text style={styles.xpLevel}>Niveau {level}</Text>
            <Text style={styles.xpAmount}>{xp} XP</Text>
          </View>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${Math.min(100, (current / needed) * 100)}%` }]} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.agenda.light }]}>
            <Text style={styles.statNum}>{todayTodos.length}</Text>
            <Text style={styles.statLabel}>tâches</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.focus.light }]}>
            <Text style={styles.statNum}>{todayEvents.length}</Text>
            <Text style={styles.statLabel}>RDV</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.moi.light }]}>
            <Text style={styles.statNum}>{todayHabits.length}</Text>
            <Text style={styles.statLabel}>habitudes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.todos.light }]}>
            <Text style={styles.statNum}>{completedToday}</Text>
            <Text style={styles.statLabel}>faites</Text>
          </View>
        </Animated.View>

        {todayTodos.length > 0 && (
          <Animated.View entering={FadeInDown.delay(450).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>A faire aujourd'hui</Text>
            {todayTodos.slice(0, 5).map((todo) => (
              <View key={todo.id} style={styles.todoRow}>
                <View style={[styles.prioDot, { backgroundColor: colors[todo.priority] }]} />
                <Text style={styles.todoText} numberOfLines={1}>{todo.text}</Text>
              </View>
            ))}
            {todayTodos.length > 5 && (
              <Text style={styles.moreText}>+{todayTodos.length - 5} autres</Text>
            )}
          </Animated.View>
        )}

        {todayEvents.length > 0 && (
          <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>Rendez-vous</Text>
            {todayEvents.map((ev) => (
              <View key={ev.id} style={styles.eventRow}>
                <Text style={styles.eventTime}>{ev.time || '--:--'}</Text>
                <Text style={styles.eventTitle} numberOfLines={1}>{ev.title}</Text>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.muted,
  },
  name: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: colors.text,
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpLevel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.flowi.accent,
  },
  xpAmount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.muted,
  },
  xpBarBg: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
  },
  xpBarFill: {
    height: 6,
    backgroundColor: colors.flowi.accent,
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: colors.muted,
    marginTop: 2,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
    marginBottom: 12,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  prioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  todoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
  },
  moreText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.muted,
    marginTop: 4,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  eventTime: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: colors.agenda.accent,
    width: 50,
  },
  eventTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.text,
  },
});
