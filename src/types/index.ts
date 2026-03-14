export interface Todo {
  id: string;
  text: string;
  done: boolean;
  priority: 'urgente' | 'haute' | 'normale' | 'basse';
  due: string | null;
  scheduledDate: string;
  doneDate: string | null;
  rolledOver?: boolean;
  createdAt?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string | null;
  endTime: string | null;
  category: 'rdv' | 'tache' | 'perso' | 'sante' | 'famille';
  note?: string | null;
  done: boolean;
}

export interface Habit {
  id: string;
  label: string;
  icon: string;
  done: Record<string, boolean>;
}

export interface Note {
  id: string;
  text: string;
  date: string;
}

export interface RoutineBlock {
  id: string;
  label: string;
  emoji: string;
  dur: number;
  color: string;
}

export interface Routine {
  id: string;
  name: string;
  emoji: string;
  color: string;
  blocks: RoutineBlock[];
}

export interface Workout {
  id: string;
  type: string;
  dur: string;
  date: string;
}

export interface Defi {
  id: string;
  label: string;
  days: number;
  startDate: string;
  log: Record<string, boolean>;
}

export interface CoachMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface XpLogEntry {
  date: string;
  amount: number;
  reason: string;
}

export interface Badge {
  id: string;
  label: string;
  icon: string;
  date: string;
}

export type EnergyLog = Record<string, number>;
export type MoodLog = Record<string, number>;
export type SleepLog = Record<string, { hours: number; quality: number; note?: string }>;
export type WaterLog = Record<string, number>;
export type WeightLog = Record<string, number>;
