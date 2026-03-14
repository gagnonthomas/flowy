import { useState, useEffect, useCallback } from 'react';
import { AppState, Platform } from 'react-native';
import {
  requestCalendarPermissions,
  hasCalendarPermissions,
  fetchDeviceEvents,
  type DeviceEvent,
} from '@/services/calendar';

export function useCalendarSync() {
  const [deviceEvents, setDeviceEvents] = useState<DeviceEvent[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const sync = useCallback(async () => {
    if (Platform.OS === 'web') return;

    const granted = await hasCalendarPermissions();
    setHasPermission(granted);
    if (!granted) return;

    setLoading(true);
    try {
      // Fetch events for a 60-day window (30 days back, 30 days forward)
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      const end = new Date(now);
      end.setDate(end.getDate() + 30);

      const events = await fetchDeviceEvents(start, end);
      setDeviceEvents(events);
    } finally {
      setLoading(false);
    }
  }, []);

  const requestAndSync = useCallback(async () => {
    if (Platform.OS === 'web') return;

    const granted = await requestCalendarPermissions();
    setHasPermission(granted);
    if (granted) {
      await sync();
    }
  }, [sync]);

  // Initial sync on mount
  useEffect(() => {
    sync();
  }, [sync]);

  // Re-sync when app comes back to foreground
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        sync();
      }
    });
    return () => sub.remove();
  }, [sync]);

  // Helper: get events for a specific date
  const eventsForDate = useCallback(
    (date: string) => deviceEvents.filter((e) => e.date === date),
    [deviceEvents],
  );

  return {
    deviceEvents,
    eventsForDate,
    hasPermission,
    loading,
    sync,
    requestAndSync,
  };
}
