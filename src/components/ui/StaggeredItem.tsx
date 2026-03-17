import { type ReactNode } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface Props {
  children: ReactNode;
  index: number;
  baseDelay?: number;
  stagger?: number;
}

/**
 * Wraps a list item with a staggered FadeInDown animation.
 * Usage: <StaggeredItem index={i}>{content}</StaggeredItem>
 */
export function StaggeredItem({ children, index, baseDelay = 50, stagger = 60 }: Props) {
  return (
    <Animated.View entering={FadeInDown.delay(baseDelay + index * stagger).duration(300).springify().damping(18)}>
      {children}
    </Animated.View>
  );
}
