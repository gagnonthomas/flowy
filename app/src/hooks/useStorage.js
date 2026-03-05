import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';

export function useStorage(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(key).then(stored => {
      if (stored !== null) {
        try { setValue(JSON.parse(stored)); } catch { setValue(stored); }
      }
      setLoaded(true);
    });
  }, [key]);

  const set = useCallback(async (newValue) => {
    const toStore = typeof newValue === 'function' ? newValue(value) : newValue;
    setValue(toStore);
    await AsyncStorage.setItem(key, JSON.stringify(toStore));
  }, [key, value]);

  return [value, set, loaded];
}

export async function getStored(key, fallback = null) {
  try {
    const v = await AsyncStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

export async function setStored(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}
