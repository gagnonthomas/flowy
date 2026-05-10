import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFlowiStore } from '@/store';
import { SwipeTask } from '@/components/ui/SwipeTask';
import { TimePicker } from '@/components/ui/TimePicker';
import { colors, CATEGORIES, type CategoryKey } from '@/constants/colors';
import { getToday, MONTHS_FR, DAYS_FR, daysInMonth, firstDayOfMonth } from '@/utils/date';
import { fetchOracle as fetchOracleApi } from '@/utils/api';
import { useTheme } from '@/hooks/useTheme';
import { useDarkOverrides } from '@/hooks/useDarkOverrides';
import { RoutineTimer } from '@/components/ui/RoutineTimer';
import { AnimatedSubTab } from '@/components/ui/AnimatedSubTab';
import { StaggeredItem } from '@/components/ui/StaggeredItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { scheduleEventReminder } from '@/utils/notifications';
import { ScanModal } from '@/components/ui/ScanModal';
import { showToast } from '@/components/ui/Toast';
import { formatDateInput, formatTimeInput, validateDate, validateTime } from '@/utils/validate';
import type { Routine } from '@/types';

const pad = (n: number) => String(n).padStart(2, '0');

const PRIO_COLORS: Record<string, string> = { urgente: '#DC2626', haute: '#EA580C', normale: '#8B5CF6', basse: '#16A34A' };
const PRIO_ICONS: Record<string, string> = { urgente: '🔴', haute: '🟠', normale: '🔵', basse: '🟢' };
const ENERGY_LEVELS: [string, string, number][] = [['🪫', 'Épuisé', 1], ['⚡', 'Faible', 2], ['🔋', 'Moyen', 3], ['🔥', 'Élevé', 4], ['💥', 'Max', 5]];

const ROUTINE_COLORS = ['#F97316', '#8B5CF6', '#3B82F6', '#10B981', '#E11D48', '#F59E0B', '#06B6D4', '#84CC16'];
const BLOCK_COLORS = ['#FED7AA', '#C4B5FD', '#A7F3D0', '#BAE6FD', '#FCE7F3', '#FDE68A', '#FECDD3', '#D9F99D'];

interface DraftBlock { id: string; label: string; emoji: string; dur: number; color: string; }

