import { Platform } from 'react-native';

export const fonts = {
  regular: Platform.select({ ios: 'Inter_400Regular', android: 'Inter_400Regular', default: 'Inter_400Regular' }),
  semiBold: Platform.select({ ios: 'Inter_600SemiBold', android: 'Inter_600SemiBold', default: 'Inter_600SemiBold' }),
  bold: Platform.select({ ios: 'Inter_700Bold', android: 'Inter_700Bold', default: 'Inter_700Bold' }),
  black: Platform.select({ ios: 'Inter_900Black', android: 'Inter_900Black', default: 'Inter_900Black' }),
  serif: Platform.select({ ios: 'PlayfairDisplay_700Bold', android: 'PlayfairDisplay_700Bold', default: 'PlayfairDisplay_700Bold' }),
  serifItalic: Platform.select({ ios: 'PlayfairDisplay_900Black_Italic', android: 'PlayfairDisplay_900Black_Italic', default: 'PlayfairDisplay_900Black_Italic' }),
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 38,
} as const;
