# Flowi — Plan de développement mobile pour Claude Code

## Contexte

Flowi est une application de planification quotidienne orientée bien-être, conçue pour les cerveaux actifs (TDAH-friendly). Le prototype web existe dans `agenda-sync.jsx` (~5000 lignes) comme référence de logique métier. L'app mobile est construite avec **Expo + React Native** et est en développement actif.

---

## Stack technologique (actuel)

| Couche | Technologie | Notes |
|--------|-------------|-------|
| Framework | **Expo SDK 55** | New Architecture activée |
| Navigation | **Expo Router** (file-based) | Navigation native, deep links |
| UI | **React Native 0.83** + StyleSheet | Performance native |
| Stockage local | **AsyncStorage** (web: localStorage) | MMKV installé mais non utilisé (crash Expo Go) |
| État global | **Zustand 5** + persist middleware | Store unique avec selectors individuels |
| API IA | **Anthropic API** via Cloudflare Worker | À connecter (Phase 4) |
| Notifications | **Expo Notifications** | Installé, à implémenter (Phase 4) |
| Gestures | **React Native Gesture Handler** | SwipeTask, swipe navigation Planning |
| Animations | **React Native Reanimated 4** | Breathing bubble, Focus timer, entrées animées |
| Fonts | **expo-font** + Google Fonts | Inter (4 weights) + Playfair Display (2 weights) |
| Audio | **expo-av** | Installé, à implémenter (Phase 4) |
| Haptics | **expo-haptics** | Actif sur toutes les interactions clés |
| Compilation | **React Compiler** (babel plugin) | Memoization automatique |
| Déploiement | **EAS Build + EAS Submit** | CI via GitHub Actions (tags v*) |

---

## Architecture des fichiers (actuel)

```
flowy/
├── app/                          # Expo Router pages
│   ├── _layout.tsx               # Root layout (fonts, GestureHandler, SafeArea)
│   ├── index.tsx                 # Redirect → onboarding ou (tabs)/accueil
│   ├── onboarding.tsx            # Onboarding 5 étapes
│   └── (tabs)/                   # Bottom tab navigation (7 onglets)
│       ├── _layout.tsx           # Tab bar config avec haptics
│       ├── accueil.tsx           # Dashboard, XP, stats du jour
│       ├── aujourdhui.tsx        # Sub-tabs: Agenda | Routines
│       ├── focus.tsx             # Timer SVG animé avec presets
│       ├── planning.tsx          # Sub-tabs: Semaine | Calendrier | Bilan
│       ├── taches.tsx            # Sub-tabs: Tâches | Notes (FlatList)
│       ├── moi.tsx               # Sub-tabs: Santé | Respiration | Méditation | Défis
│       └── flowi.tsx             # Sub-tabs: Coach (FlatList) | XP (FlatList)
├── src/
│   ├── components/
│   │   ├── FlowerLogo.tsx        # Logo animé SVG (splash/onboarding)
│   │   └── ui/
│   │       ├── SwipeTask.tsx     # Swipe gauche=compléter, droite=supprimer
│   │       ├── SectionLabel.tsx  # En-têtes de section avec badge count
│   │       ├── EnergyCheckin.tsx # Modal check-in énergie (5 niveaux)
│   │       ├── BreathingTimer.tsx # 5 exercices, bulle animée, phases
│   │       ├── MeditationTimer.tsx # 4 types, cercle SVG, prompts rotatifs
│   │       └── TimePicker.tsx    # iOS: modal spinner, Android: dialog natif
│   ├── store/
│   │   └── index.ts             # Zustand store + AsyncStorage persist
│   ├── types/
│   │   └── index.ts             # Todo, Event, Habit, Routine, etc.
│   ├── constants/
│   │   ├── colors.ts            # Palette par section + priorités + dark
│   │   ├── typography.ts        # Familles et tailles de police
│   │   └── spacing.ts           # Espacements et border radius
│   └── utils/
│       ├── date.ts              # Helpers date (getToday, formatTime, MONTHS_FR)
│       └── id.ts                # generateId()
├── assets/                      # Icônes et splash
├── app.json                     # Config Expo
├── eas.json                     # Config EAS Build/Submit
├── babel.config.js              # React Compiler + Worklets plugins
├── metro.config.js              # Metro bundler config
└── tsconfig.json                # Paths: @/* → ./src/*
```

---

## État d'avancement

### Phase 1 — Infrastructure ✅
- Expo SDK 55 + TypeScript + Expo Router
- Zustand store avec AsyncStorage (web: localStorage)
- 7 onglets avec sub-tabs locales
- Fonts Inter + Playfair Display chargées
- Constants (colors, typography, spacing)

### Phase 2 — Composants de base ✅
- SwipeTask intégré dans tâches et agenda (hints masqués par défaut)
- BreathingTimer (5 exercices, bulle Reanimated, phases, XP)
- MeditationTimer (4 types, cercle SVG, prompts, XP)
- TimePicker natif (iOS modal spinner, Android dialog)
- Swipe navigation semaine/mois dans Planning (runOnJS worklets)
- SectionLabel, EnergyCheckin

