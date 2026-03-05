import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStorage } from '../hooks/useStorage';
import { colors, radius, shadow, typography } from '../theme';
import { today } from '../utils/lunar';

const QUOTES = [
  { text: 'Chaque matin, nous renaissons. Ce que nous faisons aujourd\'hui compte le plus.', author: 'Bouddha', emoji: '🌅' },
  { text: 'Vous n\'avez pas à être extraordinaire. Vous avez juste à être vous.', author: 'Brené Brown', emoji: '💫' },
  { text: 'Commencez là où vous êtes. Utilisez ce que vous avez. Faites ce que vous pouvez.', author: 'Arthur Ashe', emoji: '🌱' },
  { text: 'La douceur envers soi-même est la fondation de la douceur envers les autres.', author: 'Pema Chödrön', emoji: '💙' },
  { text: 'Votre cerveau n\'est pas cassé — il fonctionne différemment, et c\'est une force.', author: 'Temple Grandin', emoji: '🧠' },
  { text: 'Chaque petit pas dans la bonne direction vaut mieux qu\'un grand pas dans la mauvaise.', author: 'Anonyme', emoji: '👣' },
  { text: 'On ne voit bien qu\'avec le cœur. L\'essentiel est invisible pour les yeux.', author: 'Antoine de Saint-Exupéry', emoji: '🌹' },
  { text: 'Le repos n\'est pas de la paresse. C\'est de la sagesse.', author: 'Arianna Huffington', emoji: '🛌' },
  { text: 'Vous méritez la même compassion que vous offrez aux autres.', author: 'Kristin Neff', emoji: '🤗' },
  { text: 'La beauté d\'une vie bien vécue réside dans les petites choses accumulées.', author: 'Anonyme', emoji: '✨' },
  { text: 'Neurodivergent·e signifie penser différemment — et le monde a besoin de toutes les façons de penser.', author: 'ADDitude Magazine', emoji: '🌈' },
  { text: 'Faire de son mieux ne signifie pas être parfait. Ça signifie être humain.', author: 'Anonyme', emoji: '🌿' },
  { text: 'Le chaos intérieur peut coexister avec la paix intérieure. Les deux sont vrais.', author: 'Thich Nhat Hanh', emoji: '🌊' },
  { text: 'Célébrez chaque progrès, même minuscule. Le mouvement, c\'est la vie.', author: 'Anonyme', emoji: '🎉' },
  { text: 'Vous n\'avez pas à tout figurer aujourd\'hui. Juste la prochaine étape.', author: 'Anonyme', emoji: '🗺️' },
];

function getQuoteOfDay() {
  const d = new Date();
  const idx = (d.getDate() + d.getMonth() * 31) % QUOTES.length;
  return QUOTES[idx];
}

export default function InspirationScreen() {
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useStorage('quote_favorites', []);
  const [currentIdx, setCurrentIdx] = useState(null);
  const todayKey = today();
  const dailyQuote = getQuoteOfDay();
  const current = currentIdx !== null ? QUOTES[currentIdx] : dailyQuote;
  const isFav = favorites.some(f => f.text === current.text);

  const toggleFav = () => {
    if (isFav) setFavorites(prev => prev.filter(f => f.text !== current.text));
    else setFavorites(prev => [current, ...prev]);
  };

  const nextQuote = () => {
    const idx = currentIdx !== null ? currentIdx : QUOTES.indexOf(dailyQuote);
    setCurrentIdx((idx + 1) % QUOTES.length);
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={{ paddingBottom: 80 }}>
      <Text style={styles.title}>🌅 Inspiration du jour</Text>

      {/* Daily quote card */}
      <View style={styles.quoteCard}>
        <Text style={styles.quoteEmoji}>{current.emoji}</Text>
        <Text style={styles.quoteText}>"{current.text}"</Text>
        <Text style={styles.quoteAuthor}>— {current.author}</Text>
        <View style={styles.quoteActions}>
          <TouchableOpacity style={styles.favBtn} onPress={toggleFav}>
            <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? colors.accent : colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextBtn} onPress={nextQuote}>
            <Ionicons name="shuffle" size={18} color={colors.white} />
            <Text style={styles.nextBtnText}>Autre citation</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Citation du jour badge */}
      {currentIdx === null && (
        <View style={styles.todayBadge}>
          <Ionicons name="sunny" size={16} color={colors.warning} />
          <Text style={styles.todayBadgeText}>Citation du jour — renouvelée chaque matin</Text>
        </View>
      )}

      {/* Favorites */}
      {favorites.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❤️ Mes citations favorites</Text>
          {favorites.map((q, i) => (
            <View key={i} style={styles.favCard}>
              <Text style={styles.favEmoji}>{q.emoji}</Text>
              <View style={styles.favContent}>
                <Text style={styles.favText} numberOfLines={3}>"{q.text}"</Text>
                <Text style={styles.favAuthor}>— {q.author}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* All quotes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📚 Toutes les citations</Text>
        {QUOTES.map((q, i) => (
          <TouchableOpacity key={i} style={styles.listItem} onPress={() => setCurrentIdx(i)}>
            <Text style={styles.listEmoji}>{q.emoji}</Text>
            <Text style={styles.listText} numberOfLines={2}>{q.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { ...typography.h2, padding: 20, paddingBottom: 8 },
  quoteCard: { backgroundColor: colors.primary, margin: 16, marginTop: 8, borderRadius: radius.lg, padding: 28, alignItems: 'center', ...shadow.md },
  quoteEmoji: { fontSize: 48, marginBottom: 16 },
  quoteText: { fontSize: 18, color: colors.white, textAlign: 'center', lineHeight: 28, fontStyle: 'italic', marginBottom: 12 },
  quoteAuthor: { fontSize: 13, color: colors.primaryLight, fontWeight: '600', marginBottom: 20 },
  quoteActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  favBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 10 },
  nextBtnText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  todayBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 16, marginTop: -8, marginBottom: 16, backgroundColor: colors.warning + '22', borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start' },
  todayBadgeText: { fontSize: 12, color: colors.warning, fontWeight: '600' },
  section: { backgroundColor: colors.surface, margin: 16, marginTop: 0, borderRadius: radius.md, padding: 16, ...shadow.sm },
  sectionTitle: { ...typography.h3, marginBottom: 14 },
  favCard: { flexDirection: 'row', gap: 12, marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  favEmoji: { fontSize: 24 },
  favContent: { flex: 1 },
  favText: { fontSize: 13, color: colors.text, lineHeight: 20, fontStyle: 'italic' },
  favAuthor: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  listItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  listEmoji: { fontSize: 18, width: 28 },
  listText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 20 },
});
