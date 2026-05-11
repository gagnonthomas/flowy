import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToday } from '@/utils/date';
import { generateId } from '@/utils/id';
import { showToast } from '@/components/ui/Toast';
import { trackFeature, trackAction } from '@/utils/analytics';
import type {
  Todo, Event, Habit, Note, Routine, Defi, Workout,
  CoachMessage, XpLogEntry, Badge, Goal,
  EnergyLog, SleepLog, WaterLog, WeightLog,
} from '@/types';

// Web: localStorage, Native: AsyncStorage (compatible Expo Go)
const platformStorage = Platform.OS === 'web'
  ? {
      getItem: (key: string) => localStorage.getItem(key),
      setItem: (key: string, value: string) => localStorage.setItem(key, value),
      removeItem: (key: string) => localStorage.removeItem(key),
    }
  : {
      getItem: (key: string) => AsyncStorage.getItem(key),
      setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
      removeItem: (key: string) => AsyncStorage.removeItem(key),
    };

// XP levels
const XP_LEVELS = [0, 50, 150, 300, 500, 800, 1200, 1800, 2500, 3500, 5000];
export function getLevel(xp: number): number {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i]) return i + 1;
  }
  return 1;
}
export function getXpForNextLevel(xp: number): { current: number; needed: number } {
  const level = getLevel(xp);
  const currentThreshold = XP_LEVELS[level - 1] || 0;
  const nextThreshold = XP_LEVELS[level] || XP_LEVELS[XP_LEVELS.length - 1];
  return { current: xp - currentThreshold, needed: nextThreshold - currentThreshold };
}

interface FlowiState {
  // Onboarding
  onboarded: boolean;
  userName: string;
  userTdah: string;
  userDefis: string[];
  userObjectif: string;
  setOnboarded: (val: boolean) => void;
  setUserName: (val: string) => void;
  setUserTdah: (val: string) => void;
  setUserDefis: (val: string[]) => void;
  setUserObjectif: (val: string) => void;
  seedStarterContent: () => void;

  // Todos
  todos: Todo[];
  addTodo: (text: string, priority: Todo['priority'], due: string, scheduledDate: string) => void;
  completeTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  reorderTodos: (todos: Todo[]) => void;
  rolloverTodos: () => void;

  // Events
  events: Event[];
  addEvent: (event: Omit<Event, 'id' | 'done'>) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  toggleEventDone: (id: string) => void;

  // Habits
  habits: Habit[];
  addHabit: (label: string, icon: string) => void;
  toggleHabit: (id: string, date: string) => void;
  deleteHabit: (id: string) => void;
  updateHabitIcon: (id: string, icon: string) => void;

  // Notes
  notes: Note[];
  addNote: (text: string) => void;
  deleteNote: (id: string) => void;

