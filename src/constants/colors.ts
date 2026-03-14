export const colors = {
  // Section accents
  accueil: { accent: '#6366F1', light: '#EEF2FF', border: '#C7D2FE', text: '#3730A3' },
  agenda: { accent: '#3B82F6', light: '#EFF6FF', border: '#BAD8FB', text: '#1E3A8A' },
  focus: { accent: '#6366F1', light: '#EEF2FF', border: '#C7D2FE', text: '#3730A3' },
  planning: { accent: '#8B5CF6', light: '#F5F3FF', border: '#DDD6FE', text: '#4C1D95' },
  todos: { accent: '#C4961A', light: '#FFFBEB', border: '#F0D080', text: '#78480A' },
  moi: { accent: '#10B981', light: '#ECFDF5', border: '#A7F3D0', text: '#065F46' },
  flowi: { accent: '#6D28D9', light: '#EDE9FE', border: '#C4B5FD', text: '#4C1D95' },

  // Priorities
  urgente: '#DC2626',
  haute: '#EA580C',
  normale: '#3B82F6',
  basse: '#16A34A',

  // Neutrals
  bg: '#FAFBFF',
  surface: '#FFFFFF',
  border: '#E8EDF5',
  text: '#1F2937',
  muted: '#9CA3AF',
  subtle: '#B0A090',

  // Dark mode
  dark: {
    bg: '#0f0f1a',
    surface: '#1a1a2e',
    border: '#2a2a3e',
    text: '#E5E7EB',
    muted: '#6B7280',
    subtle: '#8B8070',
  },
} as const;

// Event categories (from source)
export const CATEGORIES = {
  rdv: { label: 'RDV', color: '#3B82F6', bg: '#EFF6FF' },
  tache: { label: 'Tâche', color: '#8B5CF6', bg: '#F5F3FF' },
  perso: { label: 'Perso', color: '#10B981', bg: '#ECFDF5' },
  sante: { label: 'Santé', color: '#EF4444', bg: '#FFF1F2' },
  famille: { label: 'Famille', color: '#F59E0B', bg: '#FFF7ED' },
} as const;

// Month colors for calendar
export const MONTH_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F43F5E', '#6366F1', '#84CC16',
] as const;

export type CategoryKey = keyof typeof CATEGORIES;
export type PriorityKey = 'urgente' | 'haute' | 'normale' | 'basse';
