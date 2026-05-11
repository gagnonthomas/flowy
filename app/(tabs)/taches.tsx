import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import DraggableFlatList, { ScaleDecorator, type RenderItemParams } from 'react-native-draggable-flatlist';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFlowiStore } from '@/store';
import { SwipeTask } from '@/components/ui/SwipeTask';
import { colors } from '@/constants/colors';
import { getToday, getTomorrow } from '@/utils/date';
import { organizeBrainDump } from '@/utils/api';
import { useTheme } from '@/hooks/useTheme';
import { ScanModal } from '@/components/ui/ScanModal';
import { paper } from '@/constants/paper';
import { formatDateInput, validateDate } from '@/utils/validate';
import { useSubTabSwipe } from '@/hooks/useSubTabSwipe';
import { GestureDetector } from 'react-native-gesture-handler';
import { AnimatedSubTab } from '@/components/ui/AnimatedSubTab';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDarkOverrides } from '@/hooks/useDarkOverrides';
import type { PriorityKey } from '@/constants/colors';

const pad = (n: number) => String(n).padStart(2, '0');

const PRIOS: [PriorityKey, string, string, string][] = [
  ['urgente', '🔴', '#FEE2E2', '#DC2626'],
  ['haute', '🟠', '#FFEDD5', '#EA580C'],
  ['normale', '🔵', '#EFF6FF', '#3B82F6'],
  ['basse', '🟢', '#F0FDF4', '#16A34A'],
];
const prioOrder: Record<string, number> = { urgente: 0, haute: 1, normale: 2, basse: 3 };

const tm = colors.todos; // todos palette

type SubTab = 'todos' | 'notes';

