# 🚀 Guide d'Installation Rapide - Ariba Flashcards

## ⚠️ PRÉREQUIS OBLIGATOIRE : Node.js

**IMPORTANT** : Vous devez installer Node.js avant de pouvoir utiliser cette application.

### 📥 Installation de Node.js

#### Option 1 : Site Officiel (Recommandé)
1. **Visitez** : https://nodejs.org/
2. **Téléchargez** la version **LTS** (Long Term Support)
3. **Exécutez** l'installateur téléchargé
4. **Suivez** les instructions d'installation
5. **Redémarrez** votre terminal/VS Code

#### Option 2 : Windows Package Manager (si disponible)
```powershell
# Via Chocolatey
choco install nodejs

# Via Scoop
scoop install nodejs

# Via Winget
winget install OpenJS.NodeJS
```

### ✅ Vérification de l'Installation

Après installation, ouvrez un nouveau terminal et vérifiez :

```powershell
# Vérifier Node.js
node --version
# Doit afficher : v18.x.x ou v20.x.x

# Vérifier NPM
npm --version
# Doit afficher : 9.x.x ou 10.x.x
```

### 🔧 Installation des Dépendances du Projet

Une fois Node.js installé, exécutez ces commandes dans le terminal VS Code :

```powershell
# 1. Installer toutes les dépendances
npm install

# 2. Démarrer le serveur de développement
npm run dev

# 3. Ouvrir votre navigateur sur : http://localhost:3000
```

### 🎯 Scripts Disponibles

```powershell
# Développement
npm run dev          # Serveur de développement avec hot reload
npm run build        # Build de production
npm run preview      # Prévisualisation du build

# Tests et Qualité
npm run test         # Tests unitaires
npm run lint         # Vérification du code
npm run typecheck    # Vérification TypeScript
```

### 🔧 Résolution de Problèmes

#### Erreur "npx n'est pas reconnu"
- **Cause** : Node.js n'est pas installé ou pas dans le PATH
- **Solution** : Installer Node.js et redémarrer VS Code

#### Erreur "npm install" échoue
- **Cause** : Cache npm corrompu
- **Solution** :
  ```powershell
  npm cache clean --force
  npm install
  ```

#### Port 3000 déjà utilisé
- **Solution** : Le serveur utilisera automatiquement le port suivant disponible

### 📋 Checklist d'Installation

- [ ] Node.js installé (version 18+ recommandée)
- [ ] NPM fonctionne dans le terminal
- [ ] `npm install` exécuté avec succès
- [ ] `npm run dev` démarre sans erreur
- [ ] Application accessible sur http://localhost:3000

### 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifiez que Node.js est correctement installé
2. Redémarrez VS Code après l'installation
3. Consultez les logs d'erreur dans le terminal
4. Vérifiez les issues GitHub du projet

---

**🎉 Une fois Node.js installé, Ariba Flashcards sera prêt à fonctionner !**