export default function AujourdhuiScreen() {
  const router = useRouter();
  const todos = useFlowiStore((s) => s.todos);
  const events = useFlowiStore((s) => s.events);
  const habits = useFlowiStore((s) => s.habits);
  const toggleHabit = useFlowiStore((s) => s.toggleHabit);
  const routines = useFlowiStore((s) => s.routines);
  const addRoutine = useFlowiStore((s) => s.addRoutine);
  const routineLog = useFlowiStore((s) => s.routineLog);
  const energyLog = useFlowiStore((s) => s.energyLog);
  const setEnergy = useFlowiStore((s) => s.setEnergy);
  const addEvent = useFlowiStore((s) => s.addEvent);
  const toggleEventDone = useFlowiStore((s) => s.toggleEventDone);
  const completeTodo = useFlowiStore((s) => s.completeTodo);
  const deleteTodo = useFlowiStore((s) => s.deleteTodo);
  const today = getToday();

  const { t } = useTheme();
  const d = useDarkOverrides();
  const quickRoutineRequested = useFlowiStore((s) => s.quickRoutineRequested);
  const [subTab, setSubTab] = useState<'agenda' | 'routines'>('agenda');
  const [selDate, setSelDate] = useState(today);

  // If quick routine was requested from accueil, switch to routines tab
  useEffect(() => {
    if (quickRoutineRequested) {
      setSubTab('routines');
      useFlowiStore.setState({ quickRoutineRequested: false });
    }
  }, [quickRoutineRequested]);
  const [oracle, setOracle] = useState<string | null>(null);
  const [oracleLoading, setOracleLoading] = useState(false);

  // Scan modal
  const [scanVisible, setScanVisible] = useState(false);
  const [scanTarget, setScanTarget] = useState('agenda');

  // Active routine timer
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);

  // Quick routine 5 min
  const quickRoutine: Routine = {
    id: 'quick5', name: 'Routine rapide', emoji: '⚡', color: '#F59E0B',
    blocks: [
      { id: 'q1', label: '4 grandes respirations', emoji: '🌬️', dur: 1, color: '#BAE6FD' },
      { id: 'q2', label: 'Écris 1 chose à faire', emoji: '✏️', dur: 1, color: '#C4B5FD' },
      { id: 'q3', label: 'Bois un verre d\'eau', emoji: '💧', dur: 1, color: '#A7F3D0' },
      { id: 'q4', label: 'Lance-toi', emoji: '🚀', dur: 2, color: '#FDE68A' },
    ],
  };

  // Routine creator state
  const [creating, setCreating] = useState(false);
  const [rName, setRName] = useState('');
  const [rEmoji, setREmoji] = useState('🌅');
  const [rColor, setRColor] = useState('#F97316');
  const [draftBlocks, setDraftBlocks] = useState<DraftBlock[]>([]);
  const [blockLabel, setBlockLabel] = useState('');
  const [blockEmoji, setBlockEmoji] = useState('⭐');
  const [blockDur, setBlockDur] = useState('10');
  const [blockColor, setBlockColor] = useState('#FED7AA');
  const selD = new Date(selDate + 'T12:00:00');
  const selYear = selD.getFullYear();
  const selMonth = selD.getMonth();

  // Date nav
  const goDay = (offset: number) => {
    const d = new Date(selDate + 'T12:00:00');
    d.setDate(d.getDate() + offset);
    setSelDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const goMonth = (offset: number) => {
    const d = new Date(selDate + 'T12:00:00');
    d.setMonth(d.getMonth() + offset);
    d.setDate(1);
    setSelDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  };

  // Events for selected day
  const dayEvents = events
    .filter((e) => e.date === selDate)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  // Todos (pending for today, sorted by priority)
  const prioOrd: Record<string, number> = { urgente: 0, haute: 1, normale: 2, basse: 3 };
  const sortedTodos = todos
    .filter((t) => !t.done)
    .sort((a, b) => (prioOrd[a.priority] || 2) - (prioOrd[b.priority] || 2))
    .slice(0, 6);

  // Energy
  const nowH = new Date().getHours();
  const energyKey = `${selDate}-${nowH < 12 ? 'matin' : nowH < 18 ? 'apresmidi' : 'soir'}`;
  const currentEnergy = energyLog[energyKey] || 0;

  // Voix Flowi
  const pendingCount = todos.filter((t) => !t.done).length;
  const doneCount = todos.filter((t) => t.done && t.doneDate === today).length;
  const voixMsg = (() => {
    if (currentEnergy >= 4 && pendingCount > 0) return "Tu es en forme aujourd'hui — c'est le bon moment pour avancer sur ce qui compte. 🔥";
    if (currentEnergy <= 2 && currentEnergy > 0 && pendingCount > 3) return "Avec ton énergie du jour, une ou deux choses bien faites valent mieux que dix à moitié. 🌿";
    if (doneCount >= 3) return `Tu as déjà accompli ${doneCount} choses aujourd'hui. C'est réel, même si ça ne semble pas assez. ✨`;
    if (nowH >= 19) return "La journée tire à sa fin. Ce qui n'est pas fait attendra demain — sans jugement. 🌙";
    if (pendingCount === 0) return "Ta liste est vide. Profites-en pour souffler ou anticiper demain. 🌿";
    return null;
  })();

  // New event form
  const [newTitle, setNewTitle] = useState('');
  const [newEvDate, setNewEvDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newCat, setNewCat] = useState<CategoryKey>('rdv');

  // Priorités du jour (persisted)
  const storePrios = useFlowiStore((s) => s.dayPrios);
  const setStorePrios = useFlowiStore((s) => s.setDayPrios);
  const dayPrios: [string, string, string] = storePrios[selDate] || ['', '', ''];
  const [prioPickerOpen, setPrioPickerOpen] = useState<number | null>(null);
  const [prioInput, setPrioInput] = useState('');
  const setPrioSlot = (idx: number, val: string) => {
    const a = [...dayPrios] as [string, string, string]; a[idx] = val;
    setStorePrios(selDate, a);
    setPrioPickerOpen(null);
    setPrioInput('');
  };

  // Rappels (persisted)
  const storeRappels = useFlowiStore((s) => s.rappels);
  const setStoreRappels = useFlowiStore((s) => s.setRappels);
  const rappels = storeRappels[selDate] || ['', '', '', ''];
  const setRappel = (idx: number, val: string) => {
    const a = [...rappels]; a[idx] = val;
    setStoreRappels(selDate, a);
  };

  // Agenda notes (persisted)
  const storeAgendaNotes = useFlowiStore((s) => s.agendaNotes);
  const setAgendaNote = useFlowiStore((s) => s.setAgendaNote);

  const handleAddEvent = () => {
    if (!newTitle.trim()) return;
    const evDate = validateDate(newEvDate || selDate) || selDate;
    const evTime = validateTime(newTime);
    const evEndTime = validateTime(newEndTime);
    const title = newTitle.trim();
    addEvent({ title, date: evDate, time: evTime, endTime: evEndTime, category: newCat });
    // Schedule push notification 15 min before
    if (evTime) {
      scheduleEventReminder(`ev-${Date.now()}`, title, evDate, evTime, 15);
    }
    setNewTitle('');
    setNewEvDate('');
    setNewTime('');
    setNewEndTime('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Timeline hours
  // All 24 hours, scroll to 7h on mount
  const visibleHours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  const timelineScrollRef = useRef<ScrollView>(null);
  const ROW_HEIGHT = 26;

  // Scroll to (current hour - 1) whenever agenda tab is shown
  useEffect(() => {
    if (subTab === 'agenda') {
      const scrollToHour = Math.max(0, nowH - 1);
      const timer = setTimeout(() => {
        timelineScrollRef.current?.scrollTo({ y: scrollToHour * ROW_HEIGHT, animated: false });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [subTab]);

  // Mini calendar
  const calFirst = firstDayOfMonth(selYear, selMonth);
  const calDays = daysInMonth(selYear, selMonth);

  // Routine helpers
  const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const getLast7 = (routineId: string) => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      days.push({ date: ds, done: !!routineLog[`${routineId}-${ds}`], isToday: ds === today });
    }
    return days;
  };
  const getStreak = (routineId: string) => {
    let s = 0; const d = new Date();
    while (true) {
      const ds = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      if (routineLog[`${routineId}-${ds}`]) { s++; d.setDate(d.getDate() - 1); } else break;
    }
    return s;
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.screenBg }}>
      {/* Sub-tabs */}
      <View style={styles.subTabBar}>
        {(['agenda', 'routines'] as const).map((t) => (
          <Pressable key={t} onPress={() => setSubTab(t)} style={[styles.subTab, d.tab, subTab === t && styles.subTabActive]}>
            <Text style={[styles.subTabText, subTab === t && styles.subTabTextActive]}>
              {t === 'agenda' ? 'Agenda' : 'Routines'}
            </Text>
          </Pressable>
        ))}
      </View>

      {subTab === 'agenda' ? (
      <AnimatedSubTab key="agenda">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: t.screenBg }]} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── DATE HEADER ── */}
        <LinearGradient colors={['#E8F4FD', '#EDE8F5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dateHeader}>
          {/* Left: big date */}
          <View style={styles.dateLeft}>
            <Text style={styles.dayOfWeek}>
              {selD.toLocaleDateString('fr-FR', { weekday: 'long' })}
            </Text>
            <Text style={styles.bigDate}>{selD.getDate()}</Text>
            <Text style={styles.monthYear}>{MONTHS_FR[selMonth]} {selYear}</Text>
            <View style={styles.dateNav}>
              <Pressable onPress={() => goDay(-1)} style={styles.dateNavBtn}><Text style={styles.dateNavText}>{'<'}</Text></Pressable>
              <Pressable onPress={() => goDay(1)} style={styles.dateNavBtn}><Text style={styles.dateNavText}>{'>'}</Text></Pressable>
            </View>
          </View>

          {/* Right: mini calendar */}
          <View style={styles.dateRight}>
            <View style={styles.calNavRow}>
              <Pressable onPress={() => goMonth(-1)}><Text style={styles.calNavArrow}>{'<'}</Text></Pressable>
              <Text style={styles.calMonthLabel}>{MONTHS_FR[selMonth]}</Text>
              <Pressable onPress={() => goMonth(1)}><Text style={styles.calNavArrow}>{'>'}</Text></Pressable>
            </View>
            <View style={styles.calDayHeaders}>
              {DAYS_FR.map((d, i) => (
                <Text key={i} style={[styles.calDayHeader, i >= 5 && { color: '#F43F5E' }]}>{d[0]}</Text>
              ))}
            </View>
            <View style={styles.calGrid}>
              {Array.from({ length: calFirst }).map((_, i) => <View key={`e${i}`} style={styles.calCell} />)}
              {Array.from({ length: calDays }).map((_, i) => {
                const day = i + 1;
                const ds = `${selYear}-${pad(selMonth + 1)}-${pad(day)}`;
                const isToday = ds === today;
                const isSel = ds === selDate;
                return (
                  <Pressable key={day} onPress={() => setSelDate(ds)} style={[styles.calCell, isSel && styles.calCellSel, !isSel && isToday && styles.calCellToday]}>
                    <Text style={[styles.calDayNum, isSel && styles.calDayNumSel, !isSel && isToday && styles.calDayNumToday, (isSel || isToday) && { fontWeight: '800' }]}>
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </LinearGradient>

        {/* ── PENSÉE DU JOUR ── */}
        <Pressable
          onPress={() => {
            if (!oracle || oracleLoading) {
              setOracleLoading(true);
              fetchOracleApi().then((text) => {
                setOracle(text || "Chaque petit pas compte. Tu avances, même quand tu ne le vois pas. 🌿");
                setOracleLoading(false);
              });
            }
          }}
          style={[styles.oracleCard, d.oracleCard]}
        >
          <View style={styles.oracleDecor} />
          <View style={styles.oracleRow}>
            <Text style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>✨</Text>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.oracleLabel}>Pensée du jour</Text>
              {oracleLoading ? (
                <View style={styles.oracleDots}>
                  {[0, 1, 2].map((d) => <View key={d} style={styles.oracleDot} />)}
                </View>
              ) : oracle ? (
                <Text style={styles.oracleText}>{oracle}</Text>
              ) : (
                <Text style={styles.oraclePlaceholder}>Touche pour recevoir ta pensée du jour 🌿</Text>
              )}
            </View>
            {oracle && !oracleLoading && (
              <Pressable onPress={() => { setOracle(null); setOracleLoading(false); }}>
                <Text style={styles.oracleRefresh}>↺</Text>
              </Pressable>
            )}
          </View>
        </Pressable>

        {/* ── VOIX FLOWI ── */}
        {voixMsg && (
          <Text style={styles.voixFlowi}>{voixMsg}</Text>
        )}

        {/* ── SCAN AGENDA PAPIER ── */}
        <ScanModal
          visible={scanVisible}
          target={scanTarget}
          onClose={() => setScanVisible(false)}
          onImport={(items) => {
            items.forEach((text) => addEvent({ title: text, date: selDate, time: null, endTime: null, category: 'rdv' }));
          }}
        />
        <Pressable onPress={() => { setScanTarget('agenda'); setScanVisible(true); }} style={[styles.scanBtn, d.scanBtn]}>
          <Text style={{ fontSize: 14 }}>📷</Text>
          <Text style={styles.scanText}>Importer depuis un agenda papier</Text>
        </Pressable>

        {/* ── ADD EVENT FORM ── */}
        <View style={[styles.addEventCard, d.rdvCard]}>
          {/* Titre + bouton */}
          <View style={styles.addEventRow}>
            <TextInput
              style={styles.addEventInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Titre du rendez-vous..."
              placeholderTextColor="#93C5FD"
              returnKeyType="done"
              onSubmitEditing={handleAddEvent}
            />
            <Pressable onPress={handleAddEvent} style={styles.addEventBtn}>
              <Text style={styles.addEventBtnText}>+</Text>
            </Pressable>
          </View>
          {/* Date + Heures */}
          <View style={styles.addEventDateRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Date</Text>
              <TextInput
                style={styles.addEventDateInput}
                value={newEvDate || selDate}
                onChangeText={(v) => setNewEvDate(formatDateInput(v))}
                placeholder="AAAA-MM-JJ"
                placeholderTextColor="#93C5FD"
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
            <View style={styles.timeRangeRow}>
              <TextInput
                style={styles.timeInput}
                value={newTime}
                onChangeText={(v) => setNewTime(formatTimeInput(v))}
                placeholder="--:--"
                placeholderTextColor="#93C5FD"
                keyboardType="number-pad"
                maxLength={5}
              />
              <Text style={{ fontSize: 12 }}>🕐</Text>
              <Text style={styles.timeArrow}>→</Text>
              <TextInput
                style={styles.timeInput}
                value={newEndTime}
                onChangeText={(v) => setNewEndTime(formatTimeInput(v))}
                placeholder="--:--"
                placeholderTextColor="#93C5FD"
                keyboardType="number-pad"
                maxLength={5}
              />
              <Text style={{ fontSize: 12 }}>🕐</Text>
            </View>
          </View>
          {/* Catégories */}
          <View style={styles.catRow}>
            {(Object.entries(CATEGORIES) as [CategoryKey, typeof CATEGORIES[CategoryKey]][]).map(([k, cat]) => (
              <Pressable key={k} onPress={() => setNewCat(k)} style={[styles.catPill, { borderColor: newCat === k ? cat.color : '#E8EDF5', backgroundColor: newCat === k ? cat.bg : '#FFFFFF' }]}>
                <Text style={[styles.catPillText, { color: newCat === k ? cat.color : '#8090B0' }]}>{cat.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── TIMELINE ── */}
        <View style={[styles.timelineCard, d.timelineCard]}>
          <View style={styles.timelineHeader}>
            <Text style={styles.timelineTitle}>⏰ Horaire</Text>
            {dayEvents.length > 0 && (
              <Text style={styles.timelineCount}>
                {dayEvents.filter((e) => e.done).length}/{dayEvents.length} accomplis ✓
              </Text>
            )}
          </View>
          <ScrollView
            ref={timelineScrollRef}
            nestedScrollEnabled
            showsVerticalScrollIndicator
            style={{ maxHeight: 300 }}
          >
          {visibleHours.map((h, idx) => {
            const hStr = pad(h) + ':';
            const hEvts = dayEvents.filter((ev) => ev.time?.startsWith(hStr));
            const hasContent = hEvts.length > 0;
            const isCurrent = selDate === today && h === nowH;
            const timeColor = h < 12 ? '#3B82F6' : h < 18 ? '#8B5CF6' : '#1E3A8A';
            const prevH = visibleHours[idx - 1];
            const showGap = idx > 0 && h - prevH > 1;

            return (
              <View key={h}>
                {showGap && (
                  <View style={styles.gapRow}>
                    <View style={styles.gapLine} />
                    <Text style={styles.gapDots}>···</Text>
                    <View style={styles.gapLine} />
                  </View>
                )}
                <View style={[styles.timelineRow, { borderLeftColor: isCurrent ? '#EF4444' : hasContent ? timeColor + '88' : '#EEF0F8' }]}>
                  <Text style={[styles.hourLabel, { color: isCurrent ? '#EF4444' : hasContent ? timeColor : '#C4C9D4' }]}>{h}h</Text>
                  <View style={{ flex: 1 }}>
                    {hEvts.map((ev) => {
                      const cat = CATEGORIES[ev.category] || { color: '#6B7280', bg: '#F9FAFB' };
                      return (
                        <Pressable key={ev.id} onPress={() => { toggleEventDone(ev.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                          <View style={[styles.timelineEvt, { backgroundColor: ev.done ? '#F8F8F8' : cat.bg, borderColor: ev.done ? '#E8EDF5' : cat.color + '44' }]}>
                            <View style={[styles.timelineEvtBar, { backgroundColor: ev.done ? '#D1D5DB' : cat.color }]} />
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.timelineEvtTitle, ev.done && { color: '#9CA3AF', textDecorationLine: 'line-through' }]} numberOfLines={1}>{ev.title}</Text>
                              <Text style={[styles.timelineEvtTime, { color: cat.color }]}>{ev.time}{ev.endTime ? ` → ${ev.endTime}` : ''}</Text>
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                    {!hasContent && (
                      <Text style={styles.hourPlaceholder}>
                        {h === 0 ? 'Minuit' : h === 6 ? 'Matin' : h === 12 ? 'Midi' : h === 18 ? 'Soirée' : '—'}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
          </ScrollView>
        </View>

        {/* ── PRIORITÉS DU JOUR ── */}
        <View style={[styles.prioCard, d.prioCard]}>
          <Text style={styles.prioTitle}>🎯 Priorités du jour</Text>
          {[0, 1, 2].map((i) => {
            const val = dayPrios[i];
            const isDone = val ? todos.some((t) => t.text === val && t.done) : false;
            return (
              <View key={i} style={styles.prioSlotRow}>
                <View style={[styles.prioCircle, { backgroundColor: val ? '#3B82F6' : '#DBEAFE' }]}>
                  <Text style={[styles.prioCircleText, { color: val ? '#FFFFFF' : '#93C5FD' }]}>
                    {isDone ? '✓' : String(i + 1)}
                  </Text>
                </View>
                {val ? (
                  <View style={[styles.prioSlotFilled, { backgroundColor: isDone ? '#F0FDF4' : '#EFF6FF', borderColor: isDone ? '#86EFAC' : '#BFDBFE' }]}>
                    <Text style={[styles.prioSlotText, { color: isDone ? '#15803D' : '#1E40AF', textDecorationLine: isDone ? 'line-through' : 'none' }]} numberOfLines={1}>{val}</Text>
                    <Pressable onPress={() => setPrioSlot(i, '')}>
                      <Text style={{ fontSize: 12, color: '#93C5FD' }}>×</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable onPress={() => { setPrioPickerOpen(prioPickerOpen === i ? null : i); setPrioInput(''); }} style={styles.prioSlotEmpty}>
                    <Text style={styles.prioSlotEmptyText}>+ Choisir une tâche</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
          {/* Picker */}
          {prioPickerOpen !== null && (
            <View style={styles.prioPicker}>
              <View style={styles.prioPickerInputRow}>
                <TextInput
                  style={styles.prioPickerInput}
                  value={prioInput}
                  onChangeText={setPrioInput}
                  placeholder="Ou écris une priorité..."
                  placeholderTextColor="#93C5FD"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() => { if (prioInput.trim()) setPrioSlot(prioPickerOpen, prioInput.trim()); }}
                />
                <Pressable onPress={() => setPrioPickerOpen(null)}>
                  <Text style={{ fontSize: 14, color: '#93C5FD' }}>×</Text>
                </Pressable>
              </View>
              {todos.filter((t) => !t.done && !dayPrios.includes(t.text)).slice(0, 8).map((t) => (
                <Pressable key={t.id} onPress={() => setPrioSlot(prioPickerOpen!, t.text)} style={styles.prioPickerItem}>
                  <Text style={{ fontSize: 11, flexShrink: 0 }}>{PRIO_ICONS[t.priority] || '🔵'}</Text>
                  <Text style={styles.prioPickerItemText} numberOfLines={1}>{t.text}</Text>
                </Pressable>
              ))}
              {todos.filter((t) => !t.done && !dayPrios.includes(t.text)).length === 0 && (
                <Text style={styles.prioPickerEmpty}>Aucune tâche disponible</Text>
              )}
            </View>
          )}
        </View>

        {/* ── RAPPELS ── */}
        <View style={[styles.rappelCard, d.rappelCard]}>
          <Text style={styles.rappelTitle}>🔔 Rappels</Text>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.rappelRow}>
              <View style={styles.rappelDot} />
              <TextInput
                style={styles.rappelInput}
                value={rappels[i]}
                onChangeText={(v) => setRappel(i, v)}
                placeholder={`Rappel ${i + 1}...`}
                placeholderTextColor="#FECACA"
              />
            </View>
          ))}
        </View>

        {/* ── TÂCHES ── */}
        <View style={[styles.taskCard, d.taskCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.taskHeaderText}>✅ Tâches</Text>
            <Pressable onPress={() => router.replace('/(tabs)/taches' as any)}>
              <Text style={styles.taskLink}>Voir tout →</Text>
            </Pressable>
          </View>
          {sortedTodos.length === 0 ? (
            <Text style={styles.taskEmpty}>Aucune tâche !</Text>
          ) : (
            sortedTodos.map((t) => {
              const col = PRIO_COLORS[t.priority] || '#8B5CF6';
              const ico = PRIO_ICONS[t.priority] || '🔵';
              const isOverdue = t.due && t.due < today;
              return (
                <SwipeTask key={t.id} onComplete={() => completeTodo(t.id)} onDelete={() => deleteTodo(t.id)}>
                  <View style={styles.taskRow}>
                    <Pressable onPress={() => { completeTodo(t.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={[styles.taskCheck, { borderColor: col }]} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.taskText, { color: col }]} numberOfLines={1}>{ico} {t.text}</Text>
                      {t.due && <Text style={[styles.taskDue, isOverdue && { color: '#DC2626' }]}>📅 {new Date(t.due + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</Text>}
                    </View>
                  </View>
                </SwipeTask>
              );
            })
          )}
        </View>

        {/* ── ÉNERGIE ── */}
        <View style={[styles.energyCard, d.energyCard]}>
          <Text style={styles.energyTitle}>⚡ Énergie</Text>
          <View style={styles.energyRow}>
            {ENERGY_LEVELS.map(([emoji, label, val]) => {
              const sel = currentEnergy === val;
              return (
                <Pressable
                  key={val}
                  onPress={() => { setEnergy(energyKey, val); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                  style={[styles.energyBtn, { borderColor: sel ? '#EC4899' : '#F3BAD6', backgroundColor: sel ? '#FCE7F3' : '#FFFFFF' }]}
                >
                  <Text style={{ fontSize: 18 }}>{emoji}</Text>
                  <Text style={[styles.energyLabel, { color: sel ? '#9D174D' : '#C084A0' }]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── NOTES ── */}
        <View style={[styles.notesCard, d.notesCard]}>
          <Text style={styles.notesTitle}>📝 Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={storeAgendaNotes[selDate] || ''}
            onChangeText={(v) => setAgendaNote(selDate, v)}
            placeholder="Notes libres..."
            placeholderTextColor="#6EE7B7"
            multiline
            numberOfLines={3}
          />
        </View>

      </ScrollView>
      </KeyboardAvoidingView>
      </AnimatedSubTab>
      ) : (
      /* ═══ ROUTINES ═══ */
      <AnimatedSubTab key="routines">
      <ScrollView style={[styles.container, { backgroundColor: t.screenBg }]} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Active routine timer */}
        {activeRoutine && (
          <RoutineTimer routine={activeRoutine} onStop={() => setActiveRoutine(null)} />
        )}

        {/* Routine rapide 5 min */}
        {!activeRoutine && (
        <Pressable onPress={() => setActiveRoutine(quickRoutine)} style={styles.quickRoutine}>
          <View style={styles.quickIcon}>
            <Text style={{ fontSize: 22 }}>⚡</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.quickTitle}>Routine rapide · 5 min</Text>
            <Text style={styles.quickDesc}>Pour les jours où tout déraille 🌬️ 🎯 💧 🚀</Text>
          </View>
          <Text style={{ fontSize: 22, color: '#F59E0B' }}>▶</Text>
        </Pressable>
        )}

        {!activeRoutine && (<>
        {/* Suggestion Flowi */}
        {(() => {
          let suggestion: { text: string; routineId: string } | null = null;
          if (nowH >= 5 && nowH < 11) {
            suggestion = { text: 'Belle énergie ce matin ⚡ — parfait pour lancer ta routine !', routineId: 'r1' };
          } else if (nowH >= 20 || nowH < 5) {
            suggestion = { text: "C'est l'heure de décompresser 🌙 — ta routine du soir t'attend.", routineId: 'r2' };
          }
          if (!suggestion) return null;
          const suggestedR = routines.find((r) => r.id === suggestion!.routineId);
          if (!suggestedR) return null;
          return (
            <View style={styles.suggestCard}>
              <Text style={{ fontSize: 20, flexShrink: 0 }}>🌿</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.suggestText}>{suggestion.text}</Text>
                <Pressable style={styles.suggestBtn}>
                  <Text style={styles.suggestBtnText}>▶ {suggestedR.name}</Text>
                </Pressable>
              </View>
            </View>
          );
        })()}

        {/* Voix Flowi */}
        {(() => {
          let bestStreak = 0;
          routines.forEach((r) => { const s = getStreak(r.id); if (s > bestStreak) bestStreak = s; });
          let msg: string | null = null;
          if (bestStreak >= 7) msg = "7 jours d'affilée — tu construis quelque chose de solide. 🔥";
          else if (bestStreak >= 3) msg = "3 jours consécutifs. La régularité commence à s'installer. 🌿";
          else if (nowH >= 20) msg = "Avant de terminer la journée — ta routine du soir t'attend. 🌙";
          else if (nowH >= 5 && nowH < 10) msg = "Commencer la journée avec une routine, c'est lui donner une direction. ☀️";
          if (!msg) return null;
          return <Text style={styles.voixFlowi}>{msg}</Text>;
        })()}

        {/* Mes routines */}
        <Text style={styles.routineSectionLabel}>Mes routines</Text>
        {routines.length === 0 && (
          <View style={{ alignItems: 'center', padding: 16 }}>
            <Text style={{ fontSize: 24, marginBottom: 8 }}>🔁</Text>
            <Text style={styles.routineEmpty}>Aucune routine pour l'instant.</Text>
          </View>
        )}
        {routines.map((r, ri) => {
          const totalMin = r.blocks.reduce((sum, b) => sum + b.dur, 0);
          const rColor = r.color || '#F97316';
          const streak = getStreak(r.id);
          const last7 = getLast7(r.id);
          return (
            <StaggeredItem key={r.id} index={ri}>
            <View style={[styles.routineCard, { borderColor: rColor + '33' }]}>
              {/* Header */}
              <View style={[styles.routineHeader, { backgroundColor: rColor + '10' }]}>
                <View style={[styles.routineIcon, { backgroundColor: rColor + '22', borderColor: rColor + '44' }]}>
                  <Text style={{ fontSize: 22 }}>{r.emoji || '🔁'}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.routineName}>{r.name}</Text>
                  <Text style={styles.routineMeta}>{r.blocks.length} étapes · {totalMin} min</Text>
                </View>
                {streak > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                    <Text style={{ fontSize: 14 }}>🔥</Text>
                    <Text style={{ fontSize: 13, color: '#F97316', fontWeight: '800' }}>{streak}</Text>
                  </View>
                )}
                <Pressable onPress={() => setActiveRoutine(r)}>
                  <Text style={{ fontSize: 20, color: rColor, flexShrink: 0 }}>▶</Text>
                </Pressable>
              </View>
              {/* Block pills */}
              <View style={styles.blockPills}>
                {r.blocks.map((b) => (
                  <View key={b.id} style={[styles.blockPill, { backgroundColor: b.color || '#F3F4F6', borderColor: (b.color || '#E8EDF5') + '88' }]}>
                    <Text style={{ fontSize: 11 }}>{b.emoji}</Text>
                    <Text style={styles.blockLabel}>{b.label}</Text>
                    <Text style={styles.blockDur}>{b.dur}m</Text>
                  </View>
                ))}
              </View>
              {/* Week dots */}
              <View style={styles.weekDots}>
                {last7.map((day, i) => {
                  const dayIdx = (new Date(day.date + 'T12:00:00').getDay() + 6) % 7;
                  return (
                    <View key={i} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
                      <Text style={[styles.weekDotLetter, day.isToday && { color: rColor, fontWeight: '800' }]}>{DAY_LETTERS[dayIdx]}</Text>
                      <View style={[styles.weekDot, { backgroundColor: day.done ? rColor : day.isToday ? '#E8EDF5' : '#F3F4F6', borderColor: day.done ? rColor : day.isToday ? rColor + '66' : '#E8EDF5' }]} />
                    </View>
                  );
                })}
              </View>
            </View>
            </StaggeredItem>
          );
        })}

        {/* ── CRÉER UNE ROUTINE ── */}
        <View style={styles.createCard}>
          <Pressable onPress={() => setCreating((v) => !v)} style={[styles.createToggle, creating && { backgroundColor: '#FFF7ED', borderBottomWidth: 1, borderBottomColor: '#FED7AA' }]}>
            <Text style={{ fontSize: 16 }}>{creating ? '▲' : '＋'}</Text>
            <Text style={[styles.createToggleText, creating && { color: '#9A3412' }]}>Créer une routine</Text>
          </Pressable>

          {creating && (
            <View style={styles.createBody}>
              {/* Nom + emoji */}
              <View style={styles.createRow}>
                <TextInput style={styles.emojiInput} value={rEmoji} onChangeText={setREmoji} maxLength={2} />
                <TextInput style={[styles.createInput, { flex: 1 }]} value={rName} onChangeText={setRName} placeholder="Nom de la routine..." placeholderTextColor="#B0B8C8" />
              </View>

              {/* Couleur */}
              <View style={styles.colorRow}>
                {ROUTINE_COLORS.map((c) => (
                  <Pressable key={c} onPress={() => setRColor(c)} style={[styles.colorDot, { backgroundColor: c }, rColor === c && styles.colorDotSel]} />
                ))}
              </View>

              {/* Blocs existants */}
              {draftBlocks.map((b, bi) => (
                <View key={bi} style={[styles.draftBlock, { backgroundColor: b.color + '33', borderColor: b.color + '66' }]}>
                  <Text style={{ fontSize: 14 }}>{b.emoji}</Text>
                  <Text style={styles.draftBlockLabel}>{b.label}</Text>
                  <Text style={styles.draftBlockDur}>{b.dur}min</Text>
                  <Pressable onPress={() => setDraftBlocks((p) => p.filter((_, i) => i !== bi))}>
                    <Text style={{ fontSize: 12, color: '#D1D5DB' }}>×</Text>
                  </Pressable>
                </View>
              ))}

              {/* Ajouter un bloc */}
              <View style={styles.addBlockCard}>
                <Text style={styles.addBlockTitle}>Ajouter un bloc</Text>
                <View style={styles.createRow}>
                  <TextInput style={styles.emojiInput} value={blockEmoji} onChangeText={setBlockEmoji} maxLength={2} />
                  <TextInput style={[styles.createInput, { flex: 1 }]} value={blockLabel} onChangeText={setBlockLabel} placeholder="Nom du bloc..." placeholderTextColor="#B0B8C8" />
                  <TextInput style={[styles.createInput, { width: 44, textAlign: 'center' }]} value={blockDur} onChangeText={setBlockDur} keyboardType="numeric" />
                  <Text style={{ fontSize: 10, color: '#9CA3AF' }}>min</Text>
                </View>
                <View style={styles.colorRow}>
                  {BLOCK_COLORS.map((c) => (
                    <Pressable key={c} onPress={() => setBlockColor(c)} style={[styles.colorDotSm, { backgroundColor: c }, blockColor === c && styles.colorDotSmSel]} />
                  ))}
                </View>
                <Pressable
                  onPress={() => {
                    if (!blockLabel.trim()) return;
                    setDraftBlocks((p) => [...p, { id: String(Date.now()), label: blockLabel.trim(), emoji: blockEmoji, dur: parseInt(blockDur) || 10, color: blockColor }]);
                    setBlockLabel(''); setBlockEmoji('⭐'); setBlockDur('10');
                  }}
                  style={styles.addBlockBtn}
                >
                  <Text style={styles.addBlockBtnText}>+ Ajouter ce bloc</Text>
                </Pressable>
              </View>

              {/* Sauvegarder */}
              <Pressable
                onPress={() => {
                  if (!rName.trim() || draftBlocks.length === 0) return;
                  addRoutine({ name: rName, emoji: rEmoji || '🔁', color: rColor, blocks: draftBlocks });
                  setRName(''); setREmoji('🌅'); setRColor('#F97316'); setDraftBlocks([]); setCreating(false);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
                style={[styles.saveRoutineBtn, (!rName.trim() || draftBlocks.length === 0) && { opacity: 0.4 }]}
              >
                <Text style={styles.saveRoutineBtnText}>💾 Enregistrer la routine</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Astuce */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 Astuce focus</Text>
          <Text style={styles.tipText}>Commence par le plus facile. Chaque bloc accompli = dopamine ! Les routines construisent des automatismes.</Text>
        </View>

        </>)}

        {/* Habitudes */}
        <Text style={styles.routineSectionLabel}>Habitudes</Text>
        <View style={styles.habitsWrap}>
          {habits.map((h) => {
            const done = h.done[today];
            return (
              <Pressable
                key={h.id}
                onPress={() => { toggleHabit(h.id, today); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[styles.habitChip, { backgroundColor: done ? '#D1FAE5' : '#FFFFFF', borderColor: done ? '#6EE7B7' : '#E8EDF5' }]}
              >
                <Text style={{ fontSize: 13 }}>{h.icon}</Text>
                <Text style={[styles.habitChipText, { color: done ? '#065F46' : '#9CA3AF', fontWeight: done ? '700' : '400' }]}>{h.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      </AnimatedSubTab>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Sub-tabs
  subTabBar: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 },
  subTab: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, backgroundColor: '#FAFBFF', borderWidth: 1.5, borderColor: '#E8EDF5' },
  subTabActive: { backgroundColor: colors.agenda.light, borderColor: colors.agenda.accent },
  subTabText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#9CA3AF' },
  subTabTextActive: { fontFamily: 'Inter_700Bold', color: colors.agenda.accent },

  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { padding: 8, paddingHorizontal: 14, paddingBottom: 40, gap: 8 },

  // Date header (compact)
  dateHeader: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#BAD8FB',
    overflow: 'hidden',
  },
  dateLeft: {
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: '#BAD8FB',
  },
  dayOfWeek: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#8090B0',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bigDate: {
    fontFamily: 'Inter_700Bold',
    fontSize: 52,
    color: '#3B82F6',
    lineHeight: 56,
  },
  monthYear: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#6080B0',
    marginBottom: 3,
  },
  dateNav: { flexDirection: 'row', gap: 3 },
  dateNavBtn: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#BAD8FB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNavText: { fontSize: 14, color: '#3B82F6', fontWeight: '700' },

  // Mini calendar (compact)
  dateRight: { width: '50%', padding: 2, paddingHorizontal: 5 },
  calNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 1 },
  calNavArrow: { fontSize: 12, color: '#3B82F6', fontWeight: '700' },
  calMonthLabel: { fontFamily: 'Inter_700Bold', fontSize: 12, color: '#1E3A8A' },
  calDayHeaders: { flexDirection: 'row', marginBottom: 1 },
  calDayHeader: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 10, color: '#8090B0', textAlign: 'center', lineHeight: 13 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 2 },
  calCellSel: { backgroundColor: '#3B82F6' },
  calCellToday: { backgroundColor: '#DBEAFE' },
  calDayNum: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#1E3A8A', lineHeight: 14 },
  calDayNumSel: { color: '#FFFFFF' },
  calDayNumToday: { color: '#1D4ED8' },

  // Priorités du jour
  prioCard: {
    borderRadius: 12, borderWidth: 1.5, borderColor: '#BAD8FB',
    backgroundColor: '#FFFFFF', padding: 7, paddingHorizontal: 9, position: 'relative',
  },
  prioTitle: {
    fontFamily: 'Inter_700Bold', fontSize: 10, color: '#1E3A8A',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
  },
  prioSlotRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  prioCircle: {
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  prioCircleText: { fontSize: 8, fontWeight: '800' },
  prioSlotFilled: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 3, paddingHorizontal: 7, borderRadius: 7, borderWidth: 1,
  },
  prioSlotText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  prioSlotEmpty: {
    flex: 1, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 7,
    borderWidth: 1, borderStyle: 'dashed', borderColor: '#BFDBFE',
  },
  prioSlotEmptyText: { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#93C5FD' },
  prioPicker: {
    marginTop: 4, borderRadius: 10, borderWidth: 1.5, borderColor: '#BFDBFE',
    backgroundColor: '#FFFFFF', overflow: 'hidden',
  },
  prioPickerInputRow: {
    flexDirection: 'row', gap: 6, paddingVertical: 6, paddingHorizontal: 10,
    borderBottomWidth: 1, borderBottomColor: '#EFF6FF',
  },
  prioPickerInput: {
    flex: 1, fontSize: 11, fontFamily: 'Inter_400Regular', color: '#1E40AF', padding: 0,
  },
  prioPickerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 7, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFF',
  },
  prioPickerItemText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#1F2937', flex: 1 },
  prioPickerEmpty: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#D1D5DB', textAlign: 'center', padding: 12 },

  // Rappels
  rappelCard: {
    borderRadius: 12, borderWidth: 1.5, borderColor: '#FCA5A5',
    backgroundColor: '#FFFFFF', padding: 7, paddingHorizontal: 9,
  },
  rappelTitle: {
    fontFamily: 'Inter_700Bold', fontSize: 10, color: '#7F1D1D',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5,
  },
  rappelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  rappelDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#EF4444', flexShrink: 0 },
  rappelInput: {
    flex: 1, borderBottomWidth: 1, borderBottomColor: '#FECACA',
    fontSize: 11, fontFamily: 'Inter_400Regular', color: '#7F1D1D',
    paddingVertical: 2, padding: 0,
  },

  // Pensée du jour
  oracleCard: {
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
    padding: 14,
    paddingBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  oracleDecor: {
    position: 'absolute',
    right: -10,
    top: -10,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(139,92,246,0.06)',
  },
  oracleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  oracleLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#8B5CF6',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  oracleDots: { flexDirection: 'row', gap: 4, alignItems: 'center', paddingTop: 2 },
  oracleDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#C4B5FD' },
  oracleText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 13,
    color: '#4C1D95',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  oraclePlaceholder: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#A78BFA',
    fontWeight: '500',
    lineHeight: 18,
  },
  oracleRefresh: { fontSize: 14, color: '#A78BFA', flexShrink: 0, marginTop: 1 },

  // Scan agenda
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  scanText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#1E40AF' },

  // Voix Flowi
  voixFlowi: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 11,
    color: '#8B5CF6',
    fontStyle: 'italic',
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 4,
    opacity: 0.85,
  },

  // Add event
  addEventCard: {
    borderRadius: 12,
    backgroundColor: colors.agenda.light,
    borderWidth: 1.5,
    borderColor: colors.agenda.border,
    padding: 10,
    paddingHorizontal: 12,
  },
  addEventRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  addEventInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.agenda.border,
    borderRadius: 9,
    paddingVertical: 7,
    paddingHorizontal: 10,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    backgroundColor: '#FFFFFF',
    color: colors.text,
  },
  addEventBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 9,
    backgroundColor: colors.agenda.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addEventBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  addEventDateRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-end', marginBottom: 8 },
  timeRangeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeInput: {
    width: 50, borderWidth: 1.5, borderColor: colors.agenda.border, borderRadius: 9,
    paddingVertical: 5, paddingHorizontal: 4, fontSize: 12,
    fontFamily: 'Inter_600SemiBold', backgroundColor: '#FFFFFF', color: '#1E3A8A',
    textAlign: 'center',
  },
  timeArrow: { fontSize: 12, color: '#BAD8FB' },
  addEventDateInput: {
    borderWidth: 1.5, borderColor: colors.agenda.border, borderRadius: 9,
    paddingVertical: 5, paddingHorizontal: 7, fontSize: 11,
    fontFamily: 'Inter_400Regular', backgroundColor: '#FFFFFF', color: '#1E3A8A',
  },
  fieldLabel: {
    fontFamily: 'Inter_700Bold', fontSize: 8, color: '#8090B0',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3,
  },
  catRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  catPill: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 12, borderWidth: 1.5 },
  catPillText: { fontFamily: 'Inter_700Bold', fontSize: 10 },

  // Timeline
  timelineCard: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#BAD8FB',
    padding: 10,
    paddingHorizontal: 12,
  },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  timelineTitle: { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: 0.8 },
  timelineCount: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: colors.agenda.accent },
  gapRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 32, marginVertical: 2 },
  gapLine: { flex: 1, height: 1, backgroundColor: '#F0F4FF', borderRadius: 1 },
  gapDots: { fontSize: 8, color: '#C4C9D4' },
  timelineRow: { flexDirection: 'row', gap: 8, borderLeftWidth: 2, paddingLeft: 10, marginBottom: 0, paddingVertical: 6 },
  hourLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, width: 28, textAlign: 'right', paddingTop: 2, color: '#C4C9D4' },
  hourPlaceholder: { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#E8EDF5', paddingVertical: 1, paddingHorizontal: 4 },
  timelineEvt: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, padding: 5, paddingHorizontal: 8, marginBottom: 3, borderRadius: 8, borderWidth: 1 },
  timelineEvtBar: { width: 3, borderRadius: 2, alignSelf: 'stretch', minHeight: 16 },
  timelineEvtTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#1F2937', lineHeight: 16 },
  timelineEvtTime: { fontFamily: 'Inter_600SemiBold', fontSize: 9, marginTop: 1 },

  // Tasks
  taskCard: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
    backgroundColor: '#FFFFFF',
    padding: 7,
    paddingHorizontal: 9,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  taskHeaderText: { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#4C1D95', textTransform: 'uppercase', letterSpacing: 0.6 },
  taskLink: { fontFamily: 'Inter_700Bold', fontSize: 9, color: '#8B5CF6' },
  taskEmpty: { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#C4B5FD', textAlign: 'center', paddingTop: 4 },
  taskRow: { flexDirection: 'row', gap: 5, alignItems: 'flex-start', marginBottom: 4, padding: 2, paddingHorizontal: 4, borderRadius: 6 },
  taskCheck: { width: 12, height: 12, borderRadius: 3, borderWidth: 1.5, marginTop: 3, flexShrink: 0 },
  taskText: { fontFamily: 'Inter_700Bold', fontSize: 10, lineHeight: 14 },
  taskDue: { fontFamily: 'Inter_400Regular', fontSize: 8, color: '#B0A090' },

  // Energy
  energyCard: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FBCFE8',
    backgroundColor: '#FDF2F8',
    padding: 8,
    paddingHorizontal: 10,
  },
  energyTitle: { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#9D174D', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  energyRow: { flexDirection: 'row', gap: 4 },
  energyBtn: { flex: 1, paddingVertical: 6, paddingHorizontal: 4, borderRadius: 8, borderWidth: 2, alignItems: 'center', gap: 2 },
  energyLabel: { fontFamily: 'Inter_700Bold', fontSize: 8, lineHeight: 10 },

  // Notes
  notesCard: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    padding: 7,
    paddingHorizontal: 9,
  },
  notesTitle: { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#065F46', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  notesInput: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#065F46', lineHeight: 18, textAlignVertical: 'top', minHeight: 60, padding: 0 },

  // ── Routines tab ──
  quickRoutine: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14,
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  quickIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#F59E0B',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  quickTitle: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#92400E', marginBottom: 2 },
  quickDesc: { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#B45309' },

  suggestCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#6EE7B7',
    padding: 10, paddingHorizontal: 14,
  },
  suggestText: { fontFamily: 'Inter_700Bold', fontSize: 11, color: '#065F46', marginBottom: 3 },
  suggestBtn: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#10B981', alignSelf: 'flex-start' },
  suggestBtnText: { fontFamily: 'Inter_700Bold', fontSize: 11, color: '#FFFFFF' },

  routineSectionLabel: {
    fontFamily: 'Inter_700Bold', fontSize: 10, color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 4,
  },
  routineEmpty: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 12, color: '#D1D5DB', fontStyle: 'italic' },

  routineCard: { marginBottom: 8, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1.5, overflow: 'hidden' },
  routineHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12 },
  routineIcon: { width: 42, height: 42, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  routineName: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#1F2937', marginBottom: 1 },
  routineMeta: { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#9CA3AF' },

  blockPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, paddingVertical: 6, paddingHorizontal: 12 },
  blockPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 20, borderWidth: 1 },
  blockLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 9, color: '#374151' },
  blockDur: { fontFamily: 'Inter_400Regular', fontSize: 9, color: '#9CA3AF' },

  weekDots: { flexDirection: 'row', gap: 3, paddingVertical: 6, paddingHorizontal: 12, paddingBottom: 8 },
  weekDotLetter: { fontFamily: 'Inter_400Regular', fontSize: 8, color: '#D1D5DB' },
  weekDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },

  habitsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  habitChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1.5 },
  habitChipText: { fontFamily: 'Inter_400Regular', fontSize: 11 },

  // Create routine
  createCard: { borderRadius: 14, borderWidth: 1.5, borderColor: '#E8EDF5', overflow: 'hidden', marginBottom: 8 },
  createToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#FAFAFA',
  },
  createToggleText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#374151' },
  createBody: { padding: 12, paddingHorizontal: 14, backgroundColor: '#FFFDF8', gap: 10 },
  createRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  createInput: {
    borderWidth: 1.5, borderColor: '#E8EDF5', borderRadius: 8,
    paddingVertical: 5, paddingHorizontal: 8, fontSize: 12,
    fontFamily: 'Inter_400Regular', backgroundColor: '#FAFAFA', color: colors.text,
  },
  emojiInput: {
    width: 40, fontSize: 20, textAlign: 'center',
    borderWidth: 1.5, borderColor: '#E8EDF5', borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 2, backgroundColor: '#FFFFFF',
  },
  colorRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  colorDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'transparent' },
  colorDotSel: { borderColor: '#1F2937', borderWidth: 3 },
  colorDotSm: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: 'transparent' },
  colorDotSmSel: { borderColor: '#1F2937', borderWidth: 2.5 },
  draftBlock: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingVertical: 5, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1,
  },
  draftBlockLabel: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, color: '#374151' },
  draftBlockDur: { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#6B7280' },
  addBlockCard: {
    padding: 8, paddingHorizontal: 10, borderRadius: 10,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#E8EDF5', backgroundColor: '#FFFFFF', gap: 6,
  },
  addBlockTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  addBlockBtn: { width: '100%', paddingVertical: 5, borderRadius: 7, backgroundColor: '#F3F4F6', alignItems: 'center' },
  addBlockBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#374151' },
  saveRoutineBtn: {
    width: '100%', paddingVertical: 9, borderRadius: 10,
    backgroundColor: '#F97316', alignItems: 'center',
  },
  saveRoutineBtnText: { fontFamily: 'Inter_700Bold', fontSize: 12, color: '#FFFFFF' },
  tipCard: { padding: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#86EFAC' },
  tipTitle: { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#14532D', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  tipText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#166534', lineHeight: 17 },
});
