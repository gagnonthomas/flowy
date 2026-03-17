import { Component, type ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <LinearGradient colors={['#0F172A', '#1E1B4B']} style={s.container}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🌿</Text>
          <Text style={s.title}>Oups, quelque chose a planté.</Text>
          <Text style={s.message}>
            {this.state.error?.message || "Une erreur inattendue s'est produite."}
          </Text>
          <Text style={s.hint}>Tes données sont en sécurité.</Text>
          <Pressable
            onPress={() => this.setState({ hasError: false, error: null })}
            style={s.btn}
          >
            <Text style={s.btnText}>Réessayer</Text>
          </Pressable>
        </LinearGradient>
      );
    }

    return this.props.children;
  }
}

const s = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  title: {
    fontFamily: 'Inter_700Bold', fontSize: 20, color: '#FFFFFF',
    textAlign: 'center', marginBottom: 12,
  },
  message: {
    fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)',
    textAlign: 'center', lineHeight: 20, marginBottom: 8, maxWidth: 300,
  },
  hint: {
    fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.3)',
    marginBottom: 24,
  },
  btn: {
    paddingVertical: 14, paddingHorizontal: 40, borderRadius: 14,
    backgroundColor: '#6366F1',
  },
  btnText: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#FFFFFF' },
});
