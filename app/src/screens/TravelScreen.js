import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStorage } from '../hooks/useStorage';
import { colors, radius, shadow, typography } from '../theme';

const PACKING_TEMPLATES = {
  default: ['Passeport / ID','Billets / QR codes','Chargeurs','Médicaments','Vêtements (n+1 jours)','Sous-vêtements','Pyjama','Trousse de toilette','Écouteurs','Adaptateur électrique'],
  beach: ['Maillot de bain','Crème solaire','Lunettes de soleil','Chapeau','Serviette de plage','Tongs','Livre'],
  business: ['Ordinateur portable','Câbles','Cartes de visite','Tenue professionnelle (x2)','Chargeur téléphone','Adaptateur'],
  winter: ['Manteau chaud','Gants','Bonnet','Écharpe','Chaussettes thermiques','Bottes imperméables'],
};

export default function TravelScreen() {
  const insets = useSafeAreaInsets();
  const [trips, setTrips] = useStorage('trips', []);
  const [showNew, setShowNew] = useState(false);
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState('');
  const [template, setTemplate] = useState('default');
  const [activeTrip, setActiveTrip] = useState(null);

  const createTrip = () => {
    if (!destination.trim()) return;
    const items = PACKING_TEMPLATES[template].map((name, i) => ({ id: i.toString(), name, packed: false }));
    const trip = { id: Date.now().toString(), destination: destination.trim(), dates, template, items, notes: '' };
    setTrips(prev => [trip, ...prev]);
    setActiveTrip(trip);
    setDestination(''); setDates(''); setShowNew(false);
  };

  const toggleItem = (tripId, itemId) => {
    setTrips(prev => prev.map(t => t.id !== tripId ? t : {
      ...t, items: t.items.map(i => i.id === itemId ? { ...i, packed: !i.packed } : i)
    }));
    if (activeTrip?.id === tripId) {
      setActiveTrip(prev => ({
        ...prev, items: prev.items.map(i => i.id === itemId ? { ...i, packed: !i.packed } : i)
      }));
    }
  };

  const addItem = (tripId, name) => {
    if (!name.trim()) return;
    const item = { id: Date.now().toString(), name: name.trim(), packed: false };
    setTrips(prev => prev.map(t => t.id !== tripId ? t : { ...t, items: [...t.items, item] }));
    setActiveTrip(prev => prev?.id === tripId ? { ...prev, items: [...prev.items, item] } : prev);
  };

  if (activeTrip) {
    const trip = trips.find(t => t.id === activeTrip.id) || activeTrip;
    const packed = trip.items.filter(i => i.packed).length;
    const pct = trip.items.length > 0 ? packed / trip.items.length : 0;
    const [newItem, setNewItem] = useState('');

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.tripHeader}>
          <TouchableOpacity onPress={() => setActiveTrip(null)}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.tripHeaderInfo}>
            <Text style={styles.tripDestination}>✈️ {trip.destination}</Text>
            {trip.dates ? <Text style={styles.tripDates}>{trip.dates}</Text> : null}
          </View>
        </View>

        <View style={styles.packingProgress}>
          <View style={styles.progBg}>
            <View style={[styles.progFill, { width: `${pct*100}%` }]} />
          </View>
          <Text style={styles.progText}>{packed}/{trip.items.length} articles emballés · {Math.round(pct*100)}%</Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}>
          {trip.items.map(item => (
            <TouchableOpacity key={item.id} style={styles.packItem} onPress={() => toggleItem(trip.id, item.id)}>
              <Ionicons name={item.packed ? 'checkbox' : 'square-outline'} size={24} color={item.packed ? colors.success : colors.border} />
              <Text style={[styles.packItemText, item.packed && styles.packItemDone]}>{item.name}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.addItemRow}>
            <TextInput style={styles.addItemInput} placeholder="Ajouter un article..."
              placeholderTextColor={colors.textLight} value={newItem} onChangeText={setNewItem}
              onSubmitEditing={() => { addItem(trip.id, newItem); setNewItem(''); }} />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>✈️ Planificateur voyage</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowNew(true)}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>
        {trips.length === 0
          ? <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🗺️</Text>
              <Text style={styles.emptyTitle}>Aucun voyage planifié</Text>
              <Text style={styles.emptyText}>Créez votre premier voyage et générez votre liste de valise personnalisée.</Text>
              <TouchableOpacity style={styles.newTripBtn} onPress={() => setShowNew(true)}>
                <Text style={styles.newTripBtnText}>+ Nouveau voyage</Text>
              </TouchableOpacity>
            </View>
          : trips.map(trip => {
              const packed = trip.items.filter(i => i.packed).length;
              return (
                <TouchableOpacity key={trip.id} style={styles.tripCard} onPress={() => setActiveTrip(trip)}>
                  <Text style={styles.tripCardDest}>✈️ {trip.destination}</Text>
                  {trip.dates ? <Text style={styles.tripCardDates}>{trip.dates}</Text> : null}
                  <View style={styles.tripCardProg}>
                    <View style={styles.smallProgBg}>
                      <View style={[styles.smallProgFill, { width: `${packed/trip.items.length*100}%` }]} />
                    </View>
                    <Text style={styles.tripCardProgText}>{packed}/{trip.items.length}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
      </ScrollView>

      <Modal visible={showNew} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowNew(false)} />
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Nouveau voyage</Text>
          <TextInput style={styles.input} placeholder="Destination (ex: Paris, Montréal...)"
            placeholderTextColor={colors.textLight} value={destination} onChangeText={setDestination} autoFocus />
          <TextInput style={styles.input} placeholder="Dates (ex: 15-22 juillet)"
            placeholderTextColor={colors.textLight} value={dates} onChangeText={setDates} />
          <Text style={styles.label}>Type de voyage</Text>
          <View style={styles.templateRow}>
            {Object.entries({default:'🧳 Standard',beach:'🏖️ Plage',business:'💼 Business',winter:'❄️ Hiver'}).map(([k,v]) => (
              <TouchableOpacity key={k} style={[styles.templateBtn, template===k && styles.templateBtnActive]}
                onPress={() => setTemplate(k)}>
                <Text style={[styles.templateBtnText, template===k && styles.templateBtnTextActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.previewNote}>{PACKING_TEMPLATES[template].length} articles pré-remplis selon le type</Text>
          <TouchableOpacity style={styles.saveBtn} onPress={createTrip}>
            <Text style={styles.saveBtnText}>Créer ce voyage ✈️</Text>
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
  addBtn: { backgroundColor: colors.teal, borderRadius: radius.full, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  tripCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, ...shadow.sm, borderLeftWidth: 4, borderLeftColor: colors.teal },
  tripCardDest: { ...typography.h3, marginBottom: 4 },
  tripCardDates: { ...typography.caption, marginBottom: 10 },
  tripCardProg: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  smallProgBg: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  smallProgFill: { height: 6, backgroundColor: colors.teal, borderRadius: 3 },
  tripCardProgText: { ...typography.small, color: colors.teal },
  tripHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  tripHeaderInfo: { flex: 1 },
  tripDestination: { ...typography.h3 },
  tripDates: { ...typography.caption },
  packingProgress: { backgroundColor: colors.surface, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  progBg: { height: 8, backgroundColor: colors.border, borderRadius: 4, marginBottom: 6, overflow: 'hidden' },
  progFill: { height: 8, backgroundColor: colors.teal, borderRadius: 4 },
  progText: { ...typography.caption, textAlign: 'center' },
  packItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  packItemText: { ...typography.body, flex: 1 },
  packItemDone: { textDecorationLine: 'line-through', color: colors.textLight },
  addItemRow: { marginTop: 8 },
  addItemInput: { backgroundColor: colors.background, borderRadius: radius.md, padding: 12, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { ...typography.h3, marginBottom: 8 },
  emptyText: { ...typography.body, textAlign: 'center', color: colors.textMuted, lineHeight: 22, paddingHorizontal: 24 },
  newTripBtn: { backgroundColor: colors.teal, borderRadius: radius.full, paddingHorizontal: 24, paddingVertical: 12, marginTop: 24 },
  newTripBtnText: { color: colors.white, fontWeight: '700' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modal: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { ...typography.h2, marginBottom: 16 },
  input: { backgroundColor: colors.background, borderRadius: radius.md, padding: 14, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  label: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  templateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  templateBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  templateBtnActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  templateBtnText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  templateBtnTextActive: { color: colors.white },
  previewNote: { ...typography.caption, fontStyle: 'italic', marginBottom: 16 },
  saveBtn: { backgroundColor: colors.teal, borderRadius: radius.full, padding: 16, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
