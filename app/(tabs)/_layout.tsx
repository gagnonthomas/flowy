import { useState } from 'react';
import { Slot, usePathname, useRouter } from 'expo-router';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { G, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { useFlowiStore } from '@/store';
import { useTheme } from '@/hooks/useTheme';
import { FloatingCoach } from '@/components/ui/FloatingCoach';
import { ScanModal } from '@/components/ui/ScanModal';
import { trackScreen } from '@/utils/analytics';
import * as Haptics from 'expo-haptics';

// 'scan' is a special tab — pressing it opens the scan modal instead of
// navigating to a route. There is no app/(tabs)/scan.tsx file.
const TAB_CONFIG = [
  { name: 'aujourdhui', icon: '📅', label: "Aujourd'hui" },
  { name: 'taches', icon: '✅', label: 'Tâches' },
  { name: 'planning', icon: '📆', label: 'Planning' },
  { name: 'moi', icon: '💚', label: 'Moi' },
  { name: 'scan', icon: '📷', label: 'Scan' },
] as const;

// Focus, Accueil, and Flowi are no longer in the tab bar — their routes still
// exist (Focus and Flowi launched contextually; Accueil redirects to Aujourd'hui).
const SECTION_COLORS: Record<string, { accent: string; light: string }> = {
  aujourdhui: { accent: colors.agenda.accent, light: colors.agenda.light },
  taches: { accent: colors.todos.accent, light: colors.todos.light },
  scan: { accent: colors.paper.accent, light: colors.paper.accentSoft },
  planning: { accent: colors.planning.accent, light: colors.planning.light },
  moi: { accent: colors.moi.accent, light: colors.moi.light },
};

function SidebarLotus({ size, dark }: { size: number; dark: boolean }) {
  return (
    <Svg width={size} height={size * 0.78} viewBox="0 0 280 220">
      <G
        transform="translate(140,140)"
        fill={dark ? '#1a1a2e' : 'white'}
        stroke="#7C3AED"
        strokeWidth={11}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d="M -10,20 C -35,45 -100,42 -128,16 C -112,-14 -58,-2 -10,20 Z" />
        <Path d="M 10,20 C 35,45 100,42 128,16 C 112,-14 58,-2 10,20 Z" />
        <Path d="M -5,14 C -40,2 -76,-48 -56,-104 C -32,-82 -12,-32 -5,14 Z" />
        <Path d="M 5,14 C 40,2 76,-48 56,-104 C 32,-82 12,-32 5,14 Z" />
        <Path d="M 0,14 C -26,-24 -23,-90 0,-130 C 23,-90 26,-24 0,14 Z" />
      </G>
    </Svg>
  );
}

export default function TabLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const darkMode = useFlowiStore((s) => s.darkMode);
  const toggleDarkMode = useFlowiStore((s) => s.toggleDarkMode);
  const { dark, t } = useTheme();

  const activeTab = pathname.split('/').pop() || 'aujourdhui';
  const [scanOpen, setScanOpen] = useState(false);

  const isPhone = width < 768;
  const isTablet = width >= 768 && width < 1200;
  const navW = isPhone ? 64 : isTablet ? 88 : 100;

  const handlePress = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (name === 'scan') {
      // 'scan' is an action tab, not a route — open the modal in place.
      setScanOpen(true);
      return;
    }
    trackScreen(name);
    router.replace(`/(tabs)/${name}` as any);
  };

  return (
    <View style={[s.container, { backgroundColor: t.screenBg }]}>
      {/* Left sidebar */}
      <View
        style={[
          s.sidebar,
          {
            width: navW,
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 12,
            backgroundColor: dark ? '#0c0c1e' : '#FAFBFF',
            borderRightColor: t.sidebarBorder,
          },
        ]}
      >
        {/* Logo */}
        <Pressable onPress={() => handlePress('aujourdhui')} style={[s.logoSection, { borderBottomColor: dark ? '#1e1e36' : '#F0F0F8' }]}>
          <SidebarLotus size={isPhone ? 36 : 48} dark={dark} />
          <Text style={[s.logoText, { color: t.wordmark, fontSize: isPhone ? 12 : 15 }]}>Flowi</Text>
        </Pressable>

        {/* Nav items */}
        <View style={[s.navList, { gap: isPhone ? 2 : 4 }]}>
          {TAB_CONFIG.map((tab) => {
            const isActive = activeTab === tab.name;
            const palette = SECTION_COLORS[tab.name];
            const activeBg = dark ? palette.accent + '20' : palette.light;
            const iconSize = isPhone ? (isActive ? 20 : 17) : (isActive ? 26 : 22);
            const iconWrapSize = isPhone ? 32 : 40;

            return (
              <Pressable
                key={tab.name}
                onPress={() => handlePress(tab.name)}
                style={[
                  s.tabItem,
                  { paddingVertical: isPhone ? 8 : 10 },
                  isActive && { backgroundColor: activeBg },
                ]}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <View style={[s.activeBar, { backgroundColor: palette.accent, height: isPhone ? 22 : 28, transform: [{ translateY: isPhone ? -11 : -14 }] }]} />
                )}

                {/* Icon */}
                <View style={[s.iconWrap, { width: iconWrapSize, height: iconWrapSize, borderRadius: isPhone ? 10 : 12 }, isActive && { backgroundColor: palette.accent + '18' }]}>
                  <Text style={{ fontSize: iconSize }}>{tab.icon}</Text>
                </View>

                {/* Label */}
                <Text
                  style={[
                    s.tabLabel,
                    {
                      fontSize: isPhone ? 9 : 11,
                      color: isActive ? palette.accent : dark ? '#6B7280' : '#9CA3AF',
                      fontWeight: isActive ? '700' : '400',
                      fontFamily: isActive ? 'Inter_700Bold' : 'Inter_400Regular',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Utility buttons */}
        <View style={s.utilSection}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={[s.utilBtn, { paddingVertical: isPhone ? 6 : 8 }, dark && { backgroundColor: '#1a1a2e' }]}
          >
            <Text style={{ fontSize: isPhone ? 16 : 20 }}>🌿</Text>
            <Text style={[s.utilLabel, { fontSize: isPhone ? 8 : 10, color: dark ? '#6B7280' : '#9CA3AF' }]}>Urgence</Text>
          </Pressable>

          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleDarkMode(); }}
            style={[s.utilBtn, { paddingVertical: isPhone ? 6 : 8 }, dark && { backgroundColor: '#1a1a2e' }]}
          >
            <Text style={{ fontSize: isPhone ? 16 : 20 }}>{darkMode ? '☀️' : '🌙'}</Text>
            <Text style={[s.utilLabel, { fontSize: isPhone ? 8 : 10, color: dark ? '#6B7280' : '#9CA3AF' }]}>
              {darkMode ? 'Clair' : 'Sombre'}
            </Text>
          </Pressable>

          {__DEV__ && (
            <Pressable
              onPress={async () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                await AsyncStorage.removeItem('flowi-storage');
                useFlowiStore.setState({ onboarded: false, userName: '', userDefis: [], userObjectif: '' });
                router.replace('/onboarding');
              }}
              style={[s.utilBtn, { paddingVertical: isPhone ? 6 : 8, backgroundColor: '#FEE2E2' }]}
            >
              <Text style={{ fontSize: isPhone ? 16 : 20 }}>♻️</Text>
              <Text style={[s.utilLabel, { fontSize: isPhone ? 8 : 10, color: '#DC2626' }]}>Reset</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Content area */}
      <View style={[s.content, { backgroundColor: t.screenBg }]}>
        <Slot />
        {/* Coach Flowi accessible everywhere as a floating button. */}
        <FloatingCoach />
        {/* Scan modal driven by the 'Scan' tab press. */}
        <ScanModal
          visible={scanOpen}
          target="auto"
          onClose={() => setScanOpen(false)}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    flexShrink: 0,
    flexDirection: 'column',
    alignItems: 'stretch',
    borderRightWidth: 1,
    zIndex: 30,
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 6,
    borderBottomWidth: 1,
  },
  logoText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },

  // Nav
  navList: {
    gap: 2,
    paddingHorizontal: 4,
  },
  tabItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 12,
    position: 'relative',
  },
  activeBar: {
    position: 'absolute',
    left: -4,
    top: '50%',
    width: 3.5,
    height: 22,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    transform: [{ translateY: -11 }],
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 9,
    letterSpacing: 0.1,
    lineHeight: 12,
    textAlign: 'center',
  },

  // Utility buttons
  utilSection: {
    gap: 2,
    paddingHorizontal: 4,
  },
  utilBtn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  utilLabel: {
    fontSize: 8,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.1,
    lineHeight: 11,
    textAlign: 'center',
  },

  // Content
  content: {
    flex: 1,
  },
});
