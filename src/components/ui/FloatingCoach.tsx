import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useWindowDimensions } from 'react-native';
import { useFlowiStore } from '@/store';
import { sendCoachMessage } from '@/utils/api';

export function FloatingCoach() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const fabSize = isTablet ? 60 : 50;
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const coachMessages = useFlowiStore((s) => s.coachMessages);
  const addCoachMessage = useFlowiStore((s) => s.addCoachMessage);
  const scrollRef = useRef<FlatList>(null);

  useEffect(() => {
    if (open) scrollRef.current?.scrollToEnd({ animated: true });
  }, [coachMessages, open]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    addCoachMessage({ role: 'user', text });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    const history = [...coachMessages, { role: 'user' as const, text }].map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.text,
    }));
    const reply = await sendCoachMessage(history);
    addCoachMessage({ role: 'assistant', text: reply });
    setLoading(false);
  };

  return (
    <View style={s.container} pointerEvents="box-none">
      {/* Chat popup */}
      {open && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={[s.popup, isTablet && { width: 380, maxHeight: 500 }]}>
          {/* Header */}
          <LinearGradient colors={['#1E40AF', '#6D28D9']} style={s.popupHeader}>
            <View style={s.popupHeaderLeft}>
              <Text style={{ fontSize: 18 }}>🧠</Text>
              <Text style={s.popupTitle}>Coach</Text>
            </View>
            <Pressable onPress={() => setOpen(false)} style={s.popupClose}>
              <Text style={s.popupCloseText}>×</Text>
            </Pressable>
          </LinearGradient>

          {/* Messages */}
          <FlatList
            ref={scrollRef}
            data={coachMessages}
            keyExtractor={(_, i) => String(i)}
            style={s.messages}
            contentContainerStyle={{ padding: 12, gap: 8 }}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item: msg }) => {
              const isUser = msg.role === 'user';
              return (
                <View style={{ alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                  <LinearGradient
                    colors={isUser ? ['#3B82F6', '#6D28D9'] : ['#F3F4F6', '#F3F4F6']}
                    style={[s.bubble, isUser ? s.userBubble : s.assistantBubble]}
                  >
                    <Text style={[s.bubbleText, { color: isUser ? '#FFFFFF' : '#374151' }]}>{msg.text}</Text>
                  </LinearGradient>
                </View>
              );
            }}
            ListFooterComponent={loading ? (
              <View style={{ alignItems: 'flex-start' }}>
                <View style={[s.bubble, s.assistantBubble, { backgroundColor: '#F3F4F6' }]}>
                  <View style={s.dots}>
                    {[0, 1, 2].map((i) => <View key={i} style={s.dot} />)}
                  </View>
                </View>
              </View>
            ) : null}
          />

          {/* Input */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={s.inputBar}>
              <TextInput
                style={s.input}
                value={input}
                onChangeText={setInput}
                placeholder="Écris un message..."
                placeholderTextColor="#9CA3AF"
                returnKeyType="send"
                onSubmitEditing={send}
              />
              <Pressable onPress={send} disabled={loading || !input.trim()}>
                <LinearGradient
                  colors={input.trim() ? ['#3B82F6', '#6D28D9'] : ['#E8EDF5', '#E8EDF5']}
                  style={s.sendBtn}
                >
                  <Text style={s.sendText}>↑</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}

      {/* FAB button */}
      <Pressable
        onPress={() => { setOpen((o) => !o); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
      >
        <LinearGradient
          colors={open ? ['#EF4444', '#DC2626'] : ['#1E40AF', '#6D28D9']}
          style={[s.fab, { width: fabSize, height: fabSize, borderRadius: fabSize / 2 }]}
        >
          <Text style={[s.fabText, { fontSize: isTablet ? 26 : 22 }]}>{open ? '×' : '🧠'}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    zIndex: 100,
    alignItems: 'flex-end',
  },
  // FAB
  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: { fontSize: 22, color: '#FFFFFF' },

  // Popup
  popup: {
    width: 300,
    maxHeight: 420,
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1.5,
    borderColor: '#E8EDF5',
    overflow: 'hidden',
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  popupHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  popupTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFFFFF' },
  popupClose: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  popupCloseText: { color: '#FFFFFF', fontSize: 14 },

  // Messages
  messages: { maxHeight: 260 },
  bubble: { maxWidth: '85%', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14 },
  userBubble: { borderBottomRightRadius: 4 },
  assistantBubble: { borderBottomLeftRadius: 4, backgroundColor: '#F3F4F6' },
  bubbleText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  dots: { flexDirection: 'row', gap: 4, paddingVertical: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#9CA3AF' },

  // Input
  inputBar: {
    flexDirection: 'row', gap: 6, paddingVertical: 8, paddingHorizontal: 10,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: '#E8EDF5', borderRadius: 10,
    paddingVertical: 7, paddingHorizontal: 10, fontSize: 12,
    fontFamily: 'Inter_400Regular', backgroundColor: '#F9FAFB', color: '#1F2937',
  },
  sendBtn: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sendText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
