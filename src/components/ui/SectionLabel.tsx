import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

interface SectionLabelProps {
  title: string;
  count?: number;
  accentColor?: string;
}

export function SectionLabel({ title, count, accentColor }: SectionLabelProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, accentColor ? { color: accentColor } : undefined]}>
        {title}
      </Text>
      {count !== undefined && (
        <View style={[styles.badge, accentColor ? { backgroundColor: accentColor } : undefined]}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: 4,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.muted,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
});
