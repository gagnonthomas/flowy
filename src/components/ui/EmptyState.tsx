import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';

interface Props {
  emoji: string;
  title: string;
  subtitle?: string;
  /** Optional secondary floating emojis */
  floatingEmojis?: string[];
}

/**
 * Rich empty state with animated emoji and floating decorations.
 */
export function EmptyState({ emoji, title, subtitle, floatingEmojis }: Props) {
  return (
    <View style={s.container}>
      {/* Floating decorations */}
      {floatingEmojis && (
        <View style={s.floatingWrap}>
          {floatingEmojis.map((e, i) => (
            <FloatingEmoji key={i} emoji={e} index={i} />
          ))}
        </View>
      )}

      {/* Main emoji with pulse */}
      <Animated.View entering={FadeIn.duration(600)}>
        <PulsingEmoji emoji={emoji} />
      </Animated.View>

      <Animated.Text entering={FadeInDown.delay(200).duration(500)} style={s.title}>
        {title}
      </Animated.Text>

      {subtitle && (
        <Animated.Text entering={FadeInDown.delay(400).duration(500)} style={s.subtitle}>
          {subtitle}
        </Animated.Text>
      )}
    </View>
  );
}

function PulsingEmoji({ emoji }: { emoji: string }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[s.emoji, style]}>{emoji}</Animated.Text>
  );
}

function FloatingEmoji({ emoji, index }: { emoji: string; index: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  const positions = [
    { left: '10%', top: 5 },
    { left: '75%', top: 15 },
    { left: '20%', top: 50 },
    { left: '70%', top: 45 },
    { left: '45%', top: 65 },
  ];
  const pos = positions[index % positions.length];

  useEffect(() => {
    opacity.value = withDelay(index * 300, withTiming(0.3, { duration: 800 }));
    translateY.value = withDelay(
      index * 300,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 2000 + index * 500 }),
          withTiming(0, { duration: 2000 + index * 500 })
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[s.floating, { left: pos.left as any, top: pos.top }, style]}>
      {emoji}
    </Animated.Text>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    position: 'relative',
  },
  floatingWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floating: {
    position: 'absolute',
    fontSize: 20,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 16,
    color: '#8B7FC7',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
