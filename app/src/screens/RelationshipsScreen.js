import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStorage } from '../hooks/useStorage';
import { colors, radius, shadow, typography } from '../theme';
import { formatDate } from '../utils/lunar';

const FREQUENCY_OPTIONS = [
  { label: 'Chaque semaine', days: 7 },
  { label: 'Tous les 15 jours', days: 14 },
  { label: 'Chaque mois', days: 30 },
  { label: 'Tous les 3 mois', days: 90 },
];

export default function RelationshipsScreen() {
  const insets = useSafeAreaInsets();
  const [contacts, setContacts] = useStorage('relationships', []);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [freqIdx, setFreqIdx] = useState(1);
  const now = new Date();

  const addContact = () => {
    if (!name.trim()) return;
    setContacts(prev => [...prev, {
      id: Date.now().toString(),
      name: name.trim(),
      note: note.trim(),
      frequency: FREQUENCY_OPTIONS[freqIdx],
      lastContact: null,
      emoji: '👤',
    }]);
    setName(''); setNote(''); setShowAdd(false);
  };

  const markContacted = (id) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, lastContact: formatDate(now) } : c));
    Alert.alert('✅ Noté !', 'Contact enregistré. Prochain rappel dans ' + contacts.find(c=>c.id===id)?.frequency.days + ' jours.');
  };

  const getDaysOverdue = (contact) => {
    if (!contact.lastContact) return contact.frequency.days + 1;
    const last = new Date(contact.lastContact);
    const daysSince = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    return daysSince - contact.frequency.days;
  };

  const sorted = [...contacts].sort((a, b) => getDaysOverdue(b) - getDaysOverdue(a));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>💌 Tracker relations</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={c => c.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💌</Text>
            <Text style={styles.emptyTitle}>Aucun contact ajouté</Text>
            <Text style={styles.emptyText}>Ajoutez les personnes importantes dans votre vie pour ne jamais perdre le contact.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const overdue = getDaysOverdue(item);
          const isOverdue = overdue > 0;
          const isUrgent = overdue > 7;
          const daysSince = item.lastContact ? Math.floor((now - new Date(item.lastContact)) / (1000*60*60*24)) : null;

          return (
            <View style={[styles.contactCard, isUrgent && styles.contactUrgent, isOverdue && !isUrgent && styles.contactOverdue]}>
              <View style={styles.contactLeft}>
                <View style={[styles.avatar, { backgroundColor: isUrgent ? colors.danger + '33' : isOverdue ? colors.warning + '33' : colors.success + '33' }]}>
                  <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{item.name}</Text>
                {item.note ? <Text style={styles.contactNote}>{item.note}</Text> : null}
                <Text style={[styles.contactStatus, isUrgent && { color: colors.danger }, isOverdue && !isUrgent && { color: colors.warning }]}>
                  {daysSince === null ? `À contacter (${item.frequency.label.toLowerCase()})` :
                    isOverdue ? `⚠️ ${overdue} jour${overdue>1?'s':''} de retard` :
                    `✅ Contacté·e il y a ${daysSince} jour${daysSince>1?'s':''}`}
                </Text>
                <Text style={styles.contactFreq}>{item.frequency.label}</Text>
              </View>
              <TouchableOpacity style={[styles.contactBtn, { backgroundColor: isOverdue ? colors.success : colors.border }]}
                onPress={() => markContacted(item.id)}>
                <Ionicons name="checkmark" size={20} color={isOverdue ? colors.white : colors.textLight} />
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <Modal visible={showAdd} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowAdd(false)} />
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>💌 Ajouter un contact</Text>
          <TextInput style={styles.input} placeholder="Prénom ou relation (ex: Maman, Julie...)"
            placeholderTextColor={colors.textLight} value={name} onChangeText={setName} autoFocus />
          <TextInput style={styles.input} placeholder="Note optionnelle (ex: appeler le dimanche)"
            placeholderTextColor={colors.textLight} value={note} onChangeText={setNote} />
          <Text style={styles.label}>Fréquence de contact</Text>
          <View style={styles.freqGrid}>
            {FREQUENCY_OPTIONS.map((f, i) => (
              <TouchableOpacity key={f.label} style={[styles.freqBtn, freqIdx===i && styles.freqBtnActive]}
                onPress={() => setFreqIdx(i)}>
                <Text style={[styles.freqBtnText, freqIdx===i && styles.freqBtnTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={addContact}>
            <Text style={styles.saveBtnText}>Ajouter ce contact</Text>
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
  addBtn: { backgroundColor: colors.accent, borderRadius: radius.full, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  contactCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, ...shadow.sm },
  contactUrgent: { borderLeftWidth: 4, borderLeftColor: colors.danger },
  contactOverdue: { borderLeftWidth: 4, borderLeftColor: colors.warning },
  contactLeft: {},
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: colors.text },
  contactInfo: { flex: 1 },
  contactName: { ...typography.body, fontWeight: '700' },
  contactNote: { ...typography.caption, marginTop: 2, fontStyle: 'italic' },
  contactStatus: { fontSize: 13, color: colors.success, fontWeight: '600', marginTop: 4 },
  contactFreq: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  contactBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { ...typography.h3, marginBottom: 8 },
  emptyText: { ...typography.body, textAlign: 'center', color: colors.textMuted, lineHeight: 22 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modal: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { ...typography.h2, marginBottom: 16 },
  input: { backgroundColor: colors.background, borderRadius: radius.md, padding: 14, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  label: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  freqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  freqBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.full, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  freqBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  freqBtnText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  freqBtnTextActive: { color: colors.white },
  saveBtn: { backgroundColor: colors.accent, borderRadius: radius.full, padding: 16, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