export default function TachesScreen() {
  const { t } = useTheme();
  const d = useDarkOverrides();
  const notesRequested = useFlowiStore((s) => s.notesRequested);
  const [subTab, setSubTab] = useState<SubTab>('todos');

  useEffect(() => {
    if (notesRequested) {
      setSubTab('notes');
      useFlowiStore.setState({ notesRequested: false });
    }
  }, [notesRequested]);
  const todos = useFlowiStore((s) => s.todos);
  const notes = useFlowiStore((s) => s.notes);
  const addTodo = useFlowiStore((s) => s.addTodo);
  const completeTodo = useFlowiStore((s) => s.completeTodo);
  const deleteTodo = useFlowiStore((s) => s.deleteTodo);
  const updateTodo = useFlowiStore((s) => s.updateTodo);
  const addNote = useFlowiStore((s) => s.addNote);
  const reorderTodos = useFlowiStore((s) => s.reorderTodos);
  const deleteNote = useFlowiStore((s) => s.deleteNote);
  const energyLog = useFlowiStore((s) => s.energyLog);
  const today = getToday();
  const tomorrow = getTomorrow();

  // ─── Todos state ───
  const [viewDate, setViewDate] = useState(today);
  const [newText, setNewText] = useState('');
  const [newPrio, setNewPrio] = useState<PriorityKey>('normale');
  const [newDue, setNewDue] = useState('');
  const [newNoteText, setNewNoteText] = useState('');
  const TABS = ['todos', 'notes'] as const;
  const tabSwipe = useSubTabSwipe(TABS, subTab, setSubTab);
  const [scanVisible, setScanVisible] = useState(false);
  const [scanTarget, setScanTarget] = useState<'todos' | 'notes' | 'agenda' | 'semaine' | 'auto'>('todos');
  const [dumpText, setDumpText] = useState('');
  const [dumpLoading, setDumpLoading] = useState(false);
  const [dumpResult, setDumpResult] = useState<any>(null);
  const [openBlocIdx, setOpenBlocIdx] = useState<number | null>(null);

  const isViewingToday = viewDate === today;
  const viewLabel = isViewingToday
    ? "Aujourd'hui"
    : viewDate === tomorrow
      ? 'Demain'
      : new Date(viewDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const navDate = (offset: number) => {
    const d = new Date(viewDate + 'T12:00:00');
    d.setDate(d.getDate() + offset);
    setViewDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const sortedTodos = todos.filter((t) => {
    if (t.done) return t.doneDate === viewDate;
    if (isViewingToday) return !t.due || t.due <= today || t.scheduledDate === today;
    return t.due === viewDate || t.scheduledDate === viewDate;
  }).sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (prioOrder[a.priority] ?? 2) - (prioOrder[b.priority] ?? 2);
  });

  const pendingCount = sortedTodos.filter((t) => !t.done).length;

  const handleAddTodo = () => {
    if (!newText.trim()) return;
    addTodo(newText.trim(), newPrio, validateDate(newDue) || '', viewDate);
    setNewText('');
    setNewPrio('normale');
    setNewDue('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Voix Flowi contextuelle
  const pending = todos.filter((t) => !t.done);
  const urgent = pending.filter((t) => t.priority === 'urgente').length;
  const currentEnergy = energyLog[`${today}-${new Date().getHours() < 12 ? 'matin' : new Date().getHours() < 18 ? 'apresmidi' : 'soir'}`] || 0;
  const voixMsg = (() => {
    if (pending.length === 0) return "Liste vide. C'est une belle place pour souffler. 🌿";
    if (urgent >= 3) return "Beaucoup d'urgences — essaie d'en choisir une seule pour commencer. 🎯";
    if (currentEnergy <= 2 && currentEnergy > 0 && pending.length > 5) return "Longue liste, énergie basse. Une tâche à la fois, c'est déjà beaucoup. 🌿";
    if (pending.length >= 10) return `${pending.length} tâches en attente. Rappelle-toi : tu n'as pas à tout faire aujourd'hui. ✨`;
    return null;
  })();

  // ─── Notes ───
  const sortedNotes = notes.slice().reverse();

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper.bg }}>
      {/* Sub-tabs (paper) */}
      <View style={paper.subTabBar}>
        {(['todos', 'notes'] as const).map((tab) => (
          <Pressable key={tab} onPress={() => setSubTab(tab)} style={paper.subTab}>
            <Text style={[paper.subTabText, subTab === tab && paper.subTabTextActive]}>
              {tab === 'todos' ? 'Tâches' : 'Notes'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ═══ TÂCHES ═══ */}
      <GestureDetector gesture={tabSwipe}>
      <Animated.View style={{ flex: 1 }}>
      {subTab === 'todos' ? (
        <AnimatedSubTab key="todos">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <DraggableFlatList
            data={sortedTodos}
            keyExtractor={(item) => item.id}
            onDragEnd={({ data }) => {
              // Rebuild full todos array with the reordered filtered subset
              const reorderedIds = data.map((t) => t.id);
              const otherTodos = todos.filter((t) => !reorderedIds.includes(t.id));
              reorderTodos([...data, ...otherTodos]);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.scroll}
            ListHeaderComponent={
              <>
                {/* Date selector */}
                <View style={s.dateNav}>
                  <Pressable onPress={() => navDate(-1)} style={s.dateBtn}>
                    <Text style={s.dateBtnText}>‹</Text>
                  </Pressable>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={[s.dateLabel, isViewingToday && { color: tm.accent }]}>{viewLabel}</Text>
                    {!isViewingToday && <Text style={s.dateCount}>{pendingCount} tâche{pendingCount !== 1 ? 's' : ''}</Text>}
                  </View>
                  <Pressable onPress={() => navDate(1)} style={s.dateBtn}>
                    <Text style={s.dateBtnText}>›</Text>
                  </Pressable>
                  {!isViewingToday && (
                    <Pressable onPress={() => setViewDate(today)} style={s.todayBtn}>
                      <Text style={s.todayBtnText}>Auj.</Text>
                    </Pressable>
                  )}
                </View>

                {/* Add form */}
                <View style={[s.addCard, d.prioCard]}>
                  <View style={s.addRow}>
                    <TextInput
                      style={s.addInput}
                      value={newText}
                      onChangeText={setNewText}
                      placeholder="Nouvelle tâche..."
                      placeholderTextColor="#D2AB75"
                      returnKeyType="done"
                      onSubmitEditing={handleAddTodo}
                    />
                    <Pressable onPress={handleAddTodo} style={s.addBtn}>
                      <Text style={s.addBtnText}>+</Text>
                    </Pressable>
                  </View>
                  {/* Priority selector */}
                  <View style={s.prioSection}>
                    <Text style={s.prioLabel}>Priorité :</Text>
                    <View style={s.prioRow}>
                      {PRIOS.map(([key, emoji, bg, color]) => {
                        const sel = newPrio === key;
                        return (
                          <Pressable key={key} onPress={() => setNewPrio(key)} style={[s.prioBtn, { borderColor: sel ? color : 'transparent', backgroundColor: sel ? bg : '#F3F4F6' }]}>
                            <Text style={{ fontSize: 16, lineHeight: 20 }}>{emoji}</Text>
                            <Text style={[s.prioBtnText, { color: sel ? color : '#9CA3AF', fontWeight: sel ? '800' : '500' }]}>
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                  {/* Due date */}
                  <View style={s.dueSection}>
                    <Text style={s.dueLabel}>Échéance :</Text>
                    <TextInput
                      style={s.dueInput}
                      value={newDue}
                      onChangeText={(v) => setNewDue(formatDateInput(v))}
                      placeholder="AAAA-MM-JJ"
                      placeholderTextColor="#C8C0B8"
                      keyboardType="numbers-and-punctuation"
                    />
                    {newDue !== '' && (
                      <Pressable onPress={() => setNewDue('')}>
                        <Text style={{ fontSize: 10, color: '#D1D5DB' }}>×</Text>
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* Importer depuis une liste */}
                <ScanModal
                  visible={scanVisible}
                  target={scanTarget}
                  onClose={() => setScanVisible(false)}
                  onImport={(items) => {
                    if (scanTarget === 'notes') {
                      items.forEach((text) => addNote(text));
                    } else {
                      items.forEach((text) => addTodo(text, 'normale', '', viewDate));
                    }
                  }}
                />
                <Pressable onPress={() => { setScanTarget('todos'); setScanVisible(true); }} style={s.importBtn}>
                  <Text style={{ fontSize: 14 }}>📷</Text>
                  <Text style={s.importText}>Importer depuis une liste</Text>
                </Pressable>

                {/* Progression */}
                {todos.length > 0 && (
                  <View style={[s.progressCard, d.progressCard]}>
                    <Text style={s.progressTitle}>Progression</Text>
                    <View style={s.progressBarBg}>
                      <View style={[s.progressBarFill, { width: `${todos.length > 0 ? Math.round(todos.filter((t) => t.done).length / todos.length * 100) : 0}%` }]} />
                    </View>
                    <Text style={s.progressPct}>
                      {todos.length > 0 ? Math.round(todos.filter((t) => t.done).length / todos.length * 100) : 0}%
                    </Text>
                    <Text style={s.progressCount}>
                      {todos.filter((t) => t.done).length} / {todos.length} tâches
                    </Text>
                  </View>
                )}

                {/* Coach Brain Dump */}
                <View style={[s.dumpCard, d.dumpCard]}>
                  <View style={s.dumpHeader}>
                    <Text style={{ fontSize: 16 }}>🧠</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.dumpHeaderTitle}>Coach</Text>
                      <Text style={s.dumpHeaderSub}>Liste tout — l'IA organise et décompose en sous-tâches</Text>
                    </View>
                  </View>
                  <View style={s.dumpBody}>
                    <TextInput
                      style={s.dumpInput}
                      value={dumpText}
                      onChangeText={setDumpText}
                      placeholder={'Ex:\n- Appeler le dentiste\n- Finir le rapport Q3\n- Préparer présentation jeudi...'}
                      placeholderTextColor="#A5B4FC"
                      multiline
                      numberOfLines={4}
                    />
                    <Pressable
                      onPress={() => {
                        if (!dumpText.trim() || dumpLoading) return;
                        setDumpLoading(true);
                        const ELABELS = ['', 'Épuisé', 'Faible', 'Moyen', 'Élevé', 'Maximum'];
                        const dateStr = new Date(today + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
                        const energyLabel = ELABELS[energyLog[`${today}-${new Date().getHours() < 12 ? 'matin' : new Date().getHours() < 18 ? 'apresmidi' : 'soir'}`] || 0] || 'Moyen';
                        const existingTasks = todos.filter((t) => !t.done).map((t) => t.text).join(', ') || 'aucune';
                        organizeBrainDump(dumpText.trim(), dateStr, energyLabel, existingTasks).then((result) => {
                          setDumpResult(result);
                          setDumpLoading(false);
                        });
                      }}
                      style={[s.dumpBtn, (dumpLoading || !dumpText.trim()) && { opacity: 0.5 }]}
                    >
                      <Text style={s.dumpBtnText}>{dumpLoading ? '⟳  Analyse en cours...' : '✨  Organiser'}</Text>
                    </Pressable>

                    {dumpResult && !dumpLoading && (
                      <View style={{ marginTop: 10 }}>
                        <View style={s.dumpResultHeader}>
                          <Text style={s.dumpResume}>💬 {dumpResult.resume}</Text>
                          <Pressable onPress={() => setDumpResult(null)}>
                            <Text style={{ fontSize: 14, color: '#C7D2FE' }}>×</Text>
                          </Pressable>
                        </View>

                        {(dumpResult.blocs || []).map((bloc: any, bi: number) => {
                          const PCOLS: Record<string, string> = { urgente: '#DC2626', haute: '#EA580C', normale: '#4F46E5', basse: '#059669' };
                          const PBGS: Record<string, string> = { urgente: '#FEF2F2', haute: '#FFF7ED', normale: '#EEF2FF', basse: '#F0FDF4' };
                          const PBORDERS: Record<string, string> = { urgente: '#FCA5A5', haute: '#FED7AA', normale: '#C7D2FE', basse: '#BBF7D0' };
                          const pc = PCOLS[bloc.priorite] || PCOLS.normale;
                          const pbg = PBGS[bloc.priorite] || PBGS.normale;
                          const pbd = PBORDERS[bloc.priorite] || PBORDERS.normale;
                          const isOpen = openBlocIdx === bi;
                          return (
                            <View key={bi} style={[s.dumpBloc, { backgroundColor: pbg, borderColor: pbd }]}>
                              <Pressable onPress={() => setOpenBlocIdx(isOpen ? null : bi)} style={s.dumpBlocHeader}>
                                <Text style={{ fontSize: 16, flexShrink: 0 }}>{bloc.emoji || '📌'}</Text>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                  <Text style={[s.dumpBlocTitle, { color: pc }]}>{bloc.titre}</Text>
                                  <Text style={s.dumpBlocMeta}>{bloc.heure || ''}{bloc.duree ? ` · ${bloc.duree}` : ''}</Text>
                                </View>
                                <Pressable
                                  onPress={(e) => {
                                    addTodo(bloc.titre, bloc.priorite || 'normale', viewDate, viewDate);
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                  }}
                                  style={[s.dumpAddBtn, { borderColor: pc + '44' }]}
                                >
                                  <Text style={[s.dumpAddBtnText, { color: pc }]}>+ Tâche</Text>
                                </Pressable>
                                <Text style={{ fontSize: 11, color: '#94A3B8' }}>{isOpen ? '▲' : '▼'}</Text>
                              </Pressable>
                              {isOpen && (
                                <View style={[s.dumpSubtasks, { borderTopColor: pbd }]}>
                                  {(bloc.sousTaches || []).map((st: string, si: number) => (
                                    <View key={si} style={s.dumpSubRow}>
                                      <View style={[s.dumpSubDot, { backgroundColor: pc }]} />
                                      <Text style={s.dumpSubText}>{st}</Text>
                                    </View>
                                  ))}
                                  <Pressable
                                    onPress={() => {
                                      (bloc.sousTaches || []).forEach((st: string) => {
                                        addTodo(st, bloc.priorite || 'normale', viewDate, viewDate);
                                      });
                                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                    }}
                                    style={[s.dumpAddAllBtn, { borderColor: pbd }]}
                                  >
                                    <Text style={[s.dumpAddBtnText, { color: pc }]}>↗ Ajouter les sous-tâches</Text>
                                  </Pressable>
                                </View>
                              )}
                            </View>
                          );
                        })}

                        {dumpResult.conseil && (
                          <View style={s.dumpConseil}>
                            <Text style={s.dumpConseilText}>💡 {dumpResult.conseil}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>

                {/* Voix Flowi */}
                {voixMsg && <Text style={s.voix}>{voixMsg}</Text>}
              </>
            }
            renderItem={({ item: t, drag, isActive: isDragging }) => {
              const prioInfo = PRIOS.find((p) => p[0] === t.priority) || PRIOS[2];
              const isOverdue = t.due && t.due < today && !t.done;
              return (
                <ScaleDecorator>
                <Pressable onLongPress={drag} disabled={isDragging}>
                <SwipeTask
                  onComplete={t.done ? undefined : () => completeTodo(t.id)}
                  onDelete={() => deleteTodo(t.id)}
                >
                  <View style={[s.todoCard, { backgroundColor: t.done ? '#F7F3EE' : prioInfo[2], borderColor: t.done ? '#EDE5D8' : prioInfo[3] + '55', opacity: t.done ? 0.65 : 1 }]}>
                    {/* Checkbox */}
                    <Pressable
                      onPress={() => { completeTodo(t.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                      style={[s.todoCheck, { borderColor: t.done ? tm.accent : '#DDD', backgroundColor: t.done ? tm.accent : 'transparent' }]}
                    >
                      {t.done && <Text style={s.todoCheckMark}>✓</Text>}
                    </Pressable>
                    {/* Content */}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={s.todoTitleRow}>
                        <Text style={{ fontSize: 11, flexShrink: 0 }}>{prioInfo[1]}</Text>
                        <Text style={[s.todoText, { color: t.done ? '#B0A090' : prioInfo[3], textDecorationLine: t.done ? 'line-through' : 'none' }]} numberOfLines={2}>{t.text}</Text>
                        {t.rolledOver && !t.done && (
                          <View style={s.rolledBadge}><Text style={s.rolledText}>↩ reporté</Text></View>
                        )}
                      </View>
                      {t.done && t.doneDate && (
                        <Text style={s.doneDate}>✅ {new Date(t.doneDate + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</Text>
                      )}
                      {!t.done && t.due && (
                        <Text style={[s.dueDate, isOverdue && { color: '#DC2626', fontWeight: '800' }]}>
                          {isOverdue ? '⚠️' : '📅'} {new Date(t.due + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </Text>
                      )}
                    </View>
                    {/* Postpone button */}
                    {!t.done && (
                      <Pressable
                        onPress={() => { updateTodo(t.id, { scheduledDate: tomorrow, rolledOver: false }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                        style={s.postponeBtn}
                      >
                        <Text style={{ fontSize: 11 }}>🌙</Text>
                      </Pressable>
                    )}
                  </View>
                </SwipeTask>
                </Pressable>
                </ScaleDecorator>
              );
            }}
            ListEmptyComponent={
              <EmptyState
                emoji={isViewingToday ? '✅' : '📅'}
                title={isViewingToday ? "Aucune tâche pour l'instant." : 'Aucune tâche prévue ce jour.'}
                subtitle={isViewingToday ? "C'est un bon début — ajoute ta première tâche." : 'Tu peux en ajouter une depuis le champ ci-dessus.'}
                floatingEmojis={isViewingToday ? ['🌿', '✨', '🎯'] : ['📝', '⏰']}
              />
            }
          />
        </KeyboardAvoidingView>
        </AnimatedSubTab>
      ) : (
        /* ═══ NOTES ═══ */
        <AnimatedSubTab key="notes">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          {/* Header (paper) */}
          <View style={s.notesHeader}>
            <Text style={s.notesHeaderTitle}>Notes</Text>
            <Text style={s.notesHeaderSub}>Capture tout — idée, pensée, vide-tête. Sans filtre, sans ordre.</Text>
          </View>

          {/* Input area (paper) */}
          <View style={s.notesInputWrap}>
            <TextInput
              style={s.notesInput}
              value={newNoteText}
              onChangeText={setNewNoteText}
              placeholder={'Écris et laisse aller...\nUne idée, une émotion, n\'importe quoi.'}
              placeholderTextColor={colors.paper.inkMuted}
              multiline
              numberOfLines={4}
              returnKeyType="default"
              onSubmitEditing={() => {
                if (newNoteText.trim()) { addNote(newNoteText.trim()); setNewNoteText(''); }
              }}
            />
            <View style={s.notesActions}>
              <Text style={s.notesAutoSave}>Sauvegardé à la frappe</Text>
              <Pressable onPress={() => { setScanTarget('notes'); setScanVisible(true); }} style={s.notesScanBtn}>
                <Text style={{ fontSize: 14 }}>📷</Text>
              </Pressable>
            </View>
            {newNoteText.trim().length > 0 && (
              <Pressable
                onPress={() => { addNote(newNoteText.trim()); setNewNoteText(''); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={s.notesSaveBtn}
              >
                <Text style={s.notesSaveBtnText}>Sauvegarder</Text>
              </Pressable>
            )}
          </View>

          {/* Notes list */}
          <FlatList
            data={sortedNotes}
            keyExtractor={(item) => item.id}
            style={{ flex: 1, backgroundColor: colors.paper.bg }}
            contentContainerStyle={{ padding: 12, paddingBottom: 40, gap: 10 }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', padding: 32 }}>
                <Text style={{ fontSize: 28, marginBottom: 10 }}>🌫️</Text>
                <Text style={s.notesEmptyText}>{'Rien encore.\nCommence par écrire une pensée.'}</Text>
              </View>
            }
            renderItem={({ item: n }) => (
              <View style={s.noteCard}>
                <Text style={s.noteText}>{n.text}</Text>
                <View style={s.noteFooter}>
                  <Text style={s.noteDate}>
                    {new Date(n.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                  </Text>
                  <Pressable onPress={() => deleteNote(n.id)}>
                    <Text style={s.noteDeleteBtn}>×</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        </KeyboardAvoidingView>
        </AnimatedSubTab>
      )}
      </Animated.View>
      </GestureDetector>
    </View>
  );
}

const s = StyleSheet.create({
  // Tabs
  tabBar: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 },
  tab: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, backgroundColor: '#FAFBFF', borderWidth: 1.5, borderColor: '#E8EDF5' },
  tabActive: { backgroundColor: tm.light, borderColor: tm.accent },
  tabText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#9CA3AF' },
  tabTextActive: { fontFamily: 'Inter_700Bold', color: tm.accent },

  scroll: { paddingHorizontal: 14, paddingBottom: 40 },

  // Date nav — paper
  dateNav: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 12, paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 4, backgroundColor: colors.paper.bgLight,
    borderWidth: 1, borderColor: colors.paper.rule,
  },
  dateBtn: {
    width: 28, height: 28, borderRadius: 3, borderWidth: 1,
    borderColor: colors.paper.rule, backgroundColor: colors.paper.bg,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  dateBtnText: { fontSize: 14, color: colors.paper.accent, fontFamily: 'Inter_700Bold' },
  dateLabel: {
    fontFamily: 'PlayfairDisplay_700Bold', fontSize: 15,
    color: colors.paper.ink, lineHeight: 18, textTransform: 'capitalize',
    letterSpacing: -0.1,
  },
  dateCount: { fontFamily: 'Inter_400Regular', fontSize: 10, color: colors.paper.inkMuted, marginTop: 2 },
  todayBtn: {
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 3,
    borderWidth: 1, borderColor: colors.paper.rule, backgroundColor: colors.paper.accentSoft, flexShrink: 0,
  },
  todayBtnText: { fontFamily: 'Inter_700Bold', fontSize: 11, color: colors.paper.accent },

  // Add card — paper
  addCard: {
    backgroundColor: colors.paper.bgLight, borderWidth: 1, borderColor: colors.paper.rule,
    borderRadius: 4, padding: 12, paddingHorizontal: 14, marginBottom: 12,
  },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  addInput: {
    flex: 1, borderWidth: 1, borderColor: colors.paper.rule, borderRadius: 3,
    paddingVertical: 9, paddingHorizontal: 12, fontSize: 14,
    fontFamily: 'Inter_400Regular', backgroundColor: colors.paper.bg, color: colors.paper.ink,
  },
  addBtn: {
    paddingVertical: 9, paddingHorizontal: 16, borderRadius: 3,
    backgroundColor: colors.paper.accent, alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: colors.paper.bgLight, fontSize: 14, fontFamily: 'Inter_700Bold' },
  prioSection: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prioLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#B0A090', flexShrink: 0 },
  prioRow: { flexDirection: 'row', gap: 5, flex: 1 },
  prioBtn: {
    flex: 1, paddingVertical: 5, paddingHorizontal: 2, borderRadius: 9,
    borderWidth: 2, alignItems: 'center', gap: 2,
  },
  prioBtnText: { fontFamily: 'Inter_400Regular', fontSize: 8, lineHeight: 10 },

  // Due date
  dueSection: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6,
  },
  dueLabel: {
    fontFamily: 'Inter_700Bold', fontSize: 10, color: '#B0A090',
    textTransform: 'uppercase', letterSpacing: 0.8, flexShrink: 0,
  },
  dueInput: {
    flex: 1, borderWidth: 1.5, borderColor: '#E8EDF5', borderRadius: 9,
    paddingVertical: 5, paddingHorizontal: 8, fontSize: 11,
    fontFamily: 'Inter_400Regular', backgroundColor: '#FFFFFF', color: colors.text,
  },

  // Import — paper ghost button with dashed border
  importBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, marginBottom: 10, paddingVertical: 9, paddingHorizontal: 12,
    borderRadius: 4, borderWidth: 1, borderStyle: 'dashed',
    borderColor: colors.paper.rule, backgroundColor: colors.paper.bgLight,
  },
  importText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.paper.accent },

  // Progression
  progressCard: {
    marginBottom: 10, padding: 12, paddingHorizontal: 14, borderRadius: 12,
    backgroundColor: tm.light, borderWidth: 1.5, borderColor: tm.border,
    alignItems: 'center',
  },
  progressTitle: {
    fontFamily: 'Inter_700Bold', fontSize: 10, color: tm.text,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  },
  progressBarBg: {
    width: '100%', height: 10, backgroundColor: '#E8F4EC',
    borderRadius: 5, overflow: 'hidden', marginBottom: 6,
  },
  progressBarFill: { height: '100%', backgroundColor: tm.accent, borderRadius: 5 },
  progressPct: { fontFamily: 'Inter_700Bold', fontSize: 28, color: tm.accent },
  progressCount: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#8090B0' },

  // Brain dump
  dumpCard: {
    marginBottom: 10, borderRadius: 12, borderWidth: 1.5,
    borderColor: '#C7D2FE', backgroundColor: '#EEF2FF', overflow: 'hidden',
  },
  dumpHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: '#C7D2FE',
  },
  dumpHeaderTitle: { fontFamily: 'Inter_700Bold', fontSize: 11, color: '#3730A3', textTransform: 'uppercase', letterSpacing: 0.6 },
  dumpHeaderSub: { fontFamily: 'Inter_400Regular', fontSize: 9, color: '#818CF8', marginTop: 1 },
  dumpBody: { padding: 8, paddingHorizontal: 10 },
  dumpInput: {
    borderWidth: 1.5, borderColor: '#C7D2FE', borderRadius: 9,
    padding: 8, paddingHorizontal: 10, fontSize: 12,
    fontFamily: 'Inter_400Regular', backgroundColor: '#FFFFFF', color: '#1E1B4B',
    lineHeight: 19, minHeight: 80, textAlignVertical: 'top', marginBottom: 7,
  },
  dumpBtn: {
    width: '100%', paddingVertical: 8, borderRadius: 9,
    backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center',
  },
  dumpBtnText: { fontFamily: 'Inter_700Bold', fontSize: 12, color: '#FFFFFF' },
  dumpResultHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
  },
  dumpResume: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#3730A3', fontStyle: 'italic', flex: 1 },
  dumpBloc: {
    marginBottom: 6, borderRadius: 10, borderWidth: 1.5, overflow: 'hidden',
  },
  dumpBlocHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, paddingHorizontal: 10,
  },
  dumpBlocTitle: { fontFamily: 'Inter_700Bold', fontSize: 12, lineHeight: 15 },
  dumpBlocMeta: { fontFamily: 'Inter_400Regular', fontSize: 9, color: '#94A3B8' },
  dumpAddBtn: {
    paddingVertical: 2, paddingHorizontal: 7, borderRadius: 6,
    borderWidth: 1, backgroundColor: '#FFFFFF', flexShrink: 0,
  },
  dumpAddBtnText: { fontFamily: 'Inter_700Bold', fontSize: 9 },
  dumpSubtasks: { paddingVertical: 4, paddingHorizontal: 10, paddingLeft: 38, borderTopWidth: 1 },
  dumpSubRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  dumpSubDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 5, flexShrink: 0 },
  dumpSubText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#374151', lineHeight: 16 },
  dumpAddAllBtn: {
    marginTop: 6, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 7,
    borderWidth: 1, backgroundColor: '#FFFFFF', width: '100%', alignItems: 'center',
  },
  dumpConseil: {
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 9,
    backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', marginTop: 4,
  },
  dumpConseilText: { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#166534', lineHeight: 15 },

  // Voix
  voix: {
    fontFamily: 'PlayfairDisplay_700Bold', fontSize: 11, color: '#8B5CF6',
    fontStyle: 'italic', lineHeight: 19, textAlign: 'center',
    paddingHorizontal: 8, paddingBottom: 8, opacity: 0.85,
  },

  // Todo card
  todoCard: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    padding: 8, paddingHorizontal: 10, borderRadius: 10,
    borderWidth: 1.5,
  },
  todoCheck: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  todoCheckMark: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  todoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  todoText: { fontFamily: 'Inter_700Bold', fontSize: 13, lineHeight: 17, flex: 1 },
  rolledBadge: {
    backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA',
    borderRadius: 6, paddingVertical: 1, paddingHorizontal: 5, flexShrink: 0,
  },
  rolledText: { fontFamily: 'Inter_700Bold', fontSize: 9, color: '#F97316' },
  doneDate: { fontFamily: 'Inter_400Regular', fontSize: 9, color: '#B0A090', marginTop: 1 },
  dueDate: { fontFamily: 'Inter_400Regular', fontSize: 9, color: '#8090B0', marginTop: 2 },
  postponeBtn: {
    borderWidth: 1, borderColor: '#E0E7FF', backgroundColor: '#EEF2FF',
    borderRadius: 7, paddingVertical: 3, paddingHorizontal: 7, flexShrink: 0,
  },

  // Empty state
  emptyState: { alignItems: 'center', padding: 32, paddingHorizontal: 20 },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay_700Bold', fontSize: 14, color: '#C8B090',
    fontStyle: 'italic', marginBottom: 8, textAlign: 'center',
  },
  emptySub: {
    fontFamily: 'Inter_400Regular', fontSize: 11, color: '#D1C8B8',
    lineHeight: 18, textAlign: 'center',
  },

  // ── Notes — paper aesthetic ──
  notesHeader: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    backgroundColor: colors.paper.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.paper.rule,
  },
  notesHeaderTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    color: colors.paper.ink,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  notesHeaderSub: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.paper.inkMuted,
    lineHeight: 18,
  },
  notesInputWrap: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: colors.paper.bg,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.paper.rule,
    borderRadius: 4,
    padding: 14,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    backgroundColor: colors.paper.bgLight,
    color: colors.paper.ink,
    lineHeight: 22,
    minHeight: 88,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  notesActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesAutoSave: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: colors.paper.inkMuted,
    letterSpacing: 0.3,
  },
  notesScanBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.paper.rule,
    backgroundColor: colors.paper.bgLight,
  },
  notesSaveBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 4,
    backgroundColor: colors.paper.accent,
  },
  notesSaveBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: colors.paper.bgLight,
    letterSpacing: 0.3,
  },
  notesEmptyText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 13,
    color: colors.paper.inkMuted,
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'center',
  },
  noteCard: {
    borderRadius: 4,
    backgroundColor: colors.paper.bgLight,
    borderWidth: 1,
    borderColor: colors.paper.rule,
    padding: 14,
    paddingHorizontal: 16,
  },
  noteText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.paper.ink,
    lineHeight: 20,
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  noteDate: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 11,
    fontStyle: 'italic',
    color: colors.paper.inkMuted,
  },
  noteDeleteBtn: {
    fontSize: 16,
    color: colors.paper.inkMuted,
    lineHeight: 18,
  },
});