  // Routines
  routines: Routine[];
  addRoutine: (routine: Omit<Routine, 'id'>) => void;
  updateRoutine: (id: string, updates: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;
  routineLog: Record<string, boolean>;
  logRoutine: (routineId: string, date: string) => void;

  // Energy / Wellness
  energyLog: EnergyLog;
  setEnergy: (key: string, value: number) => void;
  sleepLog: SleepLog;
  setSleep: (date: string, data: SleepLog[string]) => void;
  waterLog: WaterLog;
  setWater: (date: string, cups: number) => void;
  weightLog: WeightLog;
  setWeight: (date: string, kg: number) => void;
  workouts: Workout[];
  addWorkout: (type: string, dur: string) => void;

  // Defis (challenges)
  defis: Defi[];
  addDefi: (label: string, days: number) => void;
  toggleDefiDay: (id: string, date: string) => void;
  deleteDefi: (id: string) => void;

  // Coach
  coachMessages: CoachMessage[];
  addCoachMessage: (msg: CoachMessage) => void;
  clearCoach: () => void;

  // XP & Badges
  xp: number;
  xpLog: XpLogEntry[];
  badges: Badge[];
  earnXp: (amount: number, reason: string) => void;
  addBadge: (label: string, icon: string) => void;

  // Goals (semaine / mois)
  weekGoals: Goal[];
  addWeekGoal: (text: string) => void;
  toggleWeekGoal: (id: string) => void;
  deleteWeekGoal: (id: string) => void;
  monthGoals: Goal[];
  addMonthGoal: (text: string) => void;
  toggleMonthGoal: (id: string) => void;
  deleteMonthGoal: (id: string) => void;

  // Persisted user data (priorities, rappels, gratitude, reviews)
  dayPrios: Record<string, [string, string, string]>;
  setDayPrios: (date: string, prios: [string, string, string]) => void;
  rappels: Record<string, string[]>;
  setRappels: (date: string, rappels: string[]) => void;
  gratitude: Record<string, string[]>;
  addGratitude: (date: string, text: string) => void;
  removeGratitude: (date: string, index: number) => void;
  weekReview: Record<string, string>;
  setWeekReview: (weekKey: string, text: string) => void;
  monthReview: Record<string, { wins: string; improve: string; focus: string }>;
  setMonthReview: (monthKey: string, field: 'wins' | 'improve' | 'focus', text: string) => void;
  agendaNotes: Record<string, string>;
  setAgendaNote: (date: string, text: string) => void;

  // Settings
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Navigation flags
  quickRoutineRequested: boolean;
  notesRequested: boolean;
  xpRequested: boolean;
  coachAutoSendPending: boolean;

  // Selected date
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

export const useFlowiStore = create<FlowiState>()(
  persist(
    (set, get) => ({
      // Onboarding
      onboarded: false,
      userName: '',
      userTdah: '',
      userDefis: [],
      userObjectif: '',
      setOnboarded: (val) => set({ onboarded: val }),
      setUserName: (val) => set({ userName: val }),
      setUserTdah: (val) => set({ userTdah: val }),
      setUserDefis: (val) => set({ userDefis: val }),
      setUserObjectif: (val) => set({ userObjectif: val }),
      seedStarterContent: () => {
        const s = get();
        const today = getToday();
        const defis = s.userDefis;
        const objectif = s.userObjectif;

        // Always: 1 hero scan task + 3 micro-actions for instant dopamine wins
        const seedTexts: { text: string; priority: Todo['priority'] }[] = [
          { text: '📷 Scanne une liste papier — tape le bouton bleu en bas à droite', priority: 'haute' },
          { text: '💧 Boire un verre d\'eau', priority: 'basse' },
          { text: '🌬️ Respirer profondément 1 minute', priority: 'basse' },
          { text: '✨ Touche cette tâche pour la cocher — voilà, ta première victoire', priority: 'normale' },
        ];

        // Personalisation par défis/objectif
        if (defis.includes('stress') || objectif === 'stress') {
          seedTexts.push({ text: '🌿 Faire une pause de 2 minutes', priority: 'normale' });
        }
        if (defis.includes('focus') || objectif === 'focus') {
          seedTexts.push({ text: '⏱ Essayer un Focus de 5 minutes (onglet Focus)', priority: 'normale' });
        }
        if (defis.includes('memoire')) {
          seedTexts.push({ text: '📋 Noter 1 chose à ne pas oublier (Tâches → Notes)', priority: 'normale' });
        }

        const seedTodos = seedTexts.map((t) => ({
          id: generateId(),
          text: t.text,
          done: false,
          priority: t.priority,
          due: null,
          scheduledDate: today,
          doneDate: null,
          createdAt: today,
        }));

        const welcomeNote = {
          id: generateId(),
          text: '📝 Bienvenue ! Ici tu peux déposer tout ce qui te passe par la tête, sans ordre, sans pression. Glisse cette note vers la gauche pour la supprimer.',
          date: today,
        };

        const welcomeGoal = {
          id: generateId(),
          text: 'Cette semaine, ouvrir Flowi 3 fois 🌿',
          done: false,
        };

        set({
          todos: seedTodos,
          notes: [welcomeNote],
          weekGoals: [welcomeGoal],
        });
      },

      // Todos
      todos: [],
      addTodo: (text, priority, due, scheduledDate) => set((s) => ({
        todos: [...s.todos, {
          id: generateId(),
          text,
          done: false,
          priority,
          due: due || null,
          scheduledDate: scheduledDate || getToday(),
          doneDate: null,
          createdAt: getToday(),
        }],
      })),
      completeTodo: (id) => {
        const state = get();
        const todo = state.todos.find((t) => t.id === id);
        if (todo && !todo.done) {
          state.earnXp(5, `Tâche: ${todo.text.slice(0, 30)}`);
          showToast(`Tâche complétée ! +5 XP`, 'success');
          trackAction('complete_todo');
        }
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === id ? { ...t, done: !t.done, doneDate: !t.done ? getToday() : null } : t
          ),
        }));
      },
      deleteTodo: (id) => set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),
      updateTodo: (id, updates) => set((s) => ({
        todos: s.todos.map((t) => t.id === id ? { ...t, ...updates } : t),
      })),
      reorderTodos: (todos) => set({ todos }),
      rolloverTodos: () => {
        const today = getToday();
        set((s) => ({
          todos: s.todos.map((t) =>
            !t.done && t.scheduledDate && t.scheduledDate < today
              ? { ...t, scheduledDate: today, rolledOver: true }
              : t
          ),
        }));
      },

