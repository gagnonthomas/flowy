# Flowi — Plan de développement mobile pour Claude Code

## Contexte

Flowi est une application de planification quotidienne orientée bien-être, conçue pour les cerveaux actifs (TDAH-friendly). Elle existe actuellement comme un composant React monolithique (`agenda-sync.jsx`, ~5000 lignes). L'objectif est de la transformer en une **application mobile native** avec Expo + React Native, en conservant toute la logique existante et en améliorant l'expérience mobile.

---

## Stack technologique cible

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| Framework | **Expo SDK 51+** | Déploiement iOS + Android, OTA updates |
| Navigation | **Expo Router** (file-based) | Navigation native, deep links |
| UI | **React Native** + StyleSheet | Performance native |
| Stockage local | **AsyncStorage** + **MMKV** | Remplace localStorage |
| Base de données | **Expo SQLite** | Données structurées offline-first |
| API IA | **Anthropic API** via Cloudflare Worker | Clé API protégée côté serveur |
| Notifications | **Expo Notifications** | Check-in énergie, rappels RDV |
| Gestures | **React Native Gesture Handler** | Swipe tasks, swipe navigation |
| Animations | **React Native Reanimated 3** | Transitions fluides |
| Calendrier | **react-native-calendars** | Vues semaine et mois |
| Fonts | **expo-font** + Google Fonts | Inter + Playfair Display |
| Audio | **expo-av** | Cloche méditation |
| Haptics | **expo-haptics** | Feedback tactile sur actions clés |
| Déploiement | **EAS Build + EAS Submit** | App Store + Google Play |

---

## Architecture des fichiers

```
flowi/
├── app/                          # Expo Router pages
│   ├── _layout.tsx               # Root layout, navigation setup
│   ├── (tabs)/                   # Tab navigation group
│   │   ├── _layout.tsx           # Bottom tab bar config
│   │   ├── accueil.tsx
│   │   ├── aujourd-hui.tsx       # Sub-tabs: agenda, routines
│   │   ├── focus.tsx
│   │   ├── planning.tsx          # Sub-tabs: semaine, cal, bilan
│   │   ├── taches.tsx            # Sub-tabs: todos, notes
│   │   ├── moi.tsx               # Sub-tabs: santé, respiration, méditation, défis
│   │   └── flowi.tsx             # Sub-tabs: coach, XP
│   └── onboarding.tsx            # Onboarding flow
├── components/
│   ├── ui/
│   │   ├── SwipeTask.tsx         # Swipeable task row
│   │   ├── DateNavBar.tsx        # Navigation par date (Tâches)
│   │   ├── WeekSwiper.tsx        # Swipe semaine/mois
│   │   ├── EventChip.tsx         # Chips RDV calendrier
│   │   ├── FlowiVoice.tsx        # Phrase contextuelle Flowi
│   │   ├── EnergyCheckin.tsx     # Modal check-in 3x/jour
│   │   ├── TimerCircle.tsx       # Cercle SVG Focus + Méditation
│   │   ├── LotusIcon.tsx         # Animation logo
│   │   ├── BottomSheet.tsx       # Modal bottom sheet générique
│   │   └── SectionLabel.tsx      # En-têtes de section uniformes
│   ├── modals/
│   │   ├── EventEditModal.tsx    # Édition RDV
│   │   ├── DayViewModal.tsx      # Horaire jour (depuis semaine/cal)
│   │   └── PrioPickerModal.tsx   # Sélecteur priorités
│   └── screens/
│       ├── AccueilScreen.tsx
│       ├── AgendaScreen.tsx
│       ├── RoutinesScreen.tsx
│       ├── FocusScreen.tsx
│       ├── SemaineScreen.tsx
│       ├── CalendrierScreen.tsx
│       ├── BilanScreen.tsx
│       ├── TodosScreen.tsx
│       ├── NotesScreen.tsx
│       ├── SanteScreen.tsx
│       ├── RespirationScreen.tsx
│       ├── MeditationScreen.tsx
│       ├── DefisScreen.tsx
│       ├── CoachScreen.tsx
│       └── RecompensesScreen.tsx
├── store/
│   ├── index.ts                  # Zustand store principal
│   ├── slices/
│   │   ├── todos.ts
│   │   ├── events.ts
│   │   ├── habits.ts
│   │   ├── energy.ts
│   │   ├── routines.ts
│   │   ├── focus.ts
│   │   ├── meditation.ts
│   │   └── user.ts
│   └── persist.ts                # Persistance AsyncStorage/MMKV
├── services/
│   ├── api.ts                    # Appels Anthropic via Worker
│   ├── notifications.ts          # Expo Notifications
│   └── audio.ts                  # Sons méditation
├── hooks/
│   ├── useSwipeNav.ts
│   ├── useEnergyCheckin.ts       # Logique 3 check-ins/jour
│   ├── useFlowiVoice.ts          # Messages contextuels
│   └── useDateNav.ts
├── constants/
│   ├── colors.ts                 # Palette Flowi unifiée
│   ├── typography.ts             # Inter + Playfair Display
│   ├── spacing.ts                # Espacements standardisés
│   └── categories.ts             # Catégories RDV
├── utils/
│   ├── date.ts                   # Helpers date fuseau local
│   ├── xp.ts                     # Logique XP/niveaux
│   └── id.ts                     # Générateur ID unique
└── assets/
    └── fonts/
        ├── Inter-*.ttf
        └── PlayfairDisplay-*.ttf
```

