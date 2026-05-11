import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, ScrollView,
  Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFlowiStore, getLevel, getXpForNextLevel } from '@/store';
import { colors } from '@/constants/colors';
import { getToday } from '@/utils/date';
import { sendCoachMessage, generateDayPlan, decomposeTask } from '@/utils/api';
import { useTheme } from '@/hooks/useTheme';
import { AnimatedSubTab } from '@/components/ui/AnimatedSubTab';
import { TypingIndicator } from '@/components/ui/TypingIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDarkOverrides } from '@/hooks/useDarkOverrides';

const fl = colors.flowi;

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

const ALL_BADGES = [
  { id: 'first50', threshold: 50, emoji: '⭐', label: 'Premier pas', desc: '50 XP' },
  { id: 'lvl3', threshold: 300, emoji: '🔥', label: 'En feu', desc: '300 XP' },
  { id: 'lvl5', threshold: 800, emoji: '💜', label: 'Régulier', desc: '800 XP' },
  { id: 'lvl7', threshold: 1800, emoji: '💎', label: 'Diamant', desc: '1800 XP' },
  { id: 'lvl10', threshold: 5000, emoji: '🏆', label: 'Légende', desc: '5000 XP' },
  { id: 'task10', threshold: -1, emoji: '✅', label: 'Taskmaster', desc: '10 tâches' },
  { id: 'focus5', threshold: -2, emoji: '⏱', label: 'Zone de flow', desc: '5 sessions' },
  { id: 'routine7', threshold: -3, emoji: '🔁', label: 'Automatique', desc: '7 routines' },
];

const QUICK_PILLS = [
  "J'ai du mal à commencer",
  "Je suis épuisé, par quoi commencer ?",
  "Aide-moi à prioriser mes tâches",
  "Comment gérer les distractions ?",
  "Je me sens submergé",
  "Stratégie pour rester focus",
];

type FlowiMode = 'chat' | 'plan' | 'decompose';
type SubTab = 'coach' | 'xp';

