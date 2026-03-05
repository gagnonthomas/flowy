import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStorage } from '../hooks/useStorage';
import { colors, radius, shadow, typography } from '../theme';

const DELAYS = [
  { label: '3 mois', months: 3 },
  { label: '6 mois', months: 6 },
  { label: '1 an', months: 12 },
];

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export default function LetterScreen() {
  const insets = useSafeAreaInsets();
  const [letters, setLetters] = useStorage('letters', []);
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState('');
  const [delayIdx, setDelayIdx] = useState(2);
  const now = new Date();

  const saveLetter = () => {
    if (!text.trim()) return;
    const openDate = addMonths(now, DELAYS[delayIdx].months);
    setLetters(prev => [{
      id: Date.now().toString(),
      text: text.trim(),
      writtenAt: now.toISOString(),
      openDate: openDate.toISOString(),
      delay: DELAYS[delayIdx].label,
      opened: false,
    }, ...prev]);
    setText('');
    setWriting(false);
    Alert.alert('✉️ Lettre envoyée !', `Votre lettre sera révélée le ${openDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.`);
  };

  const tryOpenLetter = (letter) => {
    const openDate = new Date(letter.openDate);
    if (now < openDate) {
      const daysLeft = Math.ceil((openDate - now) / (1000 * 60 * 60 * 24));
      Alert.alert('🔒 Pas encore', `Cette lettre s'ouvrira dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}, le ${openDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.`);
      return;
    }
    if (!letter.opened) {
      setLetters(prev => prev.map(l => l.id === letter.id ? { ...l, opened: true } : l));
    }
    Alert.alert(
      '✉️ Votre lettre du passé',
      letter.text,
      [{ text: 'Refermer avec tendresse', style: 'default' }]
    );
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.header}>
        <Text style={styles.title}>✉️ Lettre à moi-même</Text>
        {!writing && (
          <TouchableOpacity style={styles.writeBtn} onPress={() => setWriting(true)}>
            <Ionicons name="pencil" size={18} color={colors.white} />
            <Text style={styles.writeBtnText}>Écrire</Text>
          </TouchableOpacity>
        )}
      </View>

      {writing ? (
        <View style={styles.writeSection}>
          <Text style={styles.writeTitle}>Cher·e moi du futur,</Text>
          <TextInput style={styles.letterInput}
            placeholder="Parlez de comment vous vous sentez aujourd'hui, vos espoirs, vos peurs, ce que vous apprenez, vos objectifs..."
            placeholderTextColor={colors.textLight} value={text} onChangeText={setText}
            multiline numberOfLines={12} textAlignVertical="top" autoFocus />

          <Text style={styles.delayLabel}>Ouvrir dans :</Text>
          <View style={styles.delayRow}>
            {DELAYS.map((d, i) => (
              <TouchableOpacity key={d.label} style={[styles.delayBtn, delayIdx===i && styles.delayBtnActive]}
                onPress={() => setDelayIdx(i)}>
                <Text style={[styles.delayBtnText, delayIdx===i && styles.delayBtnTextActive]}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.openDateText}>
            📅 S'ouvrira le {addMonths(now, DELAYS[delayIdx].months).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setWriting(false); setText(''); }}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={saveLetter}>
              <Text style={styles.saveBtnText}>Envoyer dans le temps ✉️</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.infoCard}>
            <Text style={styles.infoEmoji}>💌</Text>
            <Text style={styles.infoText}>Écrivez une lettre à votre futur vous. Elle sera scellée et ne s'ouvrira qu'à la date que vous choisissez.</Text>
          </View>

          {letters.length === 0
            ? <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📬</Text>
                <Text style={styles.emptyTitle}>Aucune lettre envoyée</Text>
                <Text style={styles.emptyText}>Commencez par écrire à votre vous de dans 6 mois.</Text>
              </View>
            : letters.map(letter => {
                const openDate = new Date(letter.openDate);
                const isReady = now >= openDate;
                const daysLeft = Math.ceil((openDate - now) / (1000 * 60 * 60 * 24));
                return (
                  <TouchableOpacity key={letter.id} style={[styles.letterCard, letter.opened && styles.letterOpened]}
                    onPress={() => tryOpenLetter(letter)}>
                    <Text style={styles.letterIcon}>{letter.opened ? '📭' : isReady ? '📬' : '🔒'}</Text>
                    <View style={styles.letterContent}>
                      <Text style={styles.letterStatus}>
                        {letter.opened ? 'Lue' : isReady ? '✨ Prête à ouvrir !' : `Scellée · ${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}`}
                      </Text>
                      <Text style={styles.letterMeta}>
                        Écrite le {new Date(letter.writtenAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                      <Text style={styles.letterMeta}>
                        S'ouvre le {openDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                      {!letter.opened && <Text style={styles.letterPreview} numberOfLines={2}>{letter.text}</Text>}
                    </View>
                    <Ionicons name={isReady ? 'open-outline' : 'lock-closed-outline'} size={20} color={isReady ? colors.success : colors.textLight} />
                  </TouchableOpacity>
                );
              })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffbf0' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { ...typography.h2 },
  writeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.warning, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 8 },
  writeBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  writeSection: { margin: 16, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 20, ...shadow.md },
  writeTitle: { fontSize: 18, fontStyle: 'italic', color: colors.textMuted, marginBottom: 12 },
  letterInput: { backgroundColor: '#fffbf0', borderRadius: radius.md, padding: 14, fontSize: 16, color: colors.text, minHeight: 200, borderWidth: 1, borderColor: '#e8d5a0', lineHeight: 26, textAlignVertical: 'top' },
  delayLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  delayRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  delayBtn: { flex: 1, padding: 10, borderRadius: radius.md, backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  delayBtnActive: { backgroundColor: colors.warning, borderColor: colors.warning },
  delayBtnText: { fontWeight: '700', color: colors.textMuted },
  delayBtnTextActive: { color: colors.white },
  openDateText: { ...typography.caption, textAlign: 'center', marginBottom: 20, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelBtnText: { color: colors.textMuted, fontWeight: '600' },
  saveBtn: { flex: 2, padding: 14, borderRadius: radius.full, backgroundColor: colors.warning, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontWeight: '700' },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fffbf0', margin: 16, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: '#e8d5a0' },
  infoEmoji: { fontSize: 28 },
  infoText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 20 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { ...typography.h3, marginBottom: 8 },
  emptyText: { ...typography.body, color: colors.textMuted },
  letterCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, margin: 16, marginTop: 0, borderRadius: radius.md, padding: 16, ...shadow.sm, borderLeftWidth: 4, borderLeftColor: colors.warning },
  letterOpened: { borderLeftColor: colors.success, opacity: 0.85 },
  letterIcon: { fontSize: 28 },
  letterContent: { flex: 1 },
  letterStatus: { fontWeight: '700', fontSize: 14, color: colors.text },
  letterMeta: { ...typography.caption, marginTop: 2 },
  letterPreview: { fontSize: 12, color: colors.textLight, fontStyle: 'italic', marginTop: 6, lineHeight: 18 },
});
