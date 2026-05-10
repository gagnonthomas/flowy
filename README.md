# Flowi

Application mobile iOS construite avec React Native et Expo.

## Developpement local

```bash
npm install
npx expo start
```

Scannez le QR code avec l'app **Expo Go** sur votre iPhone/iPad, ou appuyez sur `w` pour ouvrir dans le navigateur.

## Architecture du projet

```
.
├── App.tsx                  # Composant principal
├── app.json                 # Configuration Expo
├── eas.json                 # Configuration EAS Build/Submit
├── package.json             # Dependances
├── tsconfig.json            # Configuration TypeScript
├── assets/                  # Icones et images
└── .github/workflows/
    └── eas-build-ios.yml    # CI/CD: Build iOS + TestFlight
```

## CI/CD - Build iOS et TestFlight

Le workflow GitHub Actions (`.github/workflows/eas-build-ios.yml`) se declenche automatiquement a chaque push sur `main` ou manuellement depuis l'onglet Actions.

**Pipeline :**
1. Installation des dependances
2. Build iOS via EAS Build (serveurs cloud Expo)
3. Soumission automatique a TestFlight

Le build se fait sur les serveurs d'Expo (pas besoin de runner macOS).

## Prerequisites - Configuration des comptes

### 1. Compte Apple Developer

1. Aller sur https://developer.apple.com/account/
2. S'inscrire au Apple Developer Program (99 USD/an)
3. Attendre l'approbation (24-48h)
4. Noter votre **Team ID** (visible dans Membership)

### 2. Cle API App Store Connect

1. Aller sur https://appstoreconnect.apple.com/access/integrations/api
2. Cliquer "+" pour generer une nouvelle cle
3. Nom : "GitHub Actions EAS"
4. Role : **App Manager**
5. Telecharger le fichier `.p8` (une seule fois possible)
6. Noter le **Key ID** et le **Issuer ID**

### 3. Compte Expo / EAS

1. Creer un compte sur https://expo.dev/signup
2. Aller dans Settings > Access Tokens
3. Creer un token personnel nomme "GitHub Actions"
4. Copier la valeur du token

### 4. Secrets GitHub

Dans votre repo GitHub : Settings > Secrets and variables > Actions, ajouter :

| Secret | Description |
|--------|-------------|
| `EXPO_TOKEN` | Token d'acces personnel Expo |
| `ASC_KEY_ID` | ID de la cle API App Store Connect |
| `ASC_ISSUER_ID` | Issuer ID App Store Connect |
| `ASC_KEY_P8_BASE64` | Contenu du fichier .p8 encode en base64 |

Pour encoder le fichier .p8 en base64 :
- **macOS/Linux :** `base64 -i AuthKey_XXXXXXXX.p8`
- **Windows (PowerShell) :** `[Convert]::ToBase64String([IO.File]::ReadAllBytes("AuthKey_XXXXXXXX.p8"))`

## Premiere mise en route

Apres avoir configure les comptes ci-dessus :

```bash
# Se connecter a Expo
npx expo login

# Initialiser le projet EAS
npx eas init

# Configurer les credentials iOS (premiere fois)
npx eas credentials --platform ios
```

Ensuite, enregistrer l'app dans App Store Connect :
1. Aller sur https://appstoreconnect.apple.com
2. Creer une nouvelle app avec :
   - **Bundle ID :** `com.flowi.app`
   - **Nom :** Flowi
   - **SKU :** `flowi001`

Enfin, declencher le premier build en pushant sur `main` ou via l'onglet Actions de GitHub.

## Profils de build EAS

| Profil | Usage |
|--------|-------|
| `development` | Dev client, simulateur iOS |
| `preview` | Distribution interne (install directe sur device) |
| `production` | App Store / TestFlight |
