import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStorage } from '../hooks/useStorage';
import { colors, radius, shadow, typography } from '../theme';

const PROMPTS = [
  'Dessinez votre humeur en couleurs et formes libres.',
  'Écrivez sans réfléchir pendant 5 minutes. Ne vous arrêtez pas.',
  'Décrivez un moment de beauté que vous avez vécu récemment.',
  'Qu\'est-ce qui vous pèse en ce moment ? Donnez-lui une forme.',
  'Imaginez votre vie idéale dans 5 ans. Que voyez-vous ?',
  'Faites la liste de 10 petites choses qui vous rendent heureux·se.',
  'Écrivez une lettre d\'excuse à votre corps.',
  'Qu\'est-ce que vous auriez voulu que quelqu\'un vous dise quand vous étiez enfant ?',
  'Décrivez une couleur sans la nommer.',
  'Qu\'est-ce que vous voudriez lâcher ? Décrivez-le puis laissez-le partir.',
];

const PAGE_COLORS = ['#fff9f0','#f0fff4','#f0f0ff','#fff0f9','#f0f9ff','#fffbf0'];
const TEXT_COLORS = ['#2d2d2d','#7c6fcd','#ec4899','#10b981','#f59e0b','#0ea5e9','#e8775a'];

export default function CreativeJournalScreen() {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useStorage('creative_journal', []);
  const [showAdd, setShowAdd] = useState(false);
  const [content, setContent] = useState('');
  const [bgColor, setBgColor] = useState(PAGE_COLORS[0]);
  const [textColor, setTextColor] = useState(TEXT_COLORS[0]);
  const [prompt, setPrompt] = useState(null);

  const randomPrompt = () => setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);

  const save = () => {
    if (!content.trim()) return;
    setEntries(prev => [{
      id: Date.now().toString(),
      content: content.trim(),
      bgColor, textColor,
      date: new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
      ts: Date.now(),
    }, ...prev]);
    setContent(''); setBgColor(PAGE_COLORS[0]); setTextColor(TEXT_COLORS[0]); setPrompt(null); setShowAdd(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🖍️ Journal créatif</Text>
          <Text style={styles.sub}>{entries.length} entrée{entries.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => { randomPrompt(); setShowAdd(true); }}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={entries}
        keyExtractor={e => e.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🖍️</Text>
            <Text style={styles.emptyTitle}>Votre espace créatif</Text>
            <Text style={styles.emptyText}>Un espace libre pour exprimer ce que les mots habituels ne disent pas.</Text>
            <TouchableOpacity style={styles.startBtn} onPress={() => { randomPrompt(); setShowAdd(true); }}>
              <Text style={styles.startBtnText}>Commencer à écrire</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.entryCard, { backgroundColor: item.bgColor, flex: 1 }]}>
            <Text style={[styles.entryText, { color: item.textColor }]} numberOfLines={6}>{item.content}</Text>
            <Text style={styles.entryDate}>{item.date}</Text>
          </View>
        )}
      />

      <Modal visible={showAdd} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowAdd(false)} />
        <View style={[styles.modal, { backgroundColor: bgColor }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={randomPrompt}>
              <Text style={styles.promptBtn}>🎲 Nouveau prompt</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {prompt && (
            <View style={styles.promptBox}>
              <Text style={styles.promptLabel}>✨ Prompt créatif</Text>
              <Text style={styles.promptText}>{prompt}</Text>
            </View>
          )}

          <TextInput
            style={[styles.creativeInput, { color: textColor }]}
            placeholder="Écrivez librement, sans filtre ni jugement..."
            placeholderTextColor={textColor + '66'}
            value={content} onChangeText={setContent}
            multiline numberOfLines={8} textAlignVertical="top" autoFocus
          />

          <View style={styles.toolsRow}>
            <View style={styles.colorGroup}>
              <Text style={styles.toolLabel}>Fond</Text>
              <View style={styles.colorRow}>
                {PAGE_COLORS.map(c => (
                  <TouchableOpacity key={c} style={[styles.colorDot, { backgroundColor: c }, bgColor===c && styles.colorSelected]}
                    onPress={() => setBgColor(c)} />
                ))}
              </View>
            </View>
            <View style={styles.colorGroup}>
              <Text style={styles.toolLabel}>Texte</Text>
              <View style={styles.colorRow}>
                {TEXT_COLORS.map(c => (
                  <TouchableOpacity key={c} style={[styles.colorDot, { backgroundColor: c }, textColor===c && styles.colorSelected]}
                    onPress={() => setTextColor(c)} />
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveBtnText}>Sauvegarder cette page</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { ...typography.h2 },
  sub: { ...typography.caption, marginTop: 2 },
  addBtn: { backgroundColor: colors.accent, borderRadius: radius.full, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  entryCard: { borderRadius: radius.md, padding: 16, minHeight: 150, ...shadow.sm },
  entryText: { fontSize: 14, lineHeight: 22, flex: 1 },
  entryDate: { fontSize: 10, color: colors.textLight, marginTop: 8 },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { ...typography.h3, marginBottom: 8 },
  emptyText: { ...typography.body, textAlign: 'center', color: colors.textMuted, lineHeight: 22 },
  startBtn: { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: 24, paddingVertical: 12, marginTop: 24 },
  startBtnText: { color: colors.white, fontWeight: '700' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modal: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  promptBtn: { fontSize: 13, color: colors.primary, fontWeight: '700' },
  promptBox: { backgroundColor: 'rgba(124,111,205,0.15)', borderRadius: radius.md, padding: 12, marginBottom: 14 },
  promptLabel: { fontSize: 10, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  promptText: { fontSize: 14, color: colors.text, fontStyle: 'italic', lineHeight: 22 },
  creativeInput: { fontSize: 16, minHeight: 160, lineHeight: 26, textAlignVertical: 'top', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)', paddingBottom: 12, marginBottom: 16 },
  toolsRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  colorGroup: { flex: 1 },
  toolLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  colorRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  colorDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  colorSelected: { borderWidth: 3, borderColor: colors.text },
  saveBtn: { backgroundColor: colors.accent, borderRadius: radius.full, padding: 14, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
