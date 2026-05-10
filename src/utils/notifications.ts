import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler (show when app is in foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions.
 * Returns true if granted.
 */
export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule energy check-in reminders (3x/day).
 * Cancels existing ones first to avoid duplicates.
 */
export async function scheduleEnergyCheckins() {
  // Cancel existing energy reminders
  const all = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of all) {
    if (n.content.data?.type === 'energy-checkin') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  const times = [
    { hour: 9, minute: 0, title: 'Check-in matin ☀️', body: 'Comment tu te sens ce matin ? Note ton énergie.' },
    { hour: 14, minute: 0, title: 'Check-in après-midi 🌤', body: 'Petit point énergie — ça va ?' },
    { hour: 20, minute: 0, title: 'Check-in soir 🌙', body: 'Comment s\'est passée ta journée ?' },
  ];

  for (const t of times) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t.title,
        body: t.body,
        data: { type: 'energy-checkin' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: t.hour,
        minute: t.minute,
      },
    });
  }
}

/**
 * Schedule a reminder for an event.
 */
export async function scheduleEventReminder(
  eventId: string,
  title: string,
  date: string,
  time: string | null,
  minutesBefore: number = 15
) {
  if (!time) return;

  const [h, m] = time.split(':').map(Number);
  const eventDate = new Date(date + 'T00:00:00');
  eventDate.setHours(h, m, 0, 0);

  const triggerDate = new Date(eventDate.getTime() - minutesBefore * 60 * 1000);
  if (triggerDate <= new Date()) return; // Already past

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `📅 ${title}`,
      body: `Dans ${minutesBefore} minutes`,
      data: { type: 'event-reminder', eventId },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

/**
 * Schedule a streak reminder (daily at 21:00 if no routine done today).
 */
export async function scheduleStreakReminder() {
  // Cancel existing
  const all = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of all) {
    if (n.content.data?.type === 'streak') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Ta routine t\'attend 🌿',
      body: 'N\'oublie pas ta routine du soir pour garder ton streak !',
      data: { type: 'streak' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 21,
      minute: 0,
    },
  });
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAll() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
