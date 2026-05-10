import { StyleSheet } from 'react-native';
import { colors } from './colors';

/**
 * Shared style tokens for visual consistency across all screens.
 */

// ── Layout ──
export const SCROLL_PADDING = { paddingHorizontal: 14, paddingBottom: 40 };
export const CONTENT_GAP = 10;

// ── Radii ──
export const R = {
  card: 12,
  input: 9,
  button: 9,
  pill: 20,
  badge: 6,
  tag: 8,
} as const;

// ── Card presets ──
export const CARD_BORDER_WIDTH = 1.5;

// ── Section label (uppercase headers) ──
export const sectionLabelStyle = {
  fontFamily: 'Inter_700Bold',
  fontSize: 10,
  color: '#B0A090',
  textTransform: 'uppercase' as const,
  letterSpacing: 0.8,
  marginBottom: 8,
};

// ── Shared StyleSheets ──
export const shared = StyleSheet.create({
  // Sub-tab bar (used by planning, taches, moi, flowi)
  tabBar: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  tab: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: R.tag,
    backgroundColor: '#FAFBFF',
    borderWidth: CARD_BORDER_WIDTH,
    borderColor: colors.border,
  },
  tabText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#9CA3AF',
  },
  tabTextActive: {
    fontFamily: 'Inter_700Bold',
  },

  // Scroll container
  scroll: {
    paddingHorizontal: 14,
    paddingBottom: 40,
  },

  // Section label
  sectionLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#B0A090',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 2,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },

  // Card (neutral)
  card: {
    borderRadius: R.card,
    borderWidth: CARD_BORDER_WIDTH,
    padding: 10,
    paddingHorizontal: 12,
  },

  // Card header row (title left, link right)
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardHeaderText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardLink: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
  },

  // Input field
  input: {
    flex: 1,
    borderWidth: CARD_BORDER_WIDTH,
    borderColor: colors.border,
    borderRadius: R.input,
    paddingVertical: 7,
    paddingHorizontal: 10,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    backgroundColor: '#FFFFFF',
    color: colors.text,
  },

  // Add row (input + button)
  addRow: {
    flexDirection: 'row',
    gap: 6,
  },

  // Add button (+)
  addBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: R.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Scan / import button (dashed)
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginBottom: CONTENT_GAP,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: CARD_BORDER_WIDTH,
    borderStyle: 'dashed',
  },
  scanText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },

  // Navigation row (‹ title ›)
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: CONTENT_GAP,
    paddingHorizontal: 2,
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: CARD_BORDER_WIDTH,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  navTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 13,
    lineHeight: 17,
  },
  navSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: '#B0A090',
    marginTop: 1,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    padding: 32,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#D1C8B8',
    lineHeight: 18,
    textAlign: 'center',
  },

  // Voix Flowi (coaching message)
  voix: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 11,
    color: '#8B5CF6',
    fontStyle: 'italic',
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 8,
    opacity: 0.85,
  },

  // Checkbox
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
