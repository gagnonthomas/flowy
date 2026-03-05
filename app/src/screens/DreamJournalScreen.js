import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStorage } from '../hooks/useStorage';
import { colors, radius, shadow, typography } from '../theme';

const DREAM_TAGS = ['✨ Lucide','😰 Cauchemar','🔮 Prémonitoire','🌈 Coloré','👥 Personnes connues','🌊 Nature','✈️ Voyage','🏠 Maison'];

export default function DreamJournalScreen() {
  const insets = useSafeAreaInsets();
  const [dreams, setDreams] = useStorage('dreams', []);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [emotion, setEmotion] = useState('😐');

  const EMOTIONS = ['😊','😰','😲','🤔','😌','😢','🥰','😤'];

  const save = () => {
    if (!content.trim()) return;
    setDreams(prev => [{
      id: Date.now().toString(),
      title: title.trim() || 'Rêve du matin',
      content: content.trim(),
      tags: selectedTags,
      emotion,
      date: new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
      ts: Date.now(),
    }, ...prev]);
    setTitle(''); setContent(''); setSelectedTags([]); setEmotion('😐'); setShowAdd(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>💭 Journal des rêves</Text>
          <Text style={styles.sub}>{dreams.length} rêve{dreams.length !== 1 ? 's' : ''} capturé{dreams.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={dreams}
        keyExtractor={d => d.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💭</Text>
            <Text style={styles.emptyTitle}>Aucun rêve noté</Text>
            <Text style={styles.emptyText}>Gardez votre téléphone près du lit. Au réveil, notez immédiatement avant que le rêve ne s'efface.</Text>
            <TouchableOpacity style={styles.startBtn} onPress={() => setShowAdd(true)}>
              <Text style={styles.startBtnText}>+ Noter un rêve</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.dreamCard}>
            <View style={styles.dreamHeader}>
              <Text style={styles.dreamEmotion}>{item.emotion}</Text>
              <View style={styles.dreamMeta}>
                <Text style={styles.dreamTitle}>{item.title}</Text>
                <Text style={styles.dreamDate}>{item.date}</Text>
              </View>
            </View>
            <Text style={styles.dreamContent} numberOfLines={4}>{item.content}</Text>
            {item.tags?.length > 0 && (
              <View style={styles.tagsRow}>
                {item.tags.map(t => (
                  <View key={t} style={styles.tag}>
                    <Text style={styles.tagText}>{t}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      />

      <Modal visible={showAdd} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowAdd(false)} />
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>💭 Capturer ce rêve</Text>
          <Text style={styles.modalSub}>Notez rapidement avant qu'il ne s'efface...</Text>
          <TextInput style={styles.contentInput}
            placeholder="Que s'est-il passé dans ce rêve ? Décrivez ce dont vous vous souvenez..."
            placeholderTextColor={colors.textLight} value={content} onChangeText={setContent}
            multiline numberOfLines={6} textAlignVertical="top" autoFocus />
          <Text style={styles.label}>Émotion dominante</Text>
          <View style={styles.emotionRow}>
            {EMOTIONS.map(e => (
              <TouchableOpacity key={e} style={[styles.emotionBtn, emotion===e && styles.emotionSelected]}
                onPress={() => setEmotion(e)}>
                <Text style={styles.emotionEmoji}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Tags (optionnel)</Text>
          <View style={styles.tagsGrid}>
            {DREAM_TAGS.map(t => (
              <TouchableOpacity key={t} style={[styles.tagBtn, selectedTags.includes(t) && styles.tagBtnActive]}
                onPress={() => setSelectedTags(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t])}>
                <Text style={[styles.tagBtnText, selectedTags.includes(t) && styles.tagBtnTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveBtnText}>Sauvegarder ce rêve</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0e1a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#1a1033', borderBottomWidth: 1, borderBottomColor: '#2d1f5e' },
  title: { fontSize: 22, fontWeight: '700', color: '#e2d9f3' },
  sub: { fontSize: 13, color: '#6b5ea8', marginTop: 2 },
  addBtn: { backgroundColor: '#7c6fcd', borderRadius: radius.full, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  dreamCard: { backgroundColor: '#1a1033', borderRadius: radius.md, padding: 16, borderLeftWidth: 3, borderLeftColor: '#7c6fcd' },
  dreamHeader: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  dreamEmotion: { fontSize: 28 },
  dreamMeta: { flex: 1 },
  dreamTitle: { fontSize: 15, fontWeight: '700', color: '#e2d9f3' },
  dreamDate: { fontSize: 12, color: '#6b5ea8', marginTop: 2, textTransform: 'capitalize' },
  dreamContent: { fontSize: 14, color: '#c4b5fd', lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { backgroundColor: '#2d1f5e', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, color: '#a78bfa' },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#e2d9f3', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6b5ea8', textAlign: 'center', lineHeight: 22 },
  startBtn: { backgroundColor: '#7c6fcd', borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12, marginTop: 24 },
  startBtnText: { color: '#fff', fontWeight: '700' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modal: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1a1033', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#e2d9f3', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#6b5ea8', marginBottom: 14 },
  contentInput: { backgroundColor: '#0f0e1a', borderRadius: radius.md, padding: 14, fontSize: 15, color: '#e2d9f3', minHeight: 120, borderWidth: 1, borderColor: '#2d1f5e', textAlignVertical: 'top' },
  label: { fontSize: 11, fontWeight: '700', color: '#6b5ea8', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 14, marginBottom: 8 },
  emotionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  emotionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0f0e1a', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#2d1f5e' },
  emotionSelected: { backgroundColor: '#2d1f5e', borderColor: '#a78bfa' },
  emotionEmoji: { fontSize: 22 },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, backgroundColor: '#0f0e1a', borderWidth: 1, borderColor: '#2d1f5e' },
  tagBtnActive: { backgroundColor: '#2d1f5e', borderColor: '#a78bfa' },
  tagBtnText: { fontSize: 12, color: '#6b5ea8', fontWeight: '600' },
  tagBtnTextActive: { color: '#a78bfa' },
  saveBtn: { backgroundColor: '#7c6fcd', borderRadius: 999, padding: 16, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
