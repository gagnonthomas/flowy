import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFlowiStore, getLevel, getXpForNextLevel } from '@/store';
import { colors } from '@/constants/colors';

type SubTab = 'coach' | 'xp';

export default function FlowiScreen() {
  const [subTab, setSubTab] = useState<SubTab>('coach');
  const {
    coachMessages, addCoachMessage,
    xp, xpLog, badges,
  } = useFlowiStore();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const level = getLevel(xp);
  const { current, needed } = getXpForNextLevel(xp);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [coachMessages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    addCoachMessage({ role: 'user', text });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setLoading(true);
    // TODO: Connect to Anthropic API via Cloudflare Worker
    setTimeout(() => {
      addCoachMessage({
        role: 'assistant',
        text: 'Je suis en cours de configuration ! Bientôt je pourrai te répondre avec des conseils personnalisés. 🌿',
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Flowi</Text>
        <View style={styles.tabs}>
          {(['coach', 'xp'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, subTab === t && styles.tabActive]}
              onPress={() => setSubTab(t)}
            >
              <Text style={[styles.tabText, subTab === t && styles.tabTextActive]}>
                {t === 'coach' ? 'Coach' : 'XP'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {subTab === 'coach' ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={90}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.chatScroll}
            keyboardShouldPersistTaps="handled"
          >
            {coachMessages.map((msg, i) => (
              <Animated.View
                key={i}
                entering={FadeIn.duration(200)}
                style={[
                  styles.bubble,
                  msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text style={[
                  styles.bubbleText,
                  msg.role === 'user' ? styles.userText : styles.assistantText,
                ]}>
                  {msg.text}
                </Text>
              </Animated.View>
            ))}
            {loading && (
              <View style={[styles.bubble, styles.assistantBubble]}>
                <Text style={styles.assistantText}>...</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputBar}>
            <TextInput
              style={styles.chatInput}
              value={input}
              onChangeText={setInput}
              placeholder="Écris à Flowi..."
              placeholderTextColor={colors.muted}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={!input.trim() || loading}
            >
              <Text style={styles.sendBtnText}>↑</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView contentContainerStyle={styles.xpScroll}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.xpCard}>
            <Text style={styles.xpLevelText}>Niveau {level}</Text>
            <Text style={styles.xpTotal}>{xp} XP</Text>
            <View style={styles.xpBarBg}>
              <View style={[styles.xpBarFill, { width: `${Math.min(100, (current / needed) * 100)}%` }]} />
            </View>
            <Text style={styles.xpProgress}>{current} / {needed} pour le prochain niveau</Text>
          </Animated.View>

          {badges.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Badges</Text>
              <View style={styles.badgesGrid}>
                {badges.map((b) => (
                  <View key={b.id} style={styles.badgeCard}>
                    <Text style={styles.badgeIcon}>{b.icon}</Text>
                    <Text style={styles.badgeLabel}>{b.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historique XP</Text>
            {xpLog.slice(-20).reverse().map((entry, i) => (
              <View key={i} style={styles.xpRow}>
                <Text style={styles.xpReason}>{entry.reason}</Text>
                <Text style={styles.xpAmount}>+{entry.amount}</Text>
              </View>
            ))}
            {xpLog.length === 0 && (
              <Text style={styles.empty}>Commence à gagner de l'XP en complétant des tâches !</Text>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.text, marginBottom: 12 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.flowi.light, borderColor: colors.flowi.accent },
  tabText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.muted },
  tabTextActive: { fontFamily: 'Inter_600SemiBold', color: colors.flowi.accent },
  // Chat
  chatScroll: { padding: 16, paddingBottom: 8 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 8 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.flowi.accent, borderBottomRightRadius: 4 },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  userText: { color: '#fff', fontFamily: 'Inter_400Regular' },
  assistantText: { color: colors.text, fontFamily: 'Inter_400Regular' },
  inputBar: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  chatInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.text, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.flowi.accent, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  // XP
  xpScroll: { padding: 20, paddingBottom: 40 },
  xpCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 24, borderWidth: 1, borderColor: colors.border, alignItems: 'center', marginBottom: 16 },
  xpLevelText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.flowi.accent },
  xpTotal: { fontSize: 42, fontFamily: 'Inter_900Black', color: colors.text, marginVertical: 8 },
  xpBarBg: { width: '100%', height: 8, backgroundColor: colors.border, borderRadius: 4 },
  xpBarFill: { height: 8, backgroundColor: colors.flowi.accent, borderRadius: 4 },
  xpProgress: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.muted, marginTop: 8 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.text, marginBottom: 10 },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badgeCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border, width: 80 },
  badgeIcon: { fontSize: 28 },
  badgeLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text, marginTop: 4, textAlign: 'center' },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  xpReason: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text },
  xpAmount: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.moi.accent },
  empty: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.muted, fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
});
