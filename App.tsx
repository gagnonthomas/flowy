import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, useColorScheme, View } from "react-native";
import { G, Path, Svg } from "react-native-svg";
import { StatusBar } from "expo-status-bar";

const AnimatedPath = Animated.createAnimatedComponent(Path);

const DASH = 800;

const PATHS = [
  { d: "M -10,20 C -35,45 -100,42 -128,16 C -112,-14 -58,-2 -10,20 Z", delay: 0,    duration: 900 },
  { d: "M 10,20 C 35,45 100,42 128,16 C 112,-14 58,-2 10,20 Z",         delay: 350,  duration: 900 },
  { d: "M -5,14 C -40,2 -76,-48 -56,-104 C -32,-82 -12,-32 -5,14 Z",    delay: 750,  duration: 950 },
  { d: "M 5,14 C 40,2 76,-48 56,-104 C 32,-82 12,-32 5,14 Z",           delay: 1100, duration: 950 },
  { d: "M 0,14 C -26,-24 -23,-90 0,-130 C 23,-90 26,-24 0,14 Z",        delay: 1500, duration: 1050 },
];

export default function App() {
  const isDark = useColorScheme() === "dark";

  const offsets = useRef(PATHS.map(() => new Animated.Value(DASH))).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkY = useRef(new Animated.Value(8)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    const pathAnims = PATHS.map((p, i) =>
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.timing(offsets[i], {
          toValue: 0,
          duration: p.duration,
          useNativeDriver: false,
        }),
      ])
    );

    const wordmarkAnim = Animated.sequence([
      Animated.delay(2600),
      Animated.parallel([
        Animated.timing(wordmarkOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(wordmarkY, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    ]);

    const taglineAnim = Animated.sequence([
      Animated.delay(3000),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(taglineY, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    ]);

    Animated.parallel([...pathAnims, wordmarkAnim, taglineAnim]).start();
  }, []);

  const bg = isDark ? "#0f0f1a" : "#f5f5f5";
  const wordmarkColor = isDark ? "#a78bfa" : "#4338CA";
  const taglineColor = isDark ? "#6366F1" : "#818CF8";

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

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
            <AnimatedPath
              key={i}
              d={p.d}
              strokeDasharray={DASH}
              strokeDashoffset={offsets[i]}
            />
          ))}
        </G>
      </Svg>

      <Animated.Text
        style={[
          styles.wordmark,
          { color: wordmarkColor, opacity: wordmarkOpacity, transform: [{ translateY: wordmarkY }] },
        ]}
      >
        Flowi
      </Animated.Text>

      <Animated.Text
        style={[
          styles.tagline,
          { color: taglineColor, opacity: taglineOpacity, transform: [{ translateY: taglineY }] },
        ]}
      >
        Trouve ton flow.
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
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
