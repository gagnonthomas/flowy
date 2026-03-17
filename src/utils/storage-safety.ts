import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_STORAGE_MB = 5;
const WARN_THRESHOLD = 0.8; // warn at 80%

/**
 * Check AsyncStorage usage and clean up if needed.
 * Returns { ok, usedMB, pct }
 */
export async function checkStorage(): Promise<{ ok: boolean; usedMB: number; pct: number }> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    let totalBytes = 0;

    for (const key of keys) {
      const val = await AsyncStorage.getItem(key);
      if (val) totalBytes += val.length * 2; // UTF-16
    }

    const usedMB = totalBytes / (1024 * 1024);
    const pct = usedMB / MAX_STORAGE_MB;

    if (pct >= WARN_THRESHOLD) {
      console.warn(`AsyncStorage at ${Math.round(pct * 100)}% (${usedMB.toFixed(2)}MB / ${MAX_STORAGE_MB}MB)`);
      await cleanupOldData();
    }

    return { ok: pct < 1, usedMB, pct };
  } catch (e) {
    console.warn('Storage check error:', e);
    return { ok: true, usedMB: 0, pct: 0 };
  }
}

/**
 * Clean up old analytics and XP log entries to free space.
 */
async function cleanupOldData() {
  try {
    // Trim analytics to last 200 events
    const analyticsRaw = await AsyncStorage.getItem('flowi-analytics');
    if (analyticsRaw) {
      const events = JSON.parse(analyticsRaw);
      if (events.length > 200) {
        await AsyncStorage.setItem('flowi-analytics', JSON.stringify(events.slice(-200)));
      }
    }

    // Trim store's xpLog (via the persisted zustand key)
    const storeRaw = await AsyncStorage.getItem('flowi-storage');
    if (storeRaw) {
      const store = JSON.parse(storeRaw);
      if (store.state?.xpLog?.length > 100) {
        store.state.xpLog = store.state.xpLog.slice(-100);
        await AsyncStorage.setItem('flowi-storage', JSON.stringify(store));
      }
      // Clean old coach messages (keep last 50)
      if (store.state?.coachMessages?.length > 50) {
        store.state.coachMessages = store.state.coachMessages.slice(-50);
        await AsyncStorage.setItem('flowi-storage', JSON.stringify(store));
      }
    }
  } catch (e) {
    console.warn('Cleanup error:', e);
  }
}

/**
 * Safe wrapper for AsyncStorage.setItem that handles quota errors.
 */
export async function safeSetItem(key: string, value: string): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    if (e?.message?.includes('quota') || e?.message?.includes('full') || e?.message?.includes('QUOTA')) {
      console.error('Storage full! Attempting cleanup...');
      await cleanupOldData();
      try {
        await AsyncStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    }
    throw e;
  }
}
