import { StyleSheet, View, useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { FlowerLogo } from "@/components/FlowerLogo";
import { COLORS } from "@/constants/theme";

export default function HomeScreen() {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <FlowerLogo isDark={isDark} />
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
});
