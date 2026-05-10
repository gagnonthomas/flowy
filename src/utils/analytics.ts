import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'flowi-analytics';

interface AnalyticsEvent {
  type: 'screen_view' | 'feature_use' | 'action';
  name: string;
  timestamp: string;
  meta?: Record<string, string | number>;
}

let buffer: AnalyticsEvent[] = [];

/**
 * Track a screen view.
 */
export function trackScreen(name: string) {
  push({ type: 'screen_view', name, timestamp: new Date().toISOString() });
}

/**
 * Track a feature usage.
 */
export function trackFeature(name: string, meta?: Record<string, string | number>) {
  push({ type: 'feature_use', name, timestamp: new Date().toISOString(), meta });
}

/**
 * Track a user action.
 */
export function trackAction(name: string, meta?: Record<string, string | number>) {
  push({ type: 'action', name, timestamp: new Date().toISOString(), meta });
}

function push(event: AnalyticsEvent) {
  buffer.push(event);
  // Flush every 10 events
  if (buffer.length >= 10) flush();
}

/**
 * Persist buffered events to AsyncStorage.
 */
export async function flush() {
  if (buffer.length === 0) return;
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    const events: AnalyticsEvent[] = existing ? JSON.parse(existing) : [];
    // Keep last 500 events max
    const merged = [...events, ...buffer].slice(-500);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    buffer = [];
  } catch (e) {
    console.warn('Analytics flush error:', e);
  }
}

/**
 * Get all stored analytics events.
 */
export async function getEvents(): Promise<AnalyticsEvent[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Get usage summary (screen visits, feature counts).
 */
export async function getSummary(): Promise<{
  screens: Record<string, number>;
  features: Record<string, number>;
  totalEvents: number;
}> {
  const events = await getEvents();
  const screens: Record<string, number> = {};
  const features: Record<string, number> = {};

  events.forEach((e) => {
    if (e.type === 'screen_view') {
      screens[e.name] = (screens[e.name] || 0) + 1;
    } else if (e.type === 'feature_use') {
      features[e.name] = (features[e.name] || 0) + 1;
    }
  });

  return { screens, features, totalEvents: events.length };
}
