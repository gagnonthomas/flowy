import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Modal, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStorage } from '../hooks/useStorage';
import { colors, radius, shadow, typography } from '../theme';

const JOY_EMOJIS = ['🌟','💕','😄','🎉','🌸','☀️','🦋','🍀','🎵','🌈','💫','🥰'];

export default function JarScreen() {
  const insets = useSafeAreaInsets();
  const [memories, setMemories] = useStorage('jar_memories', []);
  const [showAdd, setShowAdd] = useState(false);
  const [showJar, setShowJar] = useState(false);
  const [text, setText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🌟');
  const [jarOpen, setJarOpen] = useState(false);

  const add = () => {
    if (!text.trim() && selectedEmoji === '🌟') return;
    setMemories(prev => [{
      id: Date.now().toString(),
      text: text.trim(),
      emoji: selectedEmoji,
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      ts: Date.now(),
    }, ...prev]);
    setText('');
    setSelectedEmoji('🌟');
    setShowAdd(false);
  };

  const openJar = () => {
    if (memories.length === 0) {
      Alert.alert('Le bocal est vide', 'Commencez à ajouter des moments de joie pour remplir votre bocal !');
      return;
    }
    setJarOpen(true);
    setShowJar(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🫙 Bocal à souvenirs</Text>
          <Text style={styles.sub}>{memories.length} moment{memories.length !== 1 ? 's' : ''} de joie conservé{memories.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Jar visual */}
      <TouchableOpacity style={styles.jarVisual} onPress={openJar} activeOpacity={0.85}>
        <Text style={styles.jarEmoji}>🫙</Text>
        <View style={styles.jarContent}>
          {memories.slice(0, 8).map((m, i) => (
            <Text key={m.id} style={[styles.jarItem, { transform: [{ rotate: `${(i%3-1)*15}deg` }] }]}>{m.emoji}</Text>
          ))}
        </View>
        <Text style={styles.jarLabel}>Appuyer pour ouvrir le bocal</Text>
      </TouchableOpacity>

      {/* List */}
      <FlatList
        data={memories}
        keyExtractor={m => m.id}
        contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 10, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🫙</Text>
            <Text style={styles.emptyTitle}>Votre bocal est vide</Text>
            <Text style={styles.emptySub}>Chaque jour, notez un petit moment de joie.{'\n'}À la fin de l'année, ouvrez le bocal.</Text>
            <TouchableOpacity style={styles.startBtn} onPress={() => setShowAdd(true)}>
              <Text style={styles.startBtnText}>Ajouter mon premier souvenir</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.memoryCard}>
            <Text style={styles.memoryEmoji}>{item.emoji}</Text>
            <View style={styles.memoryContent}>
              {item.text ? <Text style={styles.memoryText}>{item.text}</Text> : null}
              <Text style={styles.memoryDate}>{item.date}</Text>
            </View>
          </View>
        )}
      />

      {/* Add modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowAdd(false)} />
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>✨ Un moment de joie</Text>
          <Text style={styles.modalSub}>Qu'est-ce qui vous a rendu·e heureux·se aujourd'hui ?</Text>
          <TextInput style={styles.input} placeholder="Un sourire, une victoire, un instant..."
            placeholderTextColor={colors.textLight} value={text} onChangeText={setText}
            multiline numberOfLines={3} autoFocus />
          <Text style={styles.emojiLabel}>Choisissez un emoji</Text>
          <View style={styles.emojiGrid}>
            {JOY_EMOJIS.map(e => (
              <TouchableOpacity key={e} style={[styles.emojiBtn, selectedEmoji===e && styles.emojiSelected]} onPress={() => setSelectedEmoji(e)}>
                <Text style={styles.emojiText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={add}>
            <Text style={styles.saveBtnText}>Mettre dans le bocal 🫙</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Open jar modal */}
      <Modal visible={showJar} transparent animationType="fade">
        <View style={styles.jarModal}>
          <View style={styles.jarModalInner}>
            <Text style={styles.jarModalTitle}>🫙 Vos souvenirs de joie</Text>
            <Text style={styles.jarModalSub}>{memories.length} moments précieux</Text>
            <FlatList
              data={memories}
              keyExtractor={m => m.id}
              contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => (
                <View style={styles.jarMemory}>
                  <Text style={styles.jarMemoryEmoji}>{item.emoji}</Text>
                  <View>
                    {item.text ? <Text style={styles.jarMemoryText}>{item.text}</Text> : null}
                    <Text style={styles.jarMemoryDate}>{item.date}</Text>
                  </View>
                </View>
              )}
            />
            <TouchableOpacity style={styles.closeJarBtn} onPress={() => { setShowJar(false); setJarOpen(false); }}>
              <Text style={styles.closeJarText}>Refermer le bocal 🫙</Text>
            </TouchableOpacity>
          </View>
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
  addBtn: { backgroundColor: colors.warning, borderRadius: radius.full, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  jarVisual: { margin: 16, backgroundColor: '#fffbeb', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: colors.warning + '44', borderStyle: 'dashed' },
  jarEmoji: { fontSize: 48 },
  jarContent: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginVertical: 12 },
  jarItem: { fontSize: 28 },
  jarLabel: { color: colors.warning, fontSize: 13, fontWeight: '600', marginTop: 8 },
  memoryCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start', ...shadow.sm },
  memoryEmoji: { fontSize: 28 },
  memoryContent: { flex: 1 },
  memoryText: { ...typography.body, lineHeight: 22 },
  memoryDate: { ...typography.caption, marginTop: 4 },
  emptyState: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { ...typography.h3, marginBottom: 8 },
  emptySub: { ...typography.body, textAlign: 'center', color: colors.textMuted, lineHeight: 22 },
  startBtn: { backgroundColor: colors.warning, borderRadius: radius.full, paddingHorizontal: 24, paddingVertical: 12, marginTop: 24 },
  startBtnText: { color: colors.white, fontWeight: '700' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modal: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { ...typography.h2, marginBottom: 4 },
  modalSub: { ...typography.caption, marginBottom: 16 },
  input: { backgroundColor: colors.background, borderRadius: 12, padding: 14, fontSize: 15, color: colors.text, minHeight: 80, borderWidth: 1, borderColor: colors.border, textAlignVertical: 'top' },
  emojiLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 10 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emojiBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border },
  emojiSelected: { backgroundColor: colors.warning + '33', borderColor: colors.warning },
  emojiText: { fontSize: 24 },
  saveBtn: { backgroundColor: colors.warning, borderRadius: 999, padding: 16, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  jarModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  jarModalInner: { backgroundColor: colors.surface, borderRadius: 24, padding: 24, width: '100%', maxHeight: '85%' },
  jarModalTitle: { ...typography.h2, textAlign: 'center', marginBottom: 4 },
  jarModalSub: { ...typography.caption, textAlign: 'center', marginBottom: 20 },
  jarMemory: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  jarMemoryEmoji: { fontSize: 28 },
  jarMemoryText: { ...typography.body },
  jarMemoryDate: { ...typography.caption, marginTop: 2 },
  closeJarBtn: { backgroundColor: colors.warning, borderRadius: 999, padding: 14, alignItems: 'center', marginTop: 16 },
  closeJarText: { color: colors.white, fontWeight: '700' },
});
