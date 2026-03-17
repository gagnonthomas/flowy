/**
 * Widget data provider.
 *
 * This module prepares data for the iOS/Android widget.
 * The widget shows today's tasks, events, and XP.
 *
 * For iOS: Uses App Groups to share data with WidgetKit extension.
 * For Android: Uses SharedPreferences to share data with AppWidget.
 *
 * SETUP REQUIRED (dev build only, not Expo Go):
 * 1. npx expo install react-native-shared-group-preferences
 * 2. Create iOS Widget Extension target
 * 3. Create Android AppWidgetProvider
 *
 * This file provides the data layer — the native widget UI is separate.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToday } from '@/utils/date';

export interface WidgetData {
  date: string;
  greeting: string;
  todayTasks: { text: string; done: boolean; priority: string }[];
  todayEvents: { title: string; time: string | null }[];
  xp: number;
  level: number;
  streak: number;
}

/**
 * Build the widget data from the current store state.
 */
export function buildWidgetData(state: any): WidgetData {
  const today = getToday();
  const nowH = new Date().getHours();
  const greeting = nowH < 12 ? 'Bonjour ☀️' : nowH < 18 ? 'Bon après-midi 🌤' : 'Bonsoir 🌙';

  const todayTasks = (state.todos || [])
    .filter((t: any) => t.scheduledDate === today || t.doneDate === today)
    .slice(0, 5)
    .map((t: any) => ({ text: t.text, done: t.done, priority: t.priority }));

  const todayEvents = (state.events || [])
    .filter((e: any) => e.date === today)
    .sort((a: any, b: any) => (a.time || '').localeCompare(b.time || ''))
    .slice(0, 3)
    .map((e: any) => ({ title: e.title, time: e.time }));

  // Calculate streak
  let streak = 0;
  const routines = state.routines || [];
  const routineLog = state.routineLog || {};
  routines.forEach((r: any) => {
    let s = 0;
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    while (true) {
      const ds = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      if (routineLog[`${r.id}-${ds}`]) { s++; d.setDate(d.getDate() - 1); } else break;
    }
    if (s > streak) streak = s;
  });

  // Level
  const xp = state.xp || 0;
  const XP_LEVELS = [0, 50, 150, 300, 500, 800, 1200, 1800, 2500, 3500, 5000];
  let level = 1;
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i]) { level = i + 1; break; }
  }

  return { date: today, greeting, todayTasks, todayEvents, xp, level, streak };
}

/**
 * Save widget data to shared storage.
 * Call this after any store change that affects widget data.
 */
export async function saveWidgetData(data: WidgetData) {
  try {
    await AsyncStorage.setItem('flowi-widget-data', JSON.stringify(data));
    // TODO: For dev build, also save to App Groups (iOS) / SharedPreferences (Android)
    // import SharedGroupPreferences from 'react-native-shared-group-preferences';
    // await SharedGroupPreferences.setItem('widgetData', JSON.stringify(data), 'group.com.flowy.app');
  } catch (e) {
    console.warn('Widget data save error:', e);
  }
}
