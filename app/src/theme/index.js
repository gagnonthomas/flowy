export const colors = {
  primary: '#7c6fcd',
  primaryLight: '#a78bfa',
  primaryDark: '#5b4faa',
  accent: '#ec4899',
  accentLight: '#f9a8d4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#e8775a',
  info: '#0ea5e9',
  teal: '#14b8a6',

  background: '#f8f5ff',
  surface: '#ffffff',
  surfaceAlt: '#fdf6ff',
  border: '#e8e4f5',
  borderLight: '#f0ecfa',

  text: '#2d2d2d',
  textMuted: '#6b7280',
  textLight: '#9ca3af',
  white: '#ffffff',

  gradients: {
    hero: ['#f5f0ff', '#ffe8f0', '#fff5e0'],
    purple: ['#7c6fcd', '#a78bfa'],
    rose: ['#e8775a', '#ec4899'],
    teal: ['#14b8a6', '#0ea5e9'],
    warm: ['#f59e0b', '#f97316'],
  },
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const radius = {
  sm: 8, md: 16, lg: 24, xl: 32, full: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700', color: colors.text },
  h2: { fontSize: 22, fontWeight: '700', color: colors.text },
  h3: { fontSize: 18, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, color: colors.text },
  caption: { fontSize: 13, color: colors.textMuted },
  small: { fontSize: 11, color: colors.textLight, fontWeight: '600', letterSpacing: 0.5 },
};

export const shadow = {
  sm: {
    shadowColor: '#7c6fcd', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  md: {
    shadowColor: '#7c6fcd', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 4,
  },
};
