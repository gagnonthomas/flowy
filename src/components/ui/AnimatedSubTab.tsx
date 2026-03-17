import { type ReactNode } from 'react';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideInLeft } from 'react-native-reanimated';

interface Props {
  children: ReactNode;
  direction?: 'right' | 'left' | 'fade';
}

/**
 * Wrapper that animates sub-tab content on enter/exit.
 * Use direction='right' for forward navigation, 'left' for back.
 */
export function AnimatedSubTab({ children, direction = 'fade' }: Props) {
  const entering = direction === 'right'
    ? SlideInRight.duration(250).springify().damping(20)
    : direction === 'left'
      ? SlideInLeft.duration(250).springify().damping(20)
      : FadeIn.duration(200);

  return (
    <Animated.View entering={entering} style={{ flex: 1 }}>
      {children}
    </Animated.View>
  );
}