---

## Modèles de données

### Todo
```typescript
interface Todo {
  id: string;
  text: string;
  done: boolean;
  priority: 'urgente' | 'haute' | 'normale' | 'basse';
  due: string | null;           // YYYY-MM-DD
  scheduledDate: string;        // YYYY-MM-DD
  doneDate: string | null;      // YYYY-MM-DD
  rolledOver: boolean;
  createdAt: string;
}
```

### Event (RDV)
```typescript
interface Event {
  id: string;
  title: string;
  date: string;                 // YYYY-MM-DD
  time: string | null;          // HH:mm
  endTime: string | null;       // HH:mm (durée par défaut 1h)
  category: 'travail' | 'sante' | 'social' | 'perso' | 'autre';
  note: string | null;
  done: boolean;
}
```

### Habit
```typescript
interface Habit {
  id: string;
  label: string;
  icon: string;
  done: Record<string, boolean>; // { 'YYYY-MM-DD': true }
}
```

### EnergyLog
```typescript
interface EnergyLog {
  [key: string]: number;        // 'YYYY-MM-DD-matin|apresmidi|soir': 1-5
                                // 'YYYY-MM-DD': valeur du jour (dernière saisie)
}
```

---

## Navigation

### Structure de navigation
```
Root Stack
├── Onboarding (si !onboarded)
└── App (tabs)
    ├── 🏠 Accueil
    ├── 📅 Aujourd'hui → Top Tabs (Agenda | Routines)
    ├── ⏱ Focus
    ├── 📆 Planning → Top Tabs (Semaine | Calendrier | Bilan)
    ├── ✅ Tâches → Top Tabs (Tâches | Notes)
    ├── 💚 Moi → Top Tabs (Santé | Respiration | Méditation | Défis)
    └── 🧠 Flowi → Top Tabs (Chat | Plan | Décomposer | XP)
```

### Bottom Tab Bar
- 7 onglets avec icônes emoji
- Couleur active par section (palette PM existante)
- Badge sur Tâches si tâches en retard
- Haptic feedback au changement d'onglet

---

## Gestion d'état — Zustand

Remplacer tous les `useState` du composant monolithique par un store Zustand avec persistance MMKV.

```typescript
// store/index.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'flowi-store' });

export const useFlowiStore = create(
  persist(
    (set, get) => ({
      // Todos
      todos: [] as Todo[],
      addTodo: (todo) => set(s => ({ todos: [...s.todos, todo] })),
      completeTodo: (id) => set(s => ({ ... })),
      
      // Events
      events: [] as Event[],
      addEvent: (event) => set(s => ({ events: [...s.events, event] })),
      
      // Energy
      energyLog: {} as EnergyLog,
      setEnergy: (key, value) => set(s => ({
        energyLog: { ...s.energyLog, [key]: value }
      })),
      
      // ... autres slices
    }),
    {
      name: 'flowi-storage',
      storage: createJSONStorage(() => ({
        getItem: (key) => storage.getString(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
        removeItem: (key) => storage.delete(key),
      })),
    }
  )
);
```

