import { Platform } from 'react-native';
import type { Event } from '@/types';

// Lazy-load expo-calendar to avoid crashing on web
function getCalendarModule() {
  return require('expo-calendar') as typeof import('expo-calendar');
}

const FLOWI_CALENDAR_TITLE = 'Flowi';

// ── Permissions ──

export async function requestCalendarPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const Cal = getCalendarModule();
  const { status } = await Cal.requestCalendarPermissionsAsync();
  return status === 'granted';
}

export async function hasCalendarPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const Cal = getCalendarModule();
  const { status } = await Cal.getCalendarPermissionsAsync();
  return status === 'granted';
}

// ── Calendar management ──

export async function getOrCreateFlowiCalendar(): Promise<string | null> {
  try {
    const Cal = getCalendarModule();
    const calendars = await Cal.getCalendarsAsync(Cal.EntityTypes.EVENT);

    // Look for existing Flowi calendar
    const existing = calendars.find((c) => c.title === FLOWI_CALENDAR_TITLE);
    if (existing) return existing.id;

    // Create a new one
    if (Platform.OS === 'ios') {
      const defaultCalendar = calendars.find((c) => c.allowsModifications && c.source);
      if (!defaultCalendar?.source) return null;

      const newId = await Cal.createCalendarAsync({
        title: FLOWI_CALENDAR_TITLE,
        color: '#6D28D9',
        entityType: Cal.EntityTypes.EVENT,
        sourceId: defaultCalendar.source.id,
        source: {
          name: defaultCalendar.source.name,
          type: defaultCalendar.source.type as string,
          isLocalAccount: defaultCalendar.source.isLocalAccount,
        },
        name: FLOWI_CALENDAR_TITLE,
        accessLevel: Cal.CalendarAccessLevel.OWNER,
        ownerAccount: 'Flowi',
      });
      return newId;
    }

    if (Platform.OS === 'android') {
      const newId = await Cal.createCalendarAsync({
        title: FLOWI_CALENDAR_TITLE,
        color: '#6D28D9',
        entityType: Cal.EntityTypes.EVENT,
        source: {
          name: 'Flowi',
          type: 'LOCAL',
          isLocalAccount: true,
        },
        name: FLOWI_CALENDAR_TITLE,
        accessLevel: Cal.CalendarAccessLevel.OWNER,
        ownerAccount: 'Flowi',
      });
      return newId;
    }

    return null;
  } catch {
    return null;
  }
}

// ── Date conversion helpers ──

function flowiToDate(date: string, time: string | null): Date {
  const [y, m, d] = date.split('-').map(Number);
  if (time) {
    const [h, min] = time.split(':').map(Number);
    return new Date(y, m - 1, d, h, min);
  }
  return new Date(y, m - 1, d, 0, 0);
}

function flowiEndDate(date: string, time: string | null, endTime: string | null): Date {
  if (endTime) {
    return flowiToDate(date, endTime);
  }
  if (time) {
    // Default 1h duration
    const start = flowiToDate(date, time);
    return new Date(start.getTime() + 60 * 60 * 1000);
  }
  // All-day: end = same day 23:59
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59);
}

const pad = (n: number) => String(n).padStart(2, '0');

function dateToFlowiDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dateToFlowiTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Fetch device events ──

export interface DeviceEvent {
  id: string;
  deviceEventId: string;
  title: string;
  date: string;
  time: string | null;
  endTime: string | null;
  allDay: boolean;
  calendarTitle: string;
  calendarColor: string;
  source: 'device';
}

export async function fetchDeviceEvents(
  startDate: Date,
  endDate: Date,
): Promise<DeviceEvent[]> {
  if (Platform.OS === 'web') return [];

  try {
    const hasPerms = await hasCalendarPermissions();
    if (!hasPerms) return [];

    const Cal = getCalendarModule();
    const calendars = await Cal.getCalendarsAsync(Cal.EntityTypes.EVENT);
    const calendarIds = calendars
      .filter((c) => c.allowsModifications || c.title !== FLOWI_CALENDAR_TITLE)
      .map((c) => c.id);

    if (calendarIds.length === 0) return [];

    const events = await Cal.getEventsAsync(calendarIds, startDate, endDate);

    // Build a lookup for calendar colors/titles
    const calMap = new Map(calendars.map((c) => [c.id, c]));

    return events
      .filter((e) => {
        // Skip events from the Flowi calendar (we already have those in store)
        const cal = calMap.get(e.calendarId);
        return cal?.title !== FLOWI_CALENDAR_TITLE;
      })
      .map((e) => {
        const start = new Date(e.startDate);
        const end = new Date(e.endDate);
        const cal = calMap.get(e.calendarId);
        return {
          id: `device-${e.id}`,
          deviceEventId: e.id,
          title: e.title || '(sans titre)',
          date: dateToFlowiDate(start),
          time: e.allDay ? null : dateToFlowiTime(start),
          endTime: e.allDay ? null : dateToFlowiTime(end),
          allDay: e.allDay ?? false,
          calendarTitle: cal?.title ?? '',
          calendarColor: cal?.color ?? '#3B82F6',
          source: 'device' as const,
        };
      });
  } catch {
    return [];
  }
}

// ── Push Flowi events to device calendar ──

export async function pushEventToDevice(event: Event): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const Cal = getCalendarModule();
    const calendarId = await getOrCreateFlowiCalendar();
    if (!calendarId) return null;

    const deviceEventId = await Cal.createEventAsync(calendarId, {
      title: event.title,
      startDate: flowiToDate(event.date, event.time),
      endDate: flowiEndDate(event.date, event.time, event.endTime),
      allDay: !event.time,
      notes: event.note || undefined,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    return deviceEventId;
  } catch {
    return null;
  }
}

export async function updateDeviceEvent(
  deviceEventId: string,
  event: Event,
): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const Cal = getCalendarModule();
    await Cal.updateEventAsync(deviceEventId, {
      title: event.title,
      startDate: flowiToDate(event.date, event.time),
      endDate: flowiEndDate(event.date, event.time, event.endTime),
      allDay: !event.time,
      notes: event.note || undefined,
    });
    return true;
  } catch {
    return false;
  }
}

export async function deleteDeviceEvent(deviceEventId: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const Cal = getCalendarModule();
    await Cal.deleteEventAsync(deviceEventId);
    return true;
  } catch {
    return false;
  }
}
