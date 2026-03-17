import { useEffect, useState, useCallback } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, runOnJS } from 'react-native-reanimated';

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'info' | 'xp';
}

let listeners: ((msg: ToastMessage) => void)[] = [];
let nextId = 0;

/**
 * Show a toast from anywhere.
 * Usage: showToast('Tâche complétée !', 'success')
 */
export function showToast(text: string, type: 'success' | 'info' | 'xp' = 'success') {
  const msg: ToastMessage = { id: nextId++, text, type };
  listeners.forEach((fn) => fn(msg));
}

const COLORS = {
  success: { bg: '#10B981', text: '#FFFFFF', icon: '✅' },
  info: { bg: '#6366F1', text: '#FFFFFF', icon: '💬' },
  xp: { bg: '#F59E0B', text: '#FFFFFF', icon: '⭐' },
};

/**
 * Place <ToastProvider /> once in your root layout.
 */
export function ToastProvider() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);

  const hide = useCallback(() => setToast(null), []);

  useEffect(() => {
    const listener = (msg: ToastMessage) => {
      setToast(msg);
      translateY.value = -80;
      opacity.value = 0;
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });
      // Auto-hide after 2.5s
      translateY.value = withDelay(2500, withTiming(-80, { duration: 300 }));
      opacity.value = withDelay(2500, withTiming(0, { duration: 300 }, () => {
        runOnJS(hide)();
      }));
    };
    listeners.push(listener);
    return () => { listeners = listeners.filter((l) => l !== listener); };
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!toast) return null;

  const c = COLORS[toast.type];

  return (
    <Animated.View style={[s.container, { backgroundColor: c.bg }, animStyle]}>
      <Text style={s.icon}>{c.icon}</Text>
      <Text style={[s.text, { color: c.text }]}>{toast.text}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  icon: { fontSize: 18 },
  text: { fontFamily: 'Inter_600SemiBold', fontSize: 13, flex: 1, lineHeight: 18 },
});
