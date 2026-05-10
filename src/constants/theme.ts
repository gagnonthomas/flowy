import { colors } from './colors';

export const COLORS = {
  light: {
    bg: colors.bg,
    surface: colors.surface,
    border: '#E8EDF5',
    text: colors.text,
    muted: colors.muted,
    subtle: colors.subtle,
    screenBg: '#FFFFFF',
    cardBg: '#FFFFFF',
    inputBg: '#FFFFFF',
    sidebarBg: colors.surface,
    sidebarBorder: '#E8EDF5',
    wordmark: '#7C3AED',
    tagline: '#9CA3AF',
    // Specific UI
    placeholder: '#9CA3AF',
    divider: '#E8EDF5',
    activeIndicator: 'rgba(255,255,255,0.1)',
  },
  dark: {
    bg: colors.dark.bg,
    surface: colors.dark.surface,
    border: colors.dark.border,
    text: colors.dark.text,
    muted: colors.dark.muted,
    subtle: colors.dark.subtle,
    screenBg: '#0f0f1a',
    cardBg: '#1a1a2e',
    inputBg: '#1e1e36',
    sidebarBg: '#12122a',
    sidebarBorder: '#2a2a3e',
    wordmark: '#A78BFA',
    tagline: '#6366F1',
    // Specific UI
    placeholder: '#6B7280',
    divider: '#2a2a3e',
    activeIndicator: 'rgba(255,255,255,0.08)',
  },
} as const;

export type Theme = {
  [K in keyof typeof COLORS.light]: string;
};

/**
 * Dark variants of section-specific card colors.
 * Use these for colored cards (priorities, RDV, habits, etc.) in dark mode.
 */
export const DARK_CARDS = {
  // Priorities (amber)
  prioCard: { bg: '#1a1508', border: '#5C3D0E', headerText: '#F59E0B' },
  prioSlot: { bg: '#1a1a0a', border: '#5C4A0E' },
  // RDV (blue)
  rdvCard: { bg: '#0a1628', border: '#1E3A5F', headerText: '#60A5FA' },
  // Habits (green)
  habCard: { bg: '#0a1a12', border: '#14532D', headerText: '#34D399' },
  habChipDone: { bg: '#0a2818', border: '#166534' },
  // Energy (pink)
  energyCard: { bg: '#1a0a18', border: '#4A1942', headerText: '#F472B6' },
  // Notes (green dark)
  notesCard: { bg: '#0a1a12', border: '#14532D', headerText: '#6EE7B7' },
  // Timeline (blue)
  timelineCard: { bg: '#0a1628', border: '#1E3A5F' },
  // Rappels (red)
  rappelCard: { bg: '#1a0a0a', border: '#5C1616' },
  // Tasks (purple)
  taskCard: { bg: '#12082a', border: '#3B1F6E' },
  // Oracle (purple)
  oracleCard: { bg: '#12082a', border: '#4C1D95' },
  // Brain dump (indigo)
  dumpCard: { bg: '#0a0828', border: '#312E81' },
  // Progress (golden)
  progressCard: { bg: '#1a1508', border: '#5C3D0E' },
  // Review (warm)
  reviewCard: { bg: '#1a1508', border: '#5C4A0E' },
  // Scan button
  scanBtn: { bg: '#0a1628', border: '#1E3A5F', text: '#60A5FA' },
  // Week grid
  weekCol: { bg: '#12122a', border: '#2a2a3e' },
  weekColToday: { bg: '#1a1040', border: '#6D28D9' },
  // Calendar
  calWeek: { bg: '#12122a', border: '#2a2a3e' },
  // Generic section colors for dark
  sectionLabel: '#6B7280',
} as const;

