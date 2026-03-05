import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStorage } from '../hooks/useStorage';
import { colors, radius, shadow, typography } from '../theme';

const DEFAULT_KIT = {
  activities: ['Écouter ma playlist apaisante','Faire une promenade de 10 min','Regarder un épisode réconfortant','Prendre un bain chaud','Dessiner ou colorier'],
  people: [],
  phrases: ['Ce sentiment est temporaire','J\'ai déjà surmonté des moments difficiles','Je mérite de l\'aide et de la douceur','Un pas à la fois'],
  breathing: true,
};

const SECTIONS = [
  { key: 'activities', label: '🎯 Activités réconfortantes', color: colors.primary, placeholder: 'Ex : écouter ma playlist...' },
  { key: 'people', label: '👥 Personnes à appeler', color: colors.accent, placeholder: 'Ex : Maman, Julie, Dr. Martin...' },
  { key: 'phrases', label: '💬 Phrases rassurantes', color: colors.success, placeholder: 'Ex : Ce moment passera...' },
];

export default function EmergencyKitScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [kit, setKit] = useStorage('emergency_kit', DEFAULT_KIT);
  const [editSection, setEditSection] = useState(null);
  const [newItem, setNewItem] = useState('');
  const [editing, setEditing] = useState(false);

  const addItem = (section) => {
    if (!newItem.trim()) return;
    setKit(prev => ({ ...prev, [section]: [...(prev[section] || []), newItem.trim()] }));
    setNewItem('');
  };

  const removeItem = (section, idx) => {
    Alert.alert('Retirer', 'Supprimer cet élément ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () =>
        setKit(prev => ({ ...prev, [section]: prev[section].filter((_, i) => i !== idx) }))
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🧰</Text>
        <View>
          <Text style={styles.heroTitle}>Kit de secours émotionnel</Text>
          <Text style={styles.heroSub}>Préparé à l'avance pour les mauvais jours</Text>
        </View>
        <TouchableOpacity onPress={() => setEditing(e => !e)}>
          <Ionicons name={editing ? 'checkmark-circle' : 'create-outline'} size={24} color={editing ? colors.success : colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>💡 Cette page est là pour vous quand ça va mal. Personnalisez-la maintenant pendant que vous allez bien, pour pouvoir y accéder d'un tap depuis l'accueil.</Text>
      </View>

      {/* Breathing quick access */}
      <TouchableOpacity style={styles.breathBtn} onPress={() => navigation.navigate('Breathing')}>
        <Text style={styles.breathEmoji}>🫁</Text>
        <View style={styles.breathContent}>
          <Text style={styles.breathTitle}>Exercices de respiration</Text>
          <Text style={styles.breathSub}>Commencer par une technique de calme</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.white} />
      </TouchableOpacity>

      {/* Sections */}
      {SECTIONS.map(sec => (
        <View key={sec.key} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: sec.color }]}>{sec.label}</Text>
          {(kit[sec.key] || []).map((item, idx) => (
            <View key={idx} style={[styles.item, { borderLeftColor: sec.color }]}>
              <Text style={styles.itemText}>{item}</Text>
              {editing && (
                <TouchableOpacity onPress={() => removeItem(sec.key, idx)}>
                  <Ionicons name="close-circle" size={20} color={colors.danger} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {(kit[sec.key] || []).length === 0 && (
            <Text style={styles.emptyText}>Aucun élément — appuyez sur + pour ajouter</Text>
          )}
          {editing && (
            <View style={styles.addRow}>
              <TextInput style={styles.addInput} placeholder={sec.placeholder}
                placeholderTextColor={colors.textLight} value={editSection===sec.key ? newItem : ''}
                onFocus={() => setEditSection(sec.key)}
                onChangeText={setNewItem} />
              <TouchableOpacity style={[styles.addIconBtn, { backgroundColor: sec.color }]}
                onPress={() => { addItem(sec.key); setEditSection(null); }}>
                <Ionicons name="add" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}

      {/* Message bienveillant */}
      <View style={styles.messageCard}>
        <Text style={styles.messageBig}>💙</Text>
        <Text style={styles.messageTitle}>Vous avez survécu à tous vos mauvais jours jusqu'ici.</Text>
        <Text style={styles.messageSub}>Ce moment passera. Vous n'êtes pas seul·e.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.danger + '15', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.danger + '22' },
  heroEmoji: { fontSize: 36 },
  heroTitle: { ...typography.h3 },
  heroSub: { ...typography.caption, marginTop: 2 },
  infoCard: { backgroundColor: colors.warning + '15', margin: 16, borderRadius: radius.md, padding: 14, borderLeftWidth: 4, borderLeftColor: colors.warning },
  infoText: { fontSize: 13, color: colors.text, lineHeight: 20 },
  breathBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.info, margin: 16, marginTop: 0, borderRadius: radius.md, padding: 16 },
  breathEmoji: { fontSize: 28 },
  breathContent: { flex: 1 },
  breathTitle: { color: colors.white, fontWeight: '700', fontSize: 15 },
  breathSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  section: { backgroundColor: colors.surface, margin: 16, marginTop: 0, borderRadius: radius.md, padding: 16, ...shadow.sm },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderLeftWidth: 3, paddingLeft: 12, marginBottom: 6, backgroundColor: colors.background, borderRadius: 8 },
  itemText: { ...typography.body, flex: 1, lineHeight: 20 },
  emptyText: { ...typography.caption, fontStyle: 'italic' },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  addInput: { flex: 1, backgroundColor: colors.background, borderRadius: radius.md, padding: 12, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border },
  addIconBtn: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  messageCard: { backgroundColor: '#eff6ff', margin: 16, borderRadius: radius.md, padding: 24, alignItems: 'center' },
  messageBig: { fontSize: 40, marginBottom: 12 },
  messageTitle: { ...typography.h3, textAlign: 'center', color: '#1e40af', lineHeight: 26 },
  messageSub: { ...typography.body, textAlign: 'center', color: '#3b82f6', marginTop: 8, fontStyle: 'italic' },
});