---

## Gestes natifs

### SwipeTask (remplace le composant web)
```typescript
// Utiliser react-native-gesture-handler + Reanimated
import { Swipeable } from 'react-native-gesture-handler';

// Swipe gauche → Compléter (vert)
// Swipe droite → Supprimer (rouge)
// Haptic feedback sur completion
```

### Swipe de navigation (Semaine/Calendrier)
```typescript
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const swipe = Gesture.Pan()
  .onEnd((e) => {
    if (e.translationX < -50) goNext();
    if (e.translationX > 50) goPrev();
  });
```

---

## Animations

### Transitions entre onglets
```typescript
// Reanimated + FadeIn/SlideIn
import { FadeIn, SlideInRight } from 'react-native-reanimated';

// Chaque screen s'anime à l'entrée
entering={FadeIn.duration(220)}
```

### Timer Focus (cercle SVG → react-native-svg)
```typescript
import { Circle, Svg } from 'react-native-svg';
import Animated, { useAnimatedProps } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
// strokeDashoffset animé avec useAnimatedProps
```

### Check-in énergie (Modal animé)
```typescript
// Bottom sheet animé au démarrage de l'app
import BottomSheet from '@gorhom/bottom-sheet';
```

---

## Notifications push (Expo)

```typescript
// services/notifications.ts

// 1. Check-in énergie — 3x par jour
scheduleNotification({
  content: { title: 'Flowi 🌿', body: 'Comment tu te sens cet après-midi ?' },
  trigger: { hour: 13, minute: 0, repeats: true }
});

// 2. Rappels RDV — 15 min avant
scheduleEventReminder(event);

// 3. Streak habitudes — soir si non cochées
scheduleHabitReminder();
```

---

## Service API Anthropic

Toutes les requêtes passent par le Cloudflare Worker existant pour protéger la clé API.

```typescript
// services/api.ts
const WORKER_URL = 'https://your-worker.workers.dev';

export async function fetchFlowi(prompt: string): Promise<string> {
  const res = await fetch(`${WORKER_URL}/api/claude`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}
```

### Points d'entrée API dans l'app
| Feature | Prompt | Output |
|---------|--------|--------|
| Oracle (pensée du jour) | Génère une pensée inspirante | Texte libre |
| Plan du jour Flowi | JSON: message, focus, suggestions, conseil | JSON parsé |
| Décomposer une tâche | JSON: intro + steps | JSON parsé |
| Chat Coach | Conversation libre | Texte libre |
| Guidance méditation | 3-5 phrases selon type + énergie | Texte libre |
| Insight note | Question ouverte sur contenu | Texte libre |
| Emoji habitude | Emoji adapté au label | 1 caractère |

---

## Audio (Méditation)

```typescript
// services/audio.ts — Remplace Web Audio API
import { Audio } from 'expo-av';

export async function playBell() {
  const { sound } = await Audio.Sound.createAsync(
    require('@/assets/sounds/bell.mp3')
  );
  await sound.playAsync();
}

// Générer le son de cloche programmatiquement si pas d'asset :
// Utiliser expo-av avec un buffer audio généré (528Hz → 440Hz, fondu 2.5s)
```

---

## Spécificités mobiles à implémenter

### 1. Clavier et champs de saisie
- `KeyboardAvoidingView` sur tous les écrans avec inputs
- `ScrollView` avec `keyboardShouldPersistTaps="handled"`
- `returnKeyType` adapté (next, done, search)

### 2. Safe Area
- `SafeAreaProvider` + `SafeAreaView` pour les encoches iOS
- Padding bottom pour la home bar iOS

### 3. Date/Time pickers natifs
- Remplacer `<input type="date">` par `@react-native-community/datetimepicker`
- Remplacer `<input type="time">` par le même package
- Sur iOS : modale, sur Android : dialogue natif

