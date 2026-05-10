import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ScanModal } from './ScanModal';

/**
 * Primary FAB — opens the smart scan modal (auto-detects tasks vs RDV).
 * This is the hero action of Flowi: paper → photo → centralized digital.
 */
export function FloatingScan() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const fabSize = isTablet ? 64 : 56;
  const [scanOpen, setScanOpen] = useState(false);

  return (
    <>
      <View style={s.container} pointerEvents="box-none">
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setScanOpen(true);
          }}
        >
          <LinearGradient
            colors={['#3B82F6', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[s.fab, { width: fabSize, height: fabSize, borderRadius: fabSize / 2 }]}
          >
            <Text style={[s.fabIcon, { fontSize: isTablet ? 28 : 24 }]}>📷</Text>
          </LinearGradient>
        </Pressable>
        <Text style={[s.label, isTablet && { fontSize: 11 }]}>Scanner</Text>
      </View>

      <ScanModal
        visible={scanOpen}
        target="auto"
        onClose={() => setScanOpen(false)}
      />
    </>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    zIndex: 100,
    alignItems: 'center',
  },
  fab: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  fabIcon: { color: '#FFFFFF' },
  label: {
    marginTop: 4,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: '#6B7280',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