      // Events
      events: [],
      addEvent: (event) => set((s) => ({
        events: [...s.events, { ...event, id: generateId(), done: false }],
      })),
      updateEvent: (id, updates) => set((s) => ({
        events: s.events.map((e) => e.id === id ? { ...e, ...updates } : e),
      })),
      deleteEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
      toggleEventDone: (id) => set((s) => ({
        events: s.events.map((e) => e.id === id ? { ...e, done: !e.done } : e),
      })),

      // Habits
      habits: [
        { id: 'h1', label: 'Méditation', icon: '🧘', done: {} },
        { id: 'h2', label: 'Exercice', icon: '🏃', done: {} },
        { id: 'h3', label: 'Lecture', icon: '📖', done: {} },
        { id: 'h4', label: 'Gratitude', icon: '🙏', done: {} },
      ],
      addHabit: (label, icon) => set((s) => ({
        habits: [...s.habits, { id: generateId(), label, icon, done: {} }],
      })),
      toggleHabit: (id, date) => {
        const state = get();
        const habit = state.habits.find((h) => h.id === id);
        if (habit && !habit.done[date]) {
          state.earnXp(3, `Habitude: ${habit.label}`);
          showToast(`${habit.icon} ${habit.label} — +3 XP`, 'success');
          trackAction('complete_habit');
        }
        set((s) => ({
          habits: s.habits.map((h) => {
            if (h.id !== id) return h;
            const done = { ...h.done };
            done[date] = !done[date];
            return { ...h, done };
          }),
        }));
      },
      deleteHabit: (id) => set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),
      updateHabitIcon: (id, icon) => set((s) => ({
        habits: s.habits.map((h) => h.id === id ? { ...h, icon } : h),
      })),

      // Notes
      notes: [],
      addNote: (text) => set((s) => ({
        notes: [...s.notes, { id: generateId(), text, date: getToday() }],
      })),
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      // Routines
      routines: [
        {
          id: 'r1', name: 'Routine du matin', emoji: '🌅', color: '#F97316',
          blocks: [
            { id: 'b1', label: 'Réveil doux', emoji: '⏰', dur: 5, color: '#FED7AA' },
            { id: 'b2', label: 'Méditation', emoji: '🧘', dur: 10, color: '#C4B5FD' },
            { id: 'b3', label: 'Petit-déjeuner', emoji: '🥣', dur: 15, color: '#A7F3D0' },
            { id: 'b4', label: 'Douche', emoji: '🚿', dur: 10, color: '#BAE6FD' },
          ],
        },
        {
          id: 'r2', name: 'Routine du soir', emoji: '🌙', color: '#8B5CF6',
          blocks: [
            { id: 'b5', label: 'Rangement', emoji: '🧹', dur: 10, color: '#FDE68A' },
            { id: 'b6', label: 'Lecture', emoji: '📖', dur: 20, color: '#E9D5FF' },
            { id: 'b7', label: 'Gratitude', emoji: '🌸', dur: 5, color: '#FCE7F3' },
          ],
        },
      ],
      addRoutine: (routine) => set((s) => ({
        routines: [...s.routines, { ...routine, id: generateId() }],
      })),
      updateRoutine: (id, updates) => set((s) => ({
        routines: s.routines.map((r) => r.id === id ? { ...r, ...updates } : r),
      })),
      deleteRoutine: (id) => set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),
      routineLog: {},
      logRoutine: (routineId, date) => set((s) => ({
        routineLog: { ...s.routineLog, [`${routineId}-${date}`]: true },
      })),

      // Energy / Wellness
      energyLog: {},
      setEnergy: (key, value) => set((s) => ({
        energyLog: { ...s.energyLog, [key]: value },
      })),
      sleepLog: {},
      setSleep: (date, data) => set((s) => ({
        sleepLog: { ...s.sleepLog, [date]: data },
      })),
      waterLog: {},
      setWater: (date, cups) => set((s) => ({
        waterLog: { ...s.waterLog, [date]: cups },
      })),
      weightLog: {},
      setWeight: (date, kg) => set((s) => ({
        weightLog: { ...s.weightLog, [date]: kg },
      })),
      workouts: [],
      addWorkout: (type, dur) => set((s) => ({
        workouts: [...s.workouts, { id: generateId(), type, dur, date: getToday() }],
      })),

      // Defis
      defis: [],
      addDefi: (label, days) => set((s) => ({
        defis: [...s.defis, {
          id: generateId(), label, days, startDate: getToday(), log: {},
        }],
      })),
      toggleDefiDay: (id, date) => set((s) => ({
        defis: s.defis.map((d) => {
          if (d.id !== id) return d;
          const log = { ...d.log };
          log[date] = !log[date];
          return { ...d, log };
        }),
      })),
      deleteDefi: (id) => set((s) => ({ defis: s.defis.filter((d) => d.id !== id) })),

      // Coach
      coachMessages: [{
        role: 'assistant',
        text: 'Bonjour ! 👋 Je suis ton coach Flowi. Je peux t\'aider à décomposer tes tâches, suggérer des stratégies de focus, ou simplement t\'encourager. Par où veux-tu commencer ?',
      }],
      addCoachMessage: (msg) => set((s) => ({
        coachMessages: [...s.coachMessages, msg],
      })),
      clearCoach: () => set({
        coachMessages: [{
          role: 'assistant',
          text: 'Bonjour ! 👋 Comment puis-je t\'aider aujourd\'hui ?',
        }],
      }),

      // XP & Badges
      xp: 0,
      xpLog: [],
      badges: [],
      earnXp: (amount, reason) => set((s) => ({
        xp: s.xp + amount,
        xpLog: [...s.xpLog, { date: getToday(), amount, reason }],
      })),
      addBadge: (label, icon) => set((s) => ({
        badges: [...s.badges, { id: generateId(), label, icon, date: getToday() }],
      })),

      // Goals
      weekGoals: [],
      addWeekGoal: (text) => set((s) => ({
        weekGoals: [...s.weekGoals, { id: generateId(), text, done: false }],
      })),
      toggleWeekGoal: (id) => set((s) => ({
        weekGoals: s.weekGoals.map((g) => g.id === id ? { ...g, done: !g.done } : g),
      })),
      deleteWeekGoal: (id) => set((s) => ({
        weekGoals: s.weekGoals.filter((g) => g.id !== id),
      })),
      monthGoals: [],
      addMonthGoal: (text) => set((s) => ({
        monthGoals: [...s.monthGoals, { id: generateId(), text, done: false }],
      })),
      toggleMonthGoal: (id) => set((s) => ({
        monthGoals: s.monthGoals.map((g) => g.id === id ? { ...g, done: !g.done } : g),
      })),
      deleteMonthGoal: (id) => set((s) => ({
        monthGoals: s.monthGoals.filter((g) => g.id !== id),
      })),

      // Persisted user data
      dayPrios: {},
      setDayPrios: (date, prios) => set((s) => ({
        dayPrios: { ...s.dayPrios, [date]: prios },
      })),
      rappels: {},
      setRappels: (date, rappels) => set((s) => ({
        rappels: { ...s.rappels, [date]: rappels },
      })),
      gratitude: {},
      addGratitude: (date, text) => set((s) => ({
        gratitude: { ...s.gratitude, [date]: [...(s.gratitude[date] || []), text] },
      })),
      removeGratitude: (date, index) => set((s) => ({
        gratitude: { ...s.gratitude, [date]: (s.gratitude[date] || []).filter((_, i) => i !== index) },
      })),
      weekReview: {},
      setWeekReview: (weekKey, text) => set((s) => ({
        weekReview: { ...s.weekReview, [weekKey]: text },
      })),
      monthReview: {},
      setMonthReview: (monthKey, field, text) => set((s) => ({
        monthReview: { ...s.monthReview, [monthKey]: { ...(s.monthReview[monthKey] || { wins: '', improve: '', focus: '' }), [field]: text } },
      })),
      agendaNotes: {},
      setAgendaNote: (date, text) => set((s) => ({
        agendaNotes: { ...s.agendaNotes, [date]: text },
      })),

      // Settings
      darkMode: false,
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

      // Navigation flags
      quickRoutineRequested: false,
      notesRequested: false,
      xpRequested: false,
      coachAutoSendPending: false,

      // Selected date
      selectedDate: getToday(),
      setSelectedDate: (date) => set({ selectedDate: date }),
    }),
    {
      name: 'flowi-storage',
      storage: createJSONStorage(() => platformStorage),
    }
  )
);