### 4. Fonts
```typescript
// app/_layout.tsx
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_900Black } from '@expo-google-fonts/inter';
import { PlayfairDisplay_700Bold, PlayfairDisplay_900Black_Italic } from '@expo-google-fonts/playfair-display';
```

### 5. Retour haptic
```typescript
import * as Haptics from 'expo-haptics';

// Compléter une tâche
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Swipe
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Bouton principal
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
```

### 6. Splash screen animé
- Logo Lotus animé comme dans l'onboarding web
- `expo-splash-screen` avec animation custom

---

## Palette de couleurs (constants/colors.ts)

```typescript
export const colors = {
  // Accents par section
  agenda:    { accent: '#3B82F6', light: '#EFF6FF', border: '#BAD8FB', text: '#1E3A8A' },
  focus:     { accent: '#6366F1', light: '#EEF2FF', border: '#C7D2FE', text: '#3730A3' },
  planning:  { accent: '#8B5CF6', light: '#F5F3FF', border: '#DDD6FE', text: '#4C1D95' },
  todos:     { accent: '#C4961A', light: '#FFFBEB', border: '#F0D080', text: '#78480A' },
  moi:       { accent: '#10B981', light: '#ECFDF5', border: '#A7F3D0', text: '#065F46' },
  flowi:     { accent: '#6D28D9', light: '#EDE9FE', border: '#C4B5FD', text: '#4C1D95' },
  
  // Priorités
  urgente: '#DC2626',
  haute:   '#EA580C',
  normale: '#3B82F6',
  basse:   '#16A34A',
  
  // Neutres
  bg:      '#FAFBFF',
  surface: '#FFFFFF',
  border:  '#E8EDF5',
  text:    '#1F2937',
  muted:   '#9CA3AF',
  subtle:  '#B0A090',
};
```

---

## Étapes de développement recommandées

### Phase 1 — Infrastructure (2-3 jours)
1. Initialiser le projet Expo avec TypeScript
2. Configurer EAS Build (dev, preview, production)
3. Installer toutes les dépendances
4. Mettre en place le store Zustand + persistance MMKV
5. Configurer la navigation Expo Router (tabs + sub-tabs)
6. Charger les fonts
7. Créer les constants (colors, typography, spacing)

### Phase 2 — Composants de base (2-3 jours)
1. `SwipeTask` avec Gesture Handler + Reanimated
2. `BottomSheet` générique (Gorhom)
3. `SectionLabel`, `EnergyCheckin`, `TimerCircle`
4. `DateTimePicker` wrapper natif
5. `FlowiVoice` composant
6. Navigation par swipe (semaine/calendrier)

### Phase 3 — Écrans (5-7 jours)
Implémenter chaque écran dans l'ordre de priorité utilisateur :
1. Accueil + Onboarding
2. Aujourd'hui (Agenda + Routines)
3. Tâches + navigation par date
4. Focus (timer immersif)
5. Planning (Semaine + Calendrier)
6. Moi (Santé, Respiration, Méditation, Défis)
7. Flowi (Chat, Plan, Décomposer, XP)
8. Notes

### Phase 4 — Services natifs (1-2 jours)
1. Service API Anthropic (via Worker)
2. Notifications push (check-in, rappels RDV, streaks)
3. Audio méditation
4. Haptic feedback partout

### Phase 5 — Polish (2-3 jours)
1. Animations d'entrée sur chaque écran
2. Splash screen avec logo Lotus animé
3. Mode sombre (déjà supporté via filtre invert)
4. Tests sur iOS Simulator + Android Emulator
5. Optimisations performance (FlatList, memo, useCallback)

### Phase 6 — Déploiement (1-2 jours)
1. Icône app + splash screen assets
2. `app.json` metadata (nom, bundle ID, permissions)
3. `eas build --platform all --profile production`
4. `eas submit` vers App Store Connect + Google Play Console

---

## Configuration EAS (eas.json)

```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "YOUR_APPLE_ID",
        "ascAppId": "YOUR_APP_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./service-account.json"
      }
    }
  }
}
```

