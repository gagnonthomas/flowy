import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Image, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { showToast } from './Toast';
import { useFlowiStore } from '@/store';
import { getToday } from '@/utils/date';

const API_URL = `${process.env.EXPO_PUBLIC_FLOWI_API_URL || ''}/v1/messages`;
const API_KEY = process.env.EXPO_PUBLIC_FLOWI_KEY || '';

type ScanTarget = 'auto' | 'todos' | 'notes' | 'agenda' | 'semaine';

function autoPrompt(today: string): string {
  return `Photo manuscrite de planification (peut contenir des tâches, des rendez-vous datés, ou les deux). Aujourd'hui = ${today}. Pour CHAQUE item lisible, classifie-le :
- "task" : action à faire, sans date ni heure spécifique (ex. "acheter du pain")
- "event" : a une date OU une heure (ex. "12/5 14h dentiste", "Lundi RDV maman", "9h réunion")

Pour chaque event, renvoie aussi :
- "date" au format YYYY-MM-DD si déductible (utilise ${today} comme référence pour interpréter "demain", "lundi prochain", "12/5", etc.) — sinon null
- "time" au format HH:MM (24h) si visible — sinon null

Réponds UNIQUEMENT en JSON valide, sans markdown :
{"items":[{"type":"task","text":"acheter du pain"},{"type":"event","text":"RDV dentiste","date":"2026-05-12","time":"14:00"},{"type":"event","text":"dîner chez maman","date":null,"time":"19:00"}]}`;
}

const PROMPTS: Record<Exclude<ScanTarget, 'auto'>, string> = {
  todos: "Photo of a handwritten task list. Extract each task. Reply ONLY with JSON array: [{\"text\":\"task\"}]. Nothing else.",
  notes: "Photo of handwritten notes. Transcribe faithfully. Reply ONLY with JSON array: [{\"text\":\"paragraph\"}]. Nothing else.",
  agenda: "Photo d'un agenda papier. Extrais chaque événement ou tâche visible avec l'heure si indiquée. Réponds UNIQUEMENT avec un tableau JSON: [{\"text\":\"09h00 - Réunion équipe\"},{\"text\":\"Appeler médecin\"}]. Rien d'autre.",
  semaine: "Photo d'un agenda hebdomadaire papier. Extrais chaque événement ou tâche avec le jour et l'heure si indiqués. Réponds UNIQUEMENT avec un tableau JSON: [{\"text\":\"Lundi 10h - Réunion\"},{\"text\":\"Mercredi - Dentiste\"}]. Rien d'autre.",
};

interface ScanResult {
  id: string;
  text: string;
  selected: boolean;
  // Auto mode only:
  type?: 'task' | 'event';
  date?: string | null;
  time?: string | null;
}

interface Props {
  visible: boolean;
  target: ScanTarget;
  onClose: () => void;
  onImport?: (items: string[]) => void; // ignored in 'auto' mode (modal routes itself)
  onAutoComplete?: (counts: { tasks: number; events: number }) => void; // 'auto' only
}

