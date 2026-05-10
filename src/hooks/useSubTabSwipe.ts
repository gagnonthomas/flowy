import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

/**
 * Hook that returns a Pan gesture for swiping between sub-tabs.
 * Swipe left = next tab, swipe right = previous tab.
 *
 * Usage:
 *   const swipe = useSubTabSwipe(tabs, currentTab, setCurrentTab);
 *   <GestureDetector gesture={swipe}>...</GestureDetector>
 */
export function useSubTabSwipe<T extends string>(
  tabs: readonly T[],
  current: T,
  setCurrent: (tab: T) => void
) {
  const goNext = () => {
    const idx = tabs.indexOf(current);
    if (idx < tabs.length - 1) {
      setCurrent(tabs[idx + 1]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const goPrev = () => {
    const idx = tabs.indexOf(current);
    if (idx > 0) {
      setCurrent(tabs[idx - 1]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return Gesture.Pan()
    .activeOffsetX([-25, 25])
    .failOffsetY([-15, 15])
    .onEnd((e) => {
      'worklet';
      if (e.translationX < -60) {
        runOnJS(goNext)();
      } else if (e.translationX > 60) {
        runOnJS(goPrev)();
      }
    });
}
