import { StyleSheet } from 'react-native';
import { colors } from './colors';

/**
 * Shared paper-aesthetic styles used across every tab.
 *
 * Goal: every screen looks like a page from the same notebook —
 * warm cream surface, beige rules, ink typography, terracotta accents,
 * no gradients, no shadows.
 */
export const paper = StyleSheet.create({
  // Containers
  screen: {
    flex: 1,
    backgroundColor: colors.paper.bg,
  },
  scroll: {
    padding: 14,
    paddingBottom: 40,
    gap: 14,
  },

  // Cards (the unit shared by Priorités, RDV, Habitudes, etc.)
  card: {
    backgroundColor: colors.paper.bgLight,
    borderWidth: 1,
    borderColor: colors.paper.rule,
    borderRadius: 4,
    padding: 14,
    paddingHorizontal: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardHeaderText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 14,
    color: colors.paper.ink,
    letterSpacing: -0.1,
  },
  cardLink: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: colors.paper.accent,
  },

  // Section header (above a group of cards, like "Outils de secours")
  sectionHeader: {
    fontFamily: 'PlayfairDisplay_900Black_Italic',
    fontSize: 14,
    color: colors.paper.inkSoft,
    fontStyle: 'italic',
    marginBottom: 10,
    marginTop: 4,
    letterSpacing: -0.2,
  },

  // Sub-tab bar (e.g., Agenda | Routines)
  subTabBar: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.paper.rule,
    backgroundColor: colors.paper.bg,
  },
  subTab: {
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  subTabText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 14,
    color: colors.paper.inkMuted,
    letterSpacing: -0.1,
  },
  subTabTextActive: {
    color: colors.paper.ink,
    borderBottomWidth: 2,
    borderBottomColor: colors.paper.accent,
    paddingBottom: 4,
  },

  // List row (used inside cards for sublists)
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.paper.rule,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.paper.ink,
    flex: 1,
    lineHeight: 19,
  },
  rowMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.paper.inkMuted,
    marginTop: 2,
    letterSpacing: 0.4,
  },

  // Empty state — italic notebook annotation
  empty: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.paper.inkMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },

  // Buttons
  primaryBtn: {
    backgroundColor: colors.paper.accent,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 4,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.paper.bgLight,
    letterSpacing: 0.2,
  },
  ghostBtn: {
    borderWidth: 1,
    borderColor: colors.paper.rule,
    backgroundColor: colors.paper.bgLight,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  ghostBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.paper.ink,
  },
});

// Convenience text styles (use directly when you don't want a card)
export const paperText = {
  display: { fontFamily: 'PlayfairDisplay_700Bold', color: colors.paper.ink },
  displayItalic: { fontFamily: 'PlayfairDisplay_900Black_Italic', fontStyle: 'italic' as const, color: colors.paper.ink },
  body: { fontFamily: 'Inter_400Regular', color: colors.paper.ink },
  bodySoft: { fontFamily: 'Inter_400Regular', color: colors.paper.inkSoft },
  meta: { fontFamily: 'Inter_400Regular', color: colors.paper.inkMuted, fontSize: 11, letterSpacing: 0.4 },
  metaCaps: {
    fontFamily: 'Inter_400Regular',
    color: colors.paper.inkMuted,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
};
