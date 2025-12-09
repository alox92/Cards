# VS Code Setup Guide

Ce workspace est configuré pour **Cards** - Application de cartes flash React + Vite + TypeScript + Tailwind + Vitest + Playwright.

## 🎯 Extensions installées

Toutes les extensions recommandées sont **déjà installées** :

- ✅ **ESLint** - Linting JavaScript/TypeScript
- ✅ **Prettier** - Formatage automatique du code
- ✅ **Tailwind CSS IntelliSense** - Autocomplétion classes Tailwind (y compris clsx/cx)
- ✅ **Vitest** - Test runner intégré avec UI
- ✅ **Playwright Test** - Tests E2E
- ✅ **Error Lens** - Erreurs inline très visibles
- ✅ **DotENV** - Syntaxe fichiers .env
- ✅ **EditorConfig** - Cohérence du formatage
- ✅ **GitLens** - Git supercharged (déjà installé)
- ✅ **markdownlint** - Linting des fichiers Markdown
- ✅ **PostCSS Language Support** - Syntaxe PostCSS moderne
- ✅ **Code Spell Checker** - Vérification orthographique (en/fr)

## ⚙️ Configuration active

### Formatage & Linting

- **Format on Save** activé avec Prettier
- **ESLint auto-fix** au save (mode "explicit")
- TypeScript du workspace utilisé (`node_modules/typescript/lib`)

### Tailwind CSS

- IntelliSense actif pour `clsx()` et `cx()`
- Validation CSS native désactivée (Tailwind gère)

### Tests

- **Vitest** : commande par défaut `npm run test:run`
- **Playwright** : traces ouvertes on-demand

### Spell Checker

- Langues : anglais + français
- Vocabulaire projet : Vitest, Playwright, dexie, zustand, katex, etc.

## 🚀 Commandes rapides

### Via Terminal > Run Task

1. **`npm: dev`** - Démarre le serveur Vite (<http://127.0.0.1:5173>)
2. **`npm: build`** - Build de production avec type-check
3. **`npm: test (UI)`** - Interface Vitest interactive
4. **`npm: test (run)`** - Tests en mode watch
5. **`npm: test (fast)`** - Tests rapides (skip heavy)
6. **`npm: e2e`** - Tests Playwright E2E
7. **`npm: perf:smoke`** - Tests de performance smoke

### Via Run and Debug (F5)

1. **Chrome: Vite app** - Lance le dev server + ouvre Chrome avec debugger
2. **Vitest: Debug Current File** - Debug le fichier de test ouvert

## 💡 Tips d'utilisation

### Lancer le dev en arrière-plan

```powershell
npm run dev
```

Le serveur démarre sur <http://127.0.0.1:5173>

### Débugger l'app React

1. Lance le task `npm: dev` ou appuie sur **F5**
2. Place des breakpoints dans ton code TypeScript/TSX
3. Le debugger Chrome s'attache automatiquement

### Tests Vitest

- **Mode UI** : `Terminal > Run Task > npm: test (UI)`
- **Mode watch** : `npm run test`
- **Debug test** : Ouvre un fichier `.test.ts`, appuie sur F5, choisis "Vitest: Debug Current File"

### Tests E2E Playwright

1. Assure-toi que le dev server tourne (`npm run dev`)
2. Lance `Terminal > Run Task > npm: e2e`
3. Les traces s'ouvrent automatiquement en cas d'échec

### Tailwind IntelliSense

- Autocomplétion dans les className
- Fonctionne aussi dans `clsx()` et `cx()` grâce au classRegex
- Hover pour voir les styles CSS générés

### Error Lens

- Les erreurs/warnings apparaissent **inline** à la fin de chaque ligne
- Très utile pour repérer rapidement les problèmes TypeScript/ESLint

## 📁 Structure `.vscode/`

```text
.vscode/
├── extensions.json   # Recommandations d'extensions
├── settings.json     # Config éditeur (TS, ESLint, Tailwind, etc.)
├── tasks.json        # Tâches npm disponibles
├── launch.json       # Configurations de debug
└── README.md         # Ce fichier
```

## 🔧 Personnalisation

### Changer le formatage auto

Dans `settings.json`, modifie :

```json
"editor.formatOnSave": false
```

### Désactiver Error Lens

Dans `settings.json`, ajoute :

```json
"errorLens.enabled": false
```

### Ajouter des mots au dictionnaire

Dans `settings.json`, section `cSpell.words`, ajoute tes termes.

## 🐛 Troubleshooting

### "Module not found" dans les imports

- Vérifie que tu as exécuté `npm ci` ou `npm install`
- Recharge la fenêtre VS Code : `Ctrl+Shift+P` > "Reload Window"

### ESLint ne fix pas au save

- Vérifie que l'extension ESLint est activée
- Ouvre la sortie ESLint : `View > Output > ESLint`

### Les tests ne se lancent pas

- Vérifie que Vitest est installé : `npm ci`
- Redémarre l'extension Vitest : Command Palette > "Vitest: Restart"

### Playwright ne trouve pas le serveur

- Lance manuellement `npm run dev` avant `npm: e2e`
- Vérifie que le port 5173 est libre

## ✨ Prochaines étapes suggérées

1. **Explore le mode UI Vitest** : meilleure expérience de test
2. **Configure Playwright UI** : `npx playwright test --ui` pour explorer les traces
3. **Ajoute des snippets perso** : `File > Preferences > Configure User Snippets`
4. **Active Copilot/Cursor** si disponible pour l'autocomplete AI

---

**Bon développement !** 🚀
