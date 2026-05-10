import { useState } from 'react';
import { TextInput, type TextInputProps, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface Props extends TextInputProps {
  accentColor?: string;
}

/**
 * TextInput with animated focus state.
 * Border color transitions to accentColor on focus, scales slightly.
 */
export function AnimatedInput({ accentColor = '#6366F1', style, ...props }: Props) {
  const { dark, t } = useTheme();
  const [focused, setFocused] = useState(false);
  const scale = useSharedValue(1);
  const borderProgress = useSharedValue(0);

  const handleFocus = () => {
    setFocused(true);
    scale.value = withTiming(1.01, { duration: 150 });
    borderProgress.value = withTiming(1, { duration: 200 });
  };

  const handleBlur = () => {
    setFocused(false);
    scale.value = withTiming(1, { duration: 150 });
    borderProgress.value = withTiming(0, { duration: 200 });
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTextInput
      {...props}
      onFocus={(e) => { handleFocus(); props.onFocus?.(e); }}
      onBlur={(e) => { handleBlur(); props.onBlur?.(e); }}
      style={[
        s.base,
        {
          backgroundColor: dark ? t.inputBg : '#FFFFFF',
          borderColor: focused ? accentColor : dark ? t.border : '#E8EDF5',
          color: dark ? t.text : '#1F2937',
        },
        style,
        animStyle,
      ]}
      placeholderTextColor={props.placeholderTextColor || (dark ? '#6B7280' : '#9CA3AF')}
    />
  );
}

const s = StyleSheet.create({
  base: {
    borderWidth: 1.5,
    borderRadius: 9,
    paddingVertical: 7,
    paddingHorizontal: 10,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
});