### Phase 3 — Écrans ✅ (structure en place)
- Tous les 7 écrans sont fonctionnels avec données réelles
- Onboarding 5 étapes (nom, TDAH, objectif)
- Focus timer avec cercle SVG animé et presets

### Performance ✅
- Zustand selectors individuels `(s) => s.xxx` dans tous les screens
- React Compiler activé (memoization automatique)
- FlatList pour listes longues (todos, notes, coach, XP log)

### Phase 4 — Services natifs (À FAIRE)
1. **API Anthropic** — connecter le coach chat, plan du jour, décomposer tâches
2. **Notifications push** — check-in énergie 3x/jour, rappels RDV, streaks
3. **Audio méditation** — cloche début/fin via expo-av
4. **Haptic feedback** — déjà en place sur la plupart des interactions

### Phase 5 — Polish (À FAIRE)
1. Splash screen animé avec logo Lotus
2. Mode sombre (utiliser `useColorScheme` + thème propre)
3. Tests sur iOS Simulator + Android Emulator

### Phase 6 — Déploiement (À FAIRE)
1. Icône app + splash screen assets finaux
2. `eas build --platform all --profile production`
3. `eas submit` via GitHub Actions (déclenché par tag v*)

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
  rolledOver?: boolean;
  createdAt?: string;
}
```

### Event (RDV)
```typescript
interface Event {
  id: string;
  title: string;
  date: string;                 // YYYY-MM-DD
  time: string | null;          // HH:mm
  endTime: string | null;       // HH:mm
  category: 'rdv' | 'tache' | 'perso' | 'sante' | 'famille';
  note?: string | null;
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

### Routine
```typescript
interface Routine {
  id: string;
  name: string;
  emoji: string;
  color: string;
  blocks: { id: string; label: string; emoji: string; dur: number; color: string }[];
}
```

---

## Navigation

```
Root Stack
├── index.tsx → Redirect (onboarded ? accueil : onboarding)
├── onboarding.tsx
└── (tabs)/
    ├── 🏠 Accueil          — Dashboard, XP, stats
    ├── 📅 Aujourd'hui      — Sub-tabs: Agenda | Routines
    ├── ⏱ Focus             — Timer SVG animé
    ├── 📆 Planning         — Sub-tabs: Semaine | Calendrier | Bilan
    ├── ✅ Tâches           — Sub-tabs: Tâches | Notes
    ├── 💚 Moi              — Sub-tabs: Santé | Respiration | Méditation | Défis
    └── 🧠 Flowi            — Sub-tabs: Coach | Plan | Décomposer | XP
```

---

## Points d'attention pour Claude Code

1. **Fuseau horaire** — utiliser `new Date()` avec `.getFullYear()/.getMonth()/.getDate()` (pas `.toISOString()`) pour éviter les problèmes UTC. Helpers dans `src/utils/date.ts`.

2. **Zustand selectors** — toujours utiliser des selectors individuels : `useFlowiStore((s) => s.todos)`, jamais de destructuration du store entier.

3. **Gestures worklets** — les callbacks `onEnd` des gestures Reanimated s'exécutent sur le UI thread. Utiliser `runOnJS()` pour appeler des setters React ou Haptics.

4. **MMKV vs AsyncStorage** — MMKV est installé mais crash sur Expo Go (NitroModules). Le store utilise AsyncStorage sur native et localStorage sur web. Pour passer à MMKV, il faudra un dev build (`npx expo run:ios`).

5. **expo-haptics** — ne PAS ajouter dans `app.json` plugins (pas un config plugin).

6. **Logique métier** — `agenda-sync.jsx` reste la référence pour extraire la logique restante (grocery, budget, voyages, brain dump, etc.).

7. **Performance** — React Compiler est activé. Utiliser FlatList pour les listes qui grandissent. Les petites listes bornées (habitudes, routines, événements du jour) restent en `.map()`.

8. **CI/CD** — GitHub Actions déclenché sur tags `v*` uniquement. Type check avant build EAS.

---

## Fichier source de référence

Le fichier `agenda-sync.jsx` (~5000 lignes) contient toute la logique du prototype web :

- **Lignes 1-35** : Imports, constantes globales (TODAY, TOMORROW, helpers)
- **Lignes 36-520** : Composants utilitaires (SwipeTask, MoodBlob, LotusIcon, ScanModal)
- **Lignes 521-900** : States et helpers principaux dans `App()`
- **Lignes 900-1300** : Fonctions métier (addTodo, addEvent, completeTodo, earnXp, etc.)
- **Lignes 1300-3600** : `renderSection()` — rendu de chaque onglet
- **Lignes 3600-4200** : `renderRight()` — contenu panneau secondaire
- **Lignes 4200-5027** : Rendu principal, modaux, navigation

---

*Flowi v1.0 — Thomas Gagnon*
*Référence : gagnonthomas/flowy*
