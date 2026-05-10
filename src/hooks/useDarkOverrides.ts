import { useMemo } from 'react';
import { StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { useTheme } from './useTheme';
import { DARK_CARDS } from '@/constants/theme';

const EMPTY = {} as ViewStyle;
const EMPTY_T = {} as TextStyle;

/**
 * Returns dark mode style overrides for common UI patterns.
 * Apply these via style arrays: style={[styles.card, d.card]}
 */
export function useDarkOverrides() {
  const { dark, t } = useTheme();

  return useMemo(() => {
    if (!dark) return {
      card: EMPTY, cardAlt: EMPTY, input: EMPTY,
      tab: EMPTY, tabActive: EMPTY, text: EMPTY_T, textMuted: EMPTY_T,
      divider: EMPTY, screenBg: EMPTY,
      // Section cards (no-op in light)
      prioCard: EMPTY, rdvCard: EMPTY, habCard: EMPTY,
      energyCard: EMPTY, notesCard: EMPTY, timelineCard: EMPTY,
      rappelCard: EMPTY, taskCard: EMPTY, oracleCard: EMPTY,
      dumpCard: EMPTY, progressCard: EMPTY, reviewCard: EMPTY,
      scanBtn: EMPTY, scanText: EMPTY_T,
      weekCol: EMPTY, weekColToday: EMPTY,
      sectionLabel: EMPTY_T,
    };

    const dc = DARK_CARDS;
    return StyleSheet.create({
      // Generic
      card: { backgroundColor: t.cardBg, borderColor: t.border },
      cardAlt: { backgroundColor: t.surface, borderColor: t.border },
      input: { backgroundColor: t.inputBg, borderColor: t.border, color: t.text },
      tab: { backgroundColor: t.surface, borderColor: t.border },
      tabActive: { backgroundColor: t.surface },
      text: { color: t.text },
      textMuted: { color: t.muted },
      divider: { backgroundColor: t.divider },
      screenBg: { backgroundColor: t.screenBg },

      // Section-specific colored cards
      prioCard: { backgroundColor: dc.prioCard.bg, borderColor: dc.prioCard.border },
      rdvCard: { backgroundColor: dc.rdvCard.bg, borderColor: dc.rdvCard.border },
      habCard: { backgroundColor: dc.habCard.bg, borderColor: dc.habCard.border },
      energyCard: { backgroundColor: dc.energyCard.bg, borderColor: dc.energyCard.border },
      notesCard: { backgroundColor: dc.notesCard.bg, borderColor: dc.notesCard.border },
      timelineCard: { backgroundColor: dc.timelineCard.bg, borderColor: dc.timelineCard.border },
      rappelCard: { backgroundColor: dc.rappelCard.bg, borderColor: dc.rappelCard.border },
      taskCard: { backgroundColor: dc.taskCard.bg, borderColor: dc.taskCard.border },
      oracleCard: { backgroundColor: dc.oracleCard.bg, borderColor: dc.oracleCard.border },
      dumpCard: { backgroundColor: dc.dumpCard.bg, borderColor: dc.dumpCard.border },
      progressCard: { backgroundColor: dc.progressCard.bg, borderColor: dc.progressCard.border },
      reviewCard: { backgroundColor: dc.reviewCard.bg, borderColor: dc.reviewCard.border },
      scanBtn: { backgroundColor: dc.scanBtn.bg, borderColor: dc.scanBtn.border },
      scanText: { color: dc.scanBtn.text },
      weekCol: { backgroundColor: dc.weekCol.bg, borderColor: dc.weekCol.border },
      weekColToday: { backgroundColor: dc.weekColToday.bg, borderColor: dc.weekColToday.border },
      sectionLabel: { color: dc.sectionLabel },
    });
  }, [dark, t]);
}