---

## app.json (configuration Expo)

```json
{
  "expo": {
    "name": "Flowi",
    "slug": "flowi",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "flowi",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "backgroundColor": "#1E1B4B"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.flowi.app",
      "infoPlist": {
        "NSUserNotificationsUsageDescription": "Flowi utilise les notifications pour tes rappels de check-in énergie et tes rendez-vous."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1E1B4B"
      },
      "package": "com.flowi.app",
      "permissions": ["NOTIFICATIONS", "RECEIVE_BOOT_COMPLETED"]
    },
    "plugins": [
      "expo-router",
      "expo-font",
      ["expo-notifications", {
        "icon": "./assets/notification-icon.png",
        "color": "#6366F1"
      }]
    ]
  }
}
```

---

## Dépendances (package.json)

```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "expo-router": "~3.5.0",
    "expo-font": "~12.0.0",
    "expo-notifications": "~0.28.0",
    "expo-haptics": "~13.0.0",
    "expo-av": "~14.0.0",
    "expo-splash-screen": "~0.27.0",
    "react-native": "0.74.0",
    "react-native-gesture-handler": "~2.16.0",
    "react-native-reanimated": "~3.10.0",
    "react-native-safe-area-context": "4.10.0",
    "react-native-screens": "3.31.0",
    "react-native-svg": "15.2.0",
    "react-native-mmkv": "2.12.2",
    "@react-native-async-storage/async-storage": "1.23.1",
    "@react-native-community/datetimepicker": "8.0.1",
    "@gorhom/bottom-sheet": "^4.6.0",
    "zustand": "^4.5.0",
    "react-native-calendars": "^1.1305.0",
    "@expo-google-fonts/inter": "^0.2.3",
    "@expo-google-fonts/playfair-display": "^0.2.3"
  }
}
```

---

## Points d'attention pour Claude Code

1. **Fuseau horaire** — utiliser `new Date()` avec `.getFullYear()/.getMonth()/.getDate()` (pas `.toISOString()`) partout pour éviter les problèmes UTC.

2. **Modèle API** — utiliser `claude-sonnet-4-5` pour tous les appels Anthropic.

3. **Logique métier** — toute la logique est dans `agenda-sync.jsx`. La migration consiste à extraire chaque section dans son composant/screen correspondant sans changer la logique.

4. **SwipeTask** — le geste de swipe est central à l'UX. S'assurer que le seuil (50px touch, 80px souris) est adapté au mobile (50px touch suffit).

5. **Persistance** — les clés localStorage actuelles sont préfixées `as_`. Mapper vers MMKV avec les mêmes clés pour faciliter d'éventuelles migrations.

6. **Images/médias** — le scan d'agenda papier (📷) utilise `expo-camera` + `expo-image-picker`.

7. **Dark mode** — actuellement via `filter: invert(1) hue-rotate(180deg)`. Sur mobile, utiliser `useColorScheme` de React Native et un système de thème propre.

8. **Performance** — remplacer les `.map()` dans les listes longues par `FlatList` avec `keyExtractor` et `getItemLayout` pour les listes de tâches.

---

## Fichier source de référence

Le fichier `agenda-sync.jsx` (~5000 lignes) contient toute la logique de l'application. Il est organisé comme suit :

- **Lignes 1-35** : Imports, constantes globales (TODAY, TOMORROW, helpers)
- **Lignes 36-520** : Composants utilitaires (SwipeTask, MoodBlob, LotusIcon, ScanModal)
- **Lignes 521-900** : States et helpers principaux dans `App()`
- **Lignes 900-1300** : Fonctions métier (addTodo, addEvent, completeTodo, earnXp, etc.)
- **Lignes 1300-3600** : `renderSection()` — rendu de chaque onglet
- **Lignes 3600-4200** : `renderRight()` — contenu panneau secondaire (à fusionner dans renderSection)
- **Lignes 4200-5027** : Rendu principal, modaux, navigation

---

*Plan généré pour Flowi v1.0 — Thomas Gagnon*
*Référence : gagnonthomas/flowy*