export function ScanModal({ visible, target, onClose, onImport, onAutoComplete }: Props) {
  const [image, setImage] = useState<string | null>(null);
  const [phase, setPhase] = useState<'pick' | 'preview' | 'loading' | 'confirm'>('pick');
  const [results, setResults] = useState<ScanResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const addTodo = useFlowiStore((s) => s.addTodo);
  const addEvent = useFlowiStore((s) => s.addEvent);
  const isAuto = target === 'auto';

  const reset = () => {
    setImage(null);
    setPhase('pick');
    setResults([]);
    setError(null);
  };

  const pickImage = async (useCamera: boolean) => {
    const method = useCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const result = await method({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      setPhase('preview');
      setError(null);
      // Auto-analyze
      analyzeImage(result.assets[0].base64 || '', result.assets[0].uri.endsWith('.png') ? 'image/png' : 'image/jpeg');
    }
  };

  const analyzeImage = async (base64: string, mimeType: string) => {
    if (!API_KEY || !process.env.EXPO_PUBLIC_FLOWI_API_URL) {
      setError('Configuration API manquante.');
      setPhase('preview');
      return;
    }
    setPhase('loading');
    setError(null);

    try {
      const promptText = isAuto ? autoPrompt(getToday()) : (PROMPTS[target as Exclude<ScanTarget, 'auto'>] || PROMPTS.todos);
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Flowi-Key': API_KEY,
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1200,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
              { type: 'text', text: promptText },
            ],
          }],
        }),
      });

      const data = await res.json();
      const txt = (data.content || []).map((b: any) => b.text || '').join('');
      const clean = txt.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);

      // Auto mode: parse {items: [{type, text, date?, time?}]}
      if (isAuto) {
        const items = Array.isArray(parsed?.items) ? parsed.items : [];
        if (items.length === 0) {
          setError('Aucun contenu détecté. Essaie avec une photo plus nette.');
          setPhase('preview');
          return;
        }
        setResults(items
          .map((item: any) => ({
            id: String(Math.random()),
            text: (item.text || '').trim(),
            selected: true,
            type: item.type === 'event' ? 'event' as const : 'task' as const,
            date: item.date || null,
            time: item.time || null,
          }))
          .filter((x: ScanResult) => x.text)
        );
        setPhase('confirm');
        return;
      }

      // Legacy modes: parse [{text}]
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setError('Aucun contenu détecté. Essaie avec une photo plus nette.');
        setPhase('preview');
        return;
      }

      setResults(parsed
        .map((item: any) => ({ id: String(Math.random()), text: (item.text || '').trim(), selected: true }))
        .filter((x: ScanResult) => x.text)
      );
      setPhase('confirm');
    } catch (e) {
      setError('Erreur d\'analyse. Vérifie ta connexion.');
      setPhase('preview');
    }
  };

  const toggleItem = (id: string) => {
    setResults((prev) => prev.map((r) => r.id === id ? { ...r, selected: !r.selected } : r));
  };

  const confirmImport = () => {
    const selected = results.filter((r) => r.selected);

    if (isAuto) {
      // Smart route: tasks → addTodo, events → addEvent
      let tasks = 0;
      let events = 0;
      selected.forEach((item) => {
        if (item.type === 'event') {
          addEvent({
            title: item.text,
            date: item.date || getToday(),
            time: item.time || null,
            endTime: null,
            category: 'rdv',
          });
          events++;
        } else {
          addTodo(item.text, 'normale', '', getToday());
          tasks++;
        }
      });

      const parts: string[] = [];
      if (tasks > 0) parts.push(`${tasks} tâche${tasks > 1 ? 's' : ''}`);
      if (events > 0) parts.push(`${events} RDV`);
      showToast(`${parts.join(' + ')} importé${tasks + events > 1 ? 's' : ''} 🎉`, 'success');
      onAutoComplete?.({ tasks, events });
    } else {
      onImport?.(selected.map((r) => r.text));
      showToast(`${selected.length} élément${selected.length > 1 ? 's' : ''} importé${selected.length > 1 ? 's' : ''} !`, 'success');
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.card}>
          {/* Header */}
          <LinearGradient colors={['#3B82F6', '#6366F1']} style={s.header}>
            <Text style={s.headerIcon}>📷</Text>
            <Text style={s.headerTitle}>Scanner un document</Text>
            <Pressable onPress={() => { reset(); onClose(); }} style={s.closeBtn}>
              <Text style={s.closeBtnText}>×</Text>
            </Pressable>
          </LinearGradient>

          <ScrollView contentContainerStyle={s.body}>
            {/* Phase: Pick */}
            {phase === 'pick' && (
              <View style={s.pickSection}>
                <Text style={s.pickTitle}>Choisis une source</Text>
                <Pressable onPress={() => pickImage(true)} style={s.pickBtn}>
                  <Text style={{ fontSize: 28 }}>📸</Text>
                  <Text style={s.pickBtnTitle}>Prendre une photo</Text>
                  <Text style={s.pickBtnSub}>Pointe vers ton agenda papier</Text>
                </Pressable>
                <Pressable onPress={() => pickImage(false)} style={s.pickBtn}>
                  <Text style={{ fontSize: 28 }}>🖼️</Text>
                  <Text style={s.pickBtnTitle}>Galerie</Text>
                  <Text style={s.pickBtnSub}>Choisir une image existante</Text>
                </Pressable>
              </View>
            )}

            {/* Phase: Preview / Loading */}
            {(phase === 'preview' || phase === 'loading') && image && (
              <View style={s.previewSection}>
                <Image source={{ uri: image }} style={s.previewImage} resizeMode="contain" />
                {phase === 'loading' && (
                  <View style={s.loadingOverlay}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={s.loadingText}>Flowi analyse ton document...</Text>
                  </View>
                )}
                {error && <Text style={s.errorText}>{error}</Text>}
                {phase === 'preview' && (
                  <Pressable onPress={() => setPhase('pick')} style={s.retryBtn}>
                    <Text style={s.retryBtnText}>↺ Reprendre</Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Phase: Confirm */}
            {phase === 'confirm' && (
              <View style={s.confirmSection}>
                <Text style={s.confirmTitle}>{results.length} élément{results.length > 1 ? 's' : ''} détecté{results.length > 1 ? 's' : ''}</Text>
                <Text style={s.confirmSub}>
                  {isAuto
                    ? 'Flowi a classé chaque item. Décoche ce que tu ne veux pas garder.'
                    : 'Décoche ce que tu ne veux pas importer'}
                </Text>
                {results.map((r) => {
                  const isEvent = r.type === 'event';
                  return (
                    <Pressable key={r.id} onPress={() => toggleItem(r.id)} style={[s.resultRow, !r.selected && { opacity: 0.4 }]}>
                      <View style={[s.resultCheck, r.selected && s.resultCheckOn]}>
                        {r.selected && <Text style={s.resultCheckMark}>✓</Text>}
                      </View>
                      {isAuto && (
                        <View style={[s.typeBadge, { backgroundColor: isEvent ? '#DBEAFE' : '#E0E7FF' }]}>
                          <Text style={[s.typeBadgeText, { color: isEvent ? '#1D4ED8' : '#4F46E5' }]}>
                            {isEvent ? '📅 RDV' : '📋 Tâche'}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={s.resultText}>{r.text}</Text>
                        {isAuto && isEvent && (r.date || r.time) && (
                          <Text style={s.resultMeta}>
                            {r.date || 'date ?'}{r.time ? ` · ${r.time}` : ''}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
                <View style={s.confirmBtns}>
                  <Pressable onPress={confirmImport} style={s.importBtn}>
                    <Text style={s.importBtnText}>Importer ({results.filter((r) => r.selected).length})</Text>
                  </Pressable>
                  <Pressable onPress={() => setPhase('pick')} style={s.cancelBtn}>
                    <Text style={s.cancelBtnText}>Annuler</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 16 },
  headerIcon: { fontSize: 20 },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#FFFFFF', flex: 1 },
  closeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#FFFFFF', fontSize: 16 },
  body: { padding: 16, paddingBottom: 40 },

  // Pick
  pickSection: { gap: 12 },
  pickTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#374151', textAlign: 'center', marginBottom: 4 },
  pickBtn: { alignItems: 'center', paddingVertical: 20, borderRadius: 14, borderWidth: 1.5, borderColor: '#E8EDF5', backgroundColor: '#F9FAFB', gap: 4 },
  pickBtnTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#374151' },
  pickBtnSub: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#9CA3AF' },

  // Preview
  previewSection: { alignItems: 'center', gap: 12 },
  previewImage: { width: '100%', height: 250, borderRadius: 12, backgroundColor: '#F3F4F6' },
  loadingOverlay: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  loadingText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#6366F1' },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#EF4444', textAlign: 'center' },
  retryBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#E8EDF5' },
  retryBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#6B7280' },

  // Confirm
  confirmSection: { gap: 8 },
  confirmTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#374151' },
  confirmSub: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#9CA3AF', marginBottom: 4 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E8EDF5' },
  resultCheck: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  resultCheckOn: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  resultCheckMark: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  resultText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#374151', lineHeight: 18 },
  resultMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#6B7280', marginTop: 2 },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, flexShrink: 0 },
  typeBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.3 },
  confirmBtns: { flexDirection: 'row', gap: 8, marginTop: 8 },
  importBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#3B82F6', alignItems: 'center' },
  importBtnText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFFFFF' },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1.5, borderColor: '#E8EDF5' },
  cancelBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#6B7280' },
});
