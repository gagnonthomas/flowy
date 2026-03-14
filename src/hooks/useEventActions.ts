import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useFlowiStore } from '@/store';
import type { Event } from '@/types';

/**
 * Wraps store event actions with device calendar sync.
 * Calendar sync is fire-and-forget — failures don't block the UI.
 */
export function useEventActions() {
  const addEvent = useFlowiStore((s) => s.addEvent);
  const setEventDeviceId = useFlowiStore((s) => s.setEventDeviceId);
  const updateEvent = useFlowiStore((s) => s.updateEvent);
  const deleteEvent = useFlowiStore((s) => s.deleteEvent);
  const events = useFlowiStore((s) => s.events);

  const addEventWithSync = useCallback(
    (event: Omit<Event, 'id' | 'done'>) => {
      addEvent(event);
      if (Platform.OS === 'web') return;

      // Find the newly added event (last one)
      // We need to get it after state updates, so use setTimeout
      setTimeout(async () => {
        try {
          const { pushEventToDevice } = await import('@/services/calendar');
          const state = useFlowiStore.getState();
          const newEvent = state.events[state.events.length - 1];
          if (newEvent) {
            const deviceEventId = await pushEventToDevice(newEvent);
            if (deviceEventId) {
              setEventDeviceId(newEvent.id, deviceEventId);
            }
          }
        } catch {}
      }, 100);
    },
    [addEvent, setEventDeviceId],
  );

  const updateEventWithSync = useCallback(
    (id: string, updates: Partial<Event>) => {
      updateEvent(id, updates);
      if (Platform.OS === 'web') return;

      const event = events.find((e) => e.id === id);
      if (event?.deviceEventId) {
        const updated = { ...event, ...updates };
        import('@/services/calendar').then(({ updateDeviceEvent }) => {
          updateDeviceEvent(event.deviceEventId!, updated).catch(() => {});
        }).catch(() => {});
      }
    },
    [updateEvent, events],
  );

  const deleteEventWithSync = useCallback(
    (id: string) => {
      const event = events.find((e) => e.id === id);
      deleteEvent(id);
      if (Platform.OS === 'web') return;

      if (event?.deviceEventId) {
        import('@/services/calendar').then(({ deleteDeviceEvent }) => {
          deleteDeviceEvent(event.deviceEventId!).catch(() => {});
        }).catch(() => {});
      }
    },
    [deleteEvent, events],
  );

  return {
    addEvent: addEventWithSync,
    updateEvent: updateEventWithSync,
    deleteEvent: deleteEventWithSync,
  };
}
