import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, shadow } from '../theme';

export default function Card({ children, style, onPress, accent }) {
  const Inner = (
    <View style={[styles.card, accent && { borderLeftColor: accent, borderLeftWidth: 4 }, style]}>
      {children}
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.85}>{Inner}</TouchableOpacity>;
  return Inner;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    ...shadow.sm,
  },
});