export default function FlowiScreen() {
  const { dark, t } = useTheme();
  const d = useDarkOverrides();
  const xpRequested = useFlowiStore((s) => s.xpRequested);
  const coachAutoSendPending = useFlowiStore((s) => s.coachAutoSendPending);
  const [subTab, setSubTab] = useState<SubTab>('coach');

  useEffect(() => {
    if (xpRequested) {
      setSubTab('xp');
      useFlowiStore.setState({ xpRequested: false });
    }
  }, [xpRequested]);

  const [mode, setMode] = useState<FlowiMode>('chat');
  const coachMessages = useFlowiStore((s) => s.coachMessages);
  const addCoachMessage = useFlowiStore((s) => s.addCoachMessage);
  const todos = useFlowiStore((s) => s.todos);
  const addTodo = useFlowiStore((s) => s.addTodo);
  const energyLog = useFlowiStore((s) => s.energyLog);
  const xp = useFlowiStore((s) => s.xp);
  const xpLog = useFlowiStore((s) => s.xpLog);
  const badges = useFlowiStore((s) => s.badges);
  const today = getToday();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<FlatList>(null);
  const level = getLevel(xp);
  const { current, needed } = getXpForNextLevel(xp);

  // Plan du jour
  const [planLoading, setPlanLoading] = useState(false);
  const [planResult, setPlanResult] = useState<any>(null);

  // Décomposer
  const [decomposeText, setDecomposeText] = useState('');
  const [decomposeLoading, setDecomposeLoading] = useState(false);
  const [decomposeResult, setDecomposeResult] = useState<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [coachMessages]);

  // Post-scan handoff: when ScanModal queues a coach message + sets the flag,
  // jump to the chat tab and auto-send to the API so the user lands on a
  // conversation already in motion.
  useEffect(() => {
    if (!coachAutoSendPending || loading) return;
    setSubTab('coach');
    setMode('chat');
    useFlowiStore.setState({ coachAutoSendPending: false });
    (async () => {
      setLoading(true);
      try {
        const history = coachMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.text }));
        const reply = await sendCoachMessage(history);
        addCoachMessage({ role: 'assistant', text: reply });
      } finally {
        setLoading(false);
      }
    })();
    // We intentionally only react to coachAutoSendPending — pulling coachMessages
    // into the deps would re-fire on every coach message.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachAutoSendPending]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    addCoachMessage({ role: 'user', text });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    const history = [...coachMessages, { role: 'user' as const, text }].map((m) => ({ role: m.role as 'user' | 'assistant', content: m.text }));
    const reply = await sendCoachMessage(history);
    addCoachMessage({ role: 'assistant', text: reply });
    setLoading(false);
  };

  const pendingTasks = todos.filter((t) => !t.done);
  const jourEnergy = energyLog[today] || 0;
  const ELABELS = ['', 'Épuisé 🪫', 'Faible ⚡', 'Moyen 🔋', 'Élevé 🔥', 'Maximum 💥'];
  const ECOLORS = ['', '#DC2626', '#EA580C', '#3B82F6', '#059669', '#7C3AED'];

  return (
    <View style={{ flex: 1, backgroundColor: t.screenBg }}>
      {/* Sub-tabs */}
      <View style={s.tabBar}>
        {(['coach', 'xp'] as const).map((t) => (
          <Pressable key={t} onPress={() => setSubTab(t)} style={[s.tab, d.tab, subTab === t && s.tabActive]}>
            <Text style={[s.tabText, subTab === t && s.tabTextActive]}>
              {t === 'coach' ? 'Coach' : 'XP'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ═══ COACH ═══ */}
      {subTab === 'coach' ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
          {/* Mode tabs */}
          <View style={s.modeTabs}>
            {([
              { id: 'chat' as FlowiMode, icon: '💬', label: 'Chat' },
              { id: 'plan' as FlowiMode, icon: '✨', label: 'Plan du jour' },
              { id: 'decompose' as FlowiMode, icon: '✂️', label: 'Décomposer' },
            ]).map((m) => {
              const active = mode === m.id;
              return (
                <Pressable key={m.id} onPress={() => setMode(m.id)} style={[s.modeTab, active && s.modeTabActive]}>
                  <Text style={{ fontSize: 14 }}>{m.icon}</Text>
                  <Text style={[s.modeTabText, active && s.modeTabTextActive]}>{m.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── CHAT ── */}
          {mode === 'chat' && (
            <View style={{ flex: 1 }}>
              {/* Chat header */}
              <LinearGradient colors={['#16A34A', '#059669']} style={s.chatHeader}>
                <View style={s.chatHeaderAvatar}>
                  <Text style={{ fontSize: 16 }}>🌿</Text>
                </View>
                <View>
                  <Text style={s.chatHeaderTitle}>Coach Flowi</Text>
                  <Text style={s.chatHeaderSub}>Ton coach bienveillant</Text>
                </View>
              </LinearGradient>

              {/* Messages */}
              <FlatList
                ref={scrollRef}
                data={coachMessages}
                keyExtractor={(_, i) => String(i)}
                style={{ flex: 1, backgroundColor: dark ? '#0f0f1a' : '#FFFFFF' }}
                contentContainerStyle={[s.chatScroll, { flexGrow: 1, justifyContent: 'flex-end' }]}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                renderItem={({ item: msg }) => {
                  const isUser = msg.role === 'user';
                  return (
                    <View style={{ flexDirection: 'row', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                      {!isUser && (
                        <LinearGradient colors={['#16A34A', '#059669']} style={s.msgAvatar}>
                          <Text style={{ fontSize: 14 }}>🌿</Text>
                        </LinearGradient>
                      )}
                      <View style={[s.bubble, isUser ? s.userBubble : [s.assistantBubble, dark && { backgroundColor: '#1a1a2e', borderColor: '#2a2a3e' }]]}>
                        <Text style={[s.bubbleText, { color: isUser ? '#FFFFFF' : dark ? '#E5E7EB' : '#1F2937' }]}>{msg.text}</Text>
                      </View>
                    </View>
                  );
                }}
                ListFooterComponent={loading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <LinearGradient colors={['#16A34A', '#059669']} style={s.msgAvatar}>
                      <Text style={{ fontSize: 12 }}>🌿</Text>
                    </LinearGradient>
                    <View style={[s.bubble, s.assistantBubble, dark && { backgroundColor: '#1a1a2e', borderColor: '#2a2a3e' }]}>
                      <TypingIndicator />
                    </View>
                  </View>
                ) : null}
                ListEmptyComponent={
                  <EmptyState
                    emoji="🌿"
                    title="Salut ! Je suis Flowi."
                    subtitle="Ton coach bienveillant. Demande-moi n'importe quoi — productivité, focus, organisation, ou juste un encouragement."
                    floatingEmojis={['✨', '🎯', '💚', '🧠']}
                  />
                }
              />

              {/* Input bar */}
              <View style={[s.inputBar, dark && { backgroundColor: '#0f0f1a', borderTopColor: '#2a2a3e' }]}>
                <TextInput
                  style={[s.chatInput, dark && { backgroundColor: '#1a1a2e', borderColor: '#2a2a3e', color: '#E5E7EB' }]}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Parle à Flowi..."
                  placeholderTextColor={dark ? '#6B7280' : '#9CA3AF'}
                  returnKeyType="send"
                  onSubmitEditing={sendMessage}
                  multiline
                />
                <Pressable
                  onPress={sendMessage}
                  style={[s.sendBtn, (!input.trim() || loading) && { opacity: 0.3 }]}
                  disabled={!input.trim() || loading}
                >
                  <Text style={s.sendBtnText}>↑</Text>
                </Pressable>
              </View>
              {/* Quick pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.pillsRow, dark && { backgroundColor: '#0f0f1a', borderTopColor: '#2a2a3e' }]}>
                {QUICK_PILLS.map((p) => (
                  <Pressable key={p} onPress={() => setInput(p)} style={[s.pill, dark && { backgroundColor: '#1a1a2e', borderColor: '#2a2a3e' }]}>
                    <Text style={[s.pillText, dark && { color: '#6EE7B7' }]}>{p}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── PLAN DU JOUR ── */}
          {mode === 'plan' && (
            <ScrollView contentContainerStyle={s.modeScroll} showsVerticalScrollIndicator={false}>
              <Text style={s.modeDesc}>Flowi analyse tes tâches et ton niveau d'énergie pour te proposer un plan adapté à aujourd'hui.</Text>

              {/* Context cards */}
              <View style={s.contextRow}>
                <View style={s.contextCard}>
                  <Text style={[s.contextNum, { color: jourEnergy > 0 ? ECOLORS[jourEnergy] : '#D1D5DB' }]}>{jourEnergy > 0 ? jourEnergy : '—'}</Text>
                  <Text style={s.contextLabel}>Énergie</Text>
                </View>
                <View style={s.contextCard}>
                  <Text style={[s.contextNum, { color: '#4F46E5' }]}>{pendingTasks.length}</Text>
                  <Text style={s.contextLabel}>Tâches</Text>
                </View>
              </View>

              <Pressable
                onPress={() => {
                  if (planLoading) return;
                  setPlanLoading(true);
                  setPlanResult(null);
                  const PNAMES: Record<string, string> = { urgente: 'Urgente 🔴', haute: 'Haute 🟠', normale: 'Normale 🔵', basse: 'Basse 🟢' };
                  const taskList = pendingTasks.map((t) => `- ${t.text} [${PNAMES[t.priority] || 'Normale'}]${t.due ? ` (échéance: ${t.due})` : ''}`).join('\n') || '(aucune tâche)';
                  const dateStr = new Date(today + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
                  const energyLabel = ELABELS[jourEnergy] || 'Moyen';
                  generateDayPlan(dateStr, energyLabel, taskList).then((result) => {
                    setPlanResult(result);
                    setPlanLoading(false);
                  });
                }}
                style={[s.generateBtn, planLoading && { opacity: 0.6 }]}
              >
                <Text style={s.generateBtnText}>{planLoading ? '⟳ Flowi analyse ta journée...' : '✨ Générer mon plan du jour'}</Text>
              </Pressable>

              {planResult && (
                <View style={{ gap: 8 }}>
                  {/* Message */}
                  <View style={s.planMsg}>
                    <Text style={s.planMsgText}>💬 {planResult.message}</Text>
                  </View>
                  {/* Focus */}
                  {planResult.focus && (
                    <View style={s.planFocus}>
                      <Text style={s.planFocusLabel}>🎯 Focus du jour</Text>
                      <Text style={s.planFocusText}>{planResult.focus}</Text>
                    </View>
                  )}
                  {/* Suggestions */}
                  {planResult.suggestions?.length > 0 && (
                    <View style={s.planSuggestions}>
                      <Text style={s.planSugLabel}>📋 Ajustements</Text>
                      {planResult.suggestions.map((sg: any, i: number) => {
                        const icons: Record<string, string> = { faire: '✅', reporter: '⏭', adapter: '🔄' };
                        const bgs: Record<string, string> = { faire: '#F0FDF4', reporter: '#FFF7ED', adapter: '#FAF5FF' };
                        const cls: Record<string, string> = { faire: '#166534', reporter: '#9A3412', adapter: '#6B21A8' };
                        return (
                          <View key={i} style={[s.planSugRow, { backgroundColor: bgs[sg.type] || '#F8F9FF' }]}>
                            <Text style={{ fontSize: 14, flexShrink: 0 }}>{icons[sg.type] || '🔄'}</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={[s.planSugTask, { color: cls[sg.type] || '#374151' }]}>{sg.task}</Text>
                              <Text style={s.planSugReason}>{sg.raison}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                  {/* Conseil */}
                  {planResult.conseil && (
                    <View style={s.planConseil}>
                      <Text style={s.planConseilText}>💡 {planResult.conseil}</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          )}

          {/* ── DÉCOMPOSER ── */}
          {mode === 'decompose' && (
            <ScrollView contentContainerStyle={s.modeScroll} showsVerticalScrollIndicator={false}>
              <Text style={s.modeDesc}>Colle une tâche qui te semble trop grosse — Flowi la découpe en étapes concrètes et actionnables.</Text>
              <TextInput
                style={s.decomposeInput}
                value={decomposeText}
                onChangeText={setDecomposeText}
                placeholder="Ex: Préparer ma présentation pour jeudi..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
              <Pressable
                onPress={() => {
                  if (!decomposeText.trim() || decomposeLoading) return;
                  setDecomposeLoading(true);
                  setDecomposeResult(null);
                  decomposeTask(decomposeText.trim()).then((result) => {
                    setDecomposeResult(result);
                    setDecomposeLoading(false);
                  });
                }}
                style={[s.decomposeBtn, (decomposeLoading || !decomposeText.trim()) && { opacity: 0.5 }]}
              >
                <Text style={s.decomposeBtnText}>{decomposeLoading ? '⟳ Flowi découpe ta tâche...' : '✂️ Décomposer'}</Text>
              </Pressable>

              {decomposeResult && (
                <View style={{ gap: 6 }}>
                  {decomposeResult.intro && (
                    <Text style={s.decomposeIntro}>💬 {decomposeResult.intro}</Text>
                  )}
                  {(decomposeResult.steps || []).map((step: any, i: number) => (
                    <View key={i} style={s.stepRow}>
                      <LinearGradient colors={['#16A34A', '#059669']} style={s.stepCircle}>
                        <Text style={s.stepNum}>{i + 1}</Text>
                      </LinearGradient>
                      <Text style={{ fontSize: 18, flexShrink: 0 }}>{step.emoji}</Text>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={s.stepLabel}>{step.label}</Text>
                        <Text style={s.stepDur}>{step.dur}</Text>
                      </View>
                      <Pressable
                        onPress={() => { addTodo(step.label, 'normale', '', today); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
                        style={s.stepAddBtn}
                      >
                        <Text style={s.stepAddText}>+ Tâche</Text>
                      </Pressable>
                    </View>
                  ))}
                  <Pressable
                    onPress={() => {
                      (decomposeResult.steps || []).forEach((step: any) => addTodo(step.label, 'normale', '', today));
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }}
                    style={s.addAllBtn}
                  >
                    <Text style={s.addAllText}>↗ Toutes les étapes → Tâches</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      ) : (
        /* ═══ XP ═══ */
        (() => {
          const curLvl = [...XP_LEVELS].reverse().find((l) => xp >= l.min) || XP_LEVELS[0];
          const nextLvl = XP_LEVELS[curLvl.lvl] || null;
          const prgPct = nextLvl ? Math.min(100, Math.round(((xp - curLvl.min) / (nextLvl.min - curLvl.min)) * 100)) : 100;
          return (
        <FlatList
          data={xpLog.slice(-20).reverse()}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={s.xpScroll}
          ListHeaderComponent={
            <>
              {/* Level card (gold) */}
              <Animated.View entering={FadeIn.duration(400)}>
                <LinearGradient colors={['#FEFCE8', '#FEF9C3']} style={s.xpHeroCard}>
                  <Text style={{ fontSize: 40, marginBottom: 4 }}>{curLvl.emoji}</Text>
                  <Text style={s.xpHeroLabel}>{curLvl.label}</Text>
                  <Text style={s.xpHeroSub}>Niveau {curLvl.lvl} · {xp} XP</Text>
                  {nextLvl && (
                    <View style={{ width: '100%', marginTop: 12 }}>
                      <View style={s.xpHeroBarBg}>
                        <LinearGradient colors={['#F59E0B', '#EAB308']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.xpHeroBarFill, { width: `${prgPct}%` }]} />
                      </View>
                      <Text style={s.xpHeroNext}>{nextLvl.min - xp} XP avant {nextLvl.label} {nextLvl.emoji}</Text>
                    </View>
                  )}
                </LinearGradient>
              </Animated.View>

              {/* Badges grid */}
              <Text style={s.badgesSectionTitle}>🏅 Badges</Text>
              <View style={s.badgesGrid2}>
                {ALL_BADGES.map((b) => {
                  const earned = b.threshold > 0 ? xp >= b.threshold : badges.some((x) => x.id === b.id);
                  return (
                    <View key={b.id} style={[s.badgeCard2, earned ? s.badgeEarned : s.badgeLocked]}>
                      <Text style={{ fontSize: 22, marginBottom: 3 }}>{b.emoji}</Text>
                      <Text style={[s.badgeName, { color: earned ? '#92400E' : '#6B7280' }]}>{b.label}</Text>
                      <Text style={[s.badgeDesc, { color: earned ? '#B45309' : '#9CA3AF' }]}>{b.desc}</Text>
                    </View>
                  );
                })}
              </View>

              <Text style={[s.badgesSectionTitle, { marginTop: 16 }]}>📜 Historique</Text>
            </>
          }
          renderItem={({ item: entry }) => (
            <View style={s.xpRow}>
              <Text style={[s.xpReason, { color: t.text }]}>{entry.reason}</Text>
              <Text style={s.xpAmount}>+{entry.amount}</Text>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              emoji="⭐"
              title="Commence à gagner de l'XP !"
              subtitle="Complète des tâches, des habitudes et des routines pour monter en niveau."
              floatingEmojis={['🌱', '🔥', '💎', '🏆']}
            />
          }
        />
          );
        })()
      )}
    </View>
  );
}

const s = StyleSheet.create({
  // Tabs
  tabBar: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 },
  tab: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, backgroundColor: '#FAFBFF', borderWidth: 1.5, borderColor: '#E8EDF5' },
  tabActive: { backgroundColor: fl.light, borderColor: fl.accent },
  tabText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#9CA3AF' },
  tabTextActive: { fontFamily: 'Inter_700Bold', color: fl.accent },

  // Mode tabs
  modeTabs: {
    flexDirection: 'row', backgroundColor: '#F8F9FF',
    borderBottomWidth: 1.5, borderBottomColor: '#E8EDF5',
  },
  modeTab: {
    flex: 1, paddingVertical: 7, paddingHorizontal: 4,
    alignItems: 'center', gap: 2,
    borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  modeTabActive: { borderBottomColor: '#16A34A' },
  modeTabText: { fontFamily: 'Inter_400Regular', fontSize: 9, color: '#9CA3AF' },
  modeTabTextActive: { fontFamily: 'Inter_700Bold', color: '#16A34A' },

  // Chat
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 14,
  },
  chatHeaderAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  chatHeaderTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFFFFF' },
  chatHeaderSub: { fontFamily: 'Inter_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  chatScroll: { padding: 12, paddingBottom: 4 },
  msgAvatar: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 6, alignSelf: 'flex-end',
  },
  bubble: { maxWidth: '80%', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14 },
  userBubble: { backgroundColor: '#16A34A', borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E8EDF5', borderBottomLeftRadius: 4 },
  bubbleText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  loadingDots: { flexDirection: 'row', gap: 4, paddingVertical: 4 },
  loadingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#9CA3AF' },
  chatEmptyTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: '#16A34A', marginBottom: 6 },
  chatEmptySub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18, maxWidth: 260 },
  pillsRow: {
    paddingHorizontal: 10, paddingVertical: 4, paddingBottom: 6, gap: 4,
    backgroundColor: '#FFFFFF',
  },
  pill: {
    paddingVertical: 0, paddingHorizontal: 6, borderRadius: 10,
    borderWidth: 1, borderColor: '#D1FAE5', backgroundColor: '#F0FDF4', flexShrink: 0,
    height: 20, justifyContent: 'center',
  },
  pillText: { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#065F46' },
  inputBar: {
    flexDirection: 'row', padding: 8, paddingHorizontal: 10, gap: 6,
    backgroundColor: '#FFFFFF', alignItems: 'center',
  },
  chatInput: {
    flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E8EDF5', fontSize: 13,
    fontFamily: 'Inter_400Regular', color: '#1F2937', maxHeight: 80, backgroundColor: '#F9FAFB',
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sendBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },

  // Shared mode scroll
  modeScroll: { padding: 14, paddingBottom: 40 },
  modeDesc: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#6B7280', lineHeight: 17, marginBottom: 12 },

  // Plan du jour
  contextRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  contextCard: { flex: 1, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#F8F9FF', borderWidth: 1, borderColor: '#E8EDF5', alignItems: 'center' },
  contextNum: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18, lineHeight: 22 },
  contextLabel: { fontFamily: 'Inter_400Regular', fontSize: 9, color: '#9CA3AF' },
  generateBtn: { width: '100%', paddingVertical: 12, borderRadius: 12, backgroundColor: '#16A34A', alignItems: 'center', marginBottom: 12 },
  generateBtnText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#FFFFFF' },
  planMsg: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#86EFAC' },
  planMsgText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#166534', lineHeight: 20 },
  planFocus: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#EEF2FF', borderWidth: 1.5, borderColor: '#C7D2FE' },
  planFocusLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  planFocusText: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 14, color: '#1E1B4B' },
  planSuggestions: { borderRadius: 12, borderWidth: 1, borderColor: '#E8EDF5', overflow: 'hidden' },
  planSugLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, paddingVertical: 8, paddingHorizontal: 12 },
  planSugRow: { flexDirection: 'row', gap: 8, paddingVertical: 6, paddingHorizontal: 12, alignItems: 'flex-start' },
  planSugTask: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  planSugReason: { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#9CA3AF' },
  planConseil: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' },
  planConseilText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#92400E', lineHeight: 17 },

  // Décomposer
  decomposeInput: {
    borderWidth: 1.5, borderColor: '#E8EDF5', borderRadius: 9,
    padding: 10, paddingHorizontal: 12, fontSize: 13,
    fontFamily: 'Inter_400Regular', backgroundColor: '#FFFFFF', color: '#1F2937',
    lineHeight: 19, minHeight: 60, textAlignVertical: 'top', marginBottom: 8,
  },
  decomposeBtn: { width: '100%', paddingVertical: 10, borderRadius: 9, backgroundColor: '#16A34A', alignItems: 'center', marginBottom: 14 },
  decomposeBtnText: { fontFamily: 'Inter_700Bold', fontSize: 12, color: '#FFFFFF' },
  decomposeIntro: { fontFamily: 'Inter_700Bold', fontSize: 12, color: '#166534', fontStyle: 'italic', marginBottom: 4 },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: '#F8F9FF', borderWidth: 1.5, borderColor: '#E8EDF5',
  },
  stepCircle: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNum: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 11, color: '#FFFFFF' },
  stepLabel: { fontFamily: 'Inter_700Bold', fontSize: 12, color: '#1F2937', lineHeight: 16 },
  stepDur: { fontFamily: 'Inter_400Regular', fontSize: 9, color: '#9CA3AF', marginTop: 1 },
  stepAddBtn: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 7, borderWidth: 1, borderColor: '#D1FAE5', backgroundColor: '#F0FDF4', flexShrink: 0 },
  stepAddText: { fontFamily: 'Inter_700Bold', fontSize: 9, color: '#166534' },
  addAllBtn: {
    width: '100%', paddingVertical: 9, borderRadius: 10, borderWidth: 1.5,
    borderColor: '#D1FAE5', backgroundColor: '#F0FDF4', alignItems: 'center', marginTop: 2,
  },
  addAllText: { fontFamily: 'Inter_700Bold', fontSize: 12, color: '#166534' },

  // XP
  xpScroll: { padding: 14, paddingBottom: 40 },
  xpHeroCard: {
    borderRadius: 16, padding: 16, borderWidth: 2, borderColor: '#FDE047',
    alignItems: 'center', marginBottom: 16,
  },
  xpHeroLabel: { fontFamily: 'Inter_700Bold', fontSize: 20, color: '#92400E' },
  xpHeroSub: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#B45309', marginBottom: 0 },
  xpHeroBarBg: {
    height: 10, backgroundColor: '#FEF9C3', borderRadius: 5, overflow: 'hidden',
    borderWidth: 1, borderColor: '#FDE047', marginBottom: 5,
  },
  xpHeroBarFill: { height: '100%', borderRadius: 5 },
  xpHeroNext: { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#92400E', textAlign: 'center' },

  badgesSectionTitle: {
    fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  badgesGrid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badgeCard2: {
    width: '47%', padding: 10, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center',
  },
  badgeEarned: { backgroundColor: '#FEF9C3', borderColor: '#FDE047' },
  badgeLocked: { backgroundColor: '#F9FAFB', borderColor: '#E8EDF5', opacity: 0.5 },
  badgeName: { fontFamily: 'Inter_700Bold', fontSize: 10, lineHeight: 13 },
  badgeDesc: { fontFamily: 'Inter_400Regular', fontSize: 9, marginTop: 1 },

  xpRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E8EDF5' },
  xpReason: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13 },
  xpAmount: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#F59E0B' },
  empty: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
});
