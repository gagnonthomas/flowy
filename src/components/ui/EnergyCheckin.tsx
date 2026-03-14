import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFlowiStore } from '@/store';
import { colors } from '@/constants/colors';
import { getToday, getEnergySlot } from '@/utils/date';

const LEVELS = [
  { value: 1, emoji: '😫', label: 'Épuisé' },
  { value: 2, emoji: '😕', label: 'Fatigué' },
  { value: 3, emoji: '😐', label: 'Neutre' },
  { value: 4, emoji: '🙂', label: 'Bien' },
  { value: 5, emoji: '😄', label: 'En forme' },
];

const SLOT_LABELS = {
  matin: 'ce matin',
  apresmidi: 'cet après-midi',
  soir: 'ce soir',
};

interface EnergyCheckinProps {
  visible: boolean;
  onClose: () => void;
}

export function EnergyCheckin({ visible, onClose }: EnergyCheckinProps) {
  const { setEnergy, earnXp } = useFlowiStore();
  const today = getToday();
  const slot = getEnergySlot();
  const key = `${today}-${slot}`;

  const select = (value: number) => {
    setEnergy(key, value);
    setEnergy(today, value);
    earnXp(2, 'Check-in énergie');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View entering={SlideInDown.springify().damping(18)} style={styles.sheet}>
          <Text style={styles.title}>Comment tu te sens {SLOT_LABELS[slot]} ?</Text>
          <View style={styles.options}>
            {LEVELS.map((l) => (
              <TouchableOpacity key={l.value} style={styles.option} onPress={() => select(l.value)}>
                <Text style={styles.emoji}>{l.emoji}</Text>
                <Text style={styles.label}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.skip} onPress={onClose}>
            <Text style={styles.skipText}>Plus tard</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  option: {
    alignItems: 'center',
    gap: 6,
  },
  emoji: { fontSize: 36 },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.muted,
  },
  skip: { alignItems: 'center', paddingVertical: 8 },
  skipText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.muted,
  },
});
