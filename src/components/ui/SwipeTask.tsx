import { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';

const THRESHOLD = 72;

interface SwipeTaskProps {
  children: ReactNode;
  onComplete?: () => void;
  onDelete?: () => void;
}

export function SwipeTask({ children, onComplete, onDelete }: SwipeTaskProps) {
  const translateX = useSharedValue(0);
  const triggered = useSharedValue(false);

  const triggerComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete?.();
  };

  const triggerDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete?.();
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      translateX.value = Math.max(-140, Math.min(140, e.translationX));
      if (!triggered.value && Math.abs(e.translationX) > THRESHOLD) {
        triggered.value = true;
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
    })
    .onEnd((e) => {
      if (e.translationX < -THRESHOLD && onComplete) {
        runOnJS(triggerComplete)();
      } else if (e.translationX > THRESHOLD && onDelete) {
        runOnJS(triggerDelete)();
      }
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      triggered.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor:
      translateX.value < -20 ? '#DCFCE7' :
      translateX.value > 20 ? '#FEE2E2' :
      'transparent',
  }));

  return (
    <Animated.View style={[styles.wrapper, bgStyle]}>
      {/* Left hint (delete) */}
      <View style={styles.hintLeft}>
        <Text style={styles.hintText}>🗑️</Text>
      </View>
      {/* Right hint (complete) */}
      <View style={styles.hintRight}>
        <Text style={styles.hintText}>✅</Text>
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View style={animatedStyle}>
          {children}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 10,
    marginBottom: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  hintLeft: {
    position: 'absolute',
    left: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  hintRight: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  hintText: {
    fontSize: 18,
  },
});
