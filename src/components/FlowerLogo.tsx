import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { G, Path, Svg } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { COLORS } from "@/constants/theme";

const AnimatedPath = Animated.createAnimatedComponent(Path);

const DASH = 800;

const PATHS = [
  { d: "M -10,20 C -35,45 -100,42 -128,16 C -112,-14 -58,-2 -10,20 Z", delay: 0, duration: 900 },
  { d: "M 10,20 C 35,45 100,42 128,16 C 112,-14 58,-2 10,20 Z", delay: 350, duration: 900 },
  { d: "M -5,14 C -40,2 -76,-48 -56,-104 C -32,-82 -12,-32 -5,14 Z", delay: 750, duration: 950 },
  { d: "M 5,14 C 40,2 76,-48 56,-104 C 32,-82 12,-32 5,14 Z", delay: 1100, duration: 950 },
  { d: "M 0,14 C -26,-24 -23,-90 0,-130 C 23,-90 26,-24 0,14 Z", delay: 1500, duration: 1050 },
];

interface FlowerLogoProps {
  isDark: boolean;
}

function AnimatedPetal({ d, delay, duration }: { d: string; delay: number; duration: number }) {
  const offset = useSharedValue(DASH);

  useEffect(() => {
    offset.value = withDelay(delay, withTiming(0, { duration }));
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offset.value,
  }));

  return (
    <AnimatedPath
      d={d}
      strokeDasharray={DASH}
      animatedProps={animatedProps}
    />
  );
}

export function FlowerLogo({ isDark }: FlowerLogoProps) {
  const colors = isDark ? COLORS.dark : COLORS.light;

  const wordmarkOpacity = useSharedValue(0);
  const wordmarkY = useSharedValue(8);
  const taglineOpacity = useSharedValue(0);
  const taglineY = useSharedValue(8);

  useEffect(() => {
    wordmarkOpacity.value = withDelay(2600, withTiming(1, { duration: 700 }));
    wordmarkY.value = withDelay(2600, withTiming(0, { duration: 700 }));
    taglineOpacity.value = withDelay(3000, withTiming(1, { duration: 700 }));
    taglineY.value = withDelay(3000, withTiming(0, { duration: 700 }));
  }, []);

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ translateY: wordmarkY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));

  return (
    <>
      <Svg width={280} height={220} viewBox="0 0 280 220">
        <G
          transform="translate(140,140)"
          fill="white"
          stroke="#7C3AED"
          strokeWidth={11}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {PATHS.map((p, i) => (
            <AnimatedPetal key={i} d={p.d} delay={p.delay} duration={p.duration} />
          ))}
        </G>
      </Svg>

      <Animated.Text style={[styles.wordmark, { color: colors.wordmark }, wordmarkStyle]}>
        Flowi
      </Animated.Text>

      <Animated.Text style={[styles.tagline, { color: colors.tagline }, taglineStyle]}>
        Trouve ton flow.
      </Animated.Text>
    </>
  );
}

const styles = StyleSheet.create({
  wordmark: {
    fontFamily: "System",
    fontSize: 52,
    fontWeight: "800",
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 13,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
});
