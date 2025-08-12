# 🎯 Guide d'Utilisation - Cards

## 🚀 Démarrage Rapide

### 1. Installation et Lancement

```bash
# Installation des dépendances
npm install

# Lancement en mode développement
npm run dev

# Build pour production
npm run build
```

L'application démarre avec tous les systèmes d'optimisation activés automatiquement.

### Nouveautés Clés Récentes

| Fonction | Description | Raccourci / Astuce |
|----------|-------------|--------------------|
| Reprise de Session | Reprend automatiquement une session d'étude interrompue (file d'attente restaurée) | Ouvrir de nouveau le deck |
| Timer Étude | Chronométrage temps réel (FPS friendly) | Bouton Toggle dans session |
| Raccourcis Carte | Espace = flip, 0‑4 = qualité réponse | Activables/désactivables en session |
| Flip 3D Physique | Carte recto/verso avec profondeur & vitesse réglable | Réglages > UI avancée |
| Mode Focus | Masque navigation & recherche, interface épurée | Bouton « Mode Focus » (persistant) |
| Palette HSL Dynamique | Génération d’échelle de tons depuis la couleur d’accent | Change accent dans paramètres |
| Presets Thèmes | Solarized, Nord, Dracula, Gruvbox | Sélecteur dans barre supérieure |
| Poids Typographique | Slider global (100–900) appliqué via variable CSS | Réglages > UI avancée |
| Zoom UI Global | Mise à l’échelle fine (0.85–1.25) | Réglages > UI avancée |
| Réduction Motion | Force un mode minimal animations | Réglages > UI avancée |

---

### 2. Premier Lancement

Lors du premier démarrage, l'application :
- Initialise les 7 systèmes d'optimisation
- Crée le profil utilisateur par défaut
- Configure les préférences d'apprentissage
- Charge les decks d'exemple

---

## 🎮 Interface Gamifiée

### Système XP et Niveaux

#### Comment gagner de l'XP :
- **Compléter une carte** : 10-30 XP selon la difficulté
- **Maintenir un streak** : Multiplicateur jusqu'à 3x
- **Finir une session** : Bonus de 50-100 XP
- **Débloquer un achievement** : 25-500 XP selon la rareté
- **Perfection (100%)** : Bonus de 200 XP

#### Niveaux et Prestige :
- **Niveaux 1-50** : Progression normale
- **Niveau 50+** : Système de prestige avec récompenses spéciales
- **Calcul automatique** des seuils avec courbe d'expérience

### Achievements et Récompenses

#### Catégories d'achievements :

**🎯 Débuts** (Common)
- Premier Pas : Compléter la première carte
- Découvreur : Créer le premier deck
- Explorateur : Terminer la première session

**⚡ Vitesse** (Rare)
- Éclair : Répondre en moins de 2 secondes
- Flash : 10 réponses rapides d'affilée
- Sonic : 50 réponses en moins de 3 secondes

**📅 Consistance** (Epic)
- Régulier : 7 jours de streak
- Dévoué : 30 jours de streak
- Champion : 100 jours de streak

**🎯 Précision** (Epic)
- Précis : 90% de précision sur 50 cartes
- Expert : 95% de précision sur 100 cartes
- Maître : 99% de précision sur 200 cartes

**⏰ Timing** (Rare)
- Matinal : Étudier avant 8h
- Nocturne : Étudier après 22h
- Marathon : Session de plus de 2h

**🏆 Performance** (Legendary)
- Perfectionniste : 100% sur 100 cartes
- Légende : Niveau 50 atteint
- Titan : 1000 cartes complétées

---

## 📝 Éditeur de Texte Riche

### Fonctionnalités de Formatage

#### Raccourcis Clavier :
- `Ctrl+B` : **Gras**
- `Ctrl+I` : *Italique*
- `Ctrl+U` : Souligné
- `Ctrl+E` : Emoji picker
- `Ctrl+Shift+C` : Sélecteur de couleur
- `F11` : Mode plein écran

#### Insertion d'Éléments :
1. **Emojis** : Plus de 100 emojis catégorisés
2. **Couleurs** : Palette complète avec codes hex
3. **Liens** : Insertion automatique avec validation
4. **Titres** : H1, H2, H3 avec styles appropriés

#### Modes d'Affichage :
- **Mode normal** : Éditeur compact
- **Mode étendu** : Toolbar complète visible
- **Mode plein écran** : Immersion totale

### Utilisation Avancée

#### Personnalisation :
```tsx
<RichTextEditor
  value={content}
  onChange={setContent}
  features={['bold', 'italic', 'emoji', 'color', 'link']}
  theme="dark"
  maxLength={2000}
  placeholder="Créez votre contenu..."
  allowFullscreen={true}
  showWordCount={true}
  autoFocus={true}
/>
```

#### Gestion du Contenu :
- **Validation automatique** des liens
- **Comptage en temps réel** des mots/caractères
- **Sauvegarde automatique** du brouillon
- **Historique** avec undo/redo

---

## 📊 Statistiques Avancées

### Navigation des Vues

#### Vue d'Ensemble :
- **Métriques clés** : XP, streak, précision, temps
- **Progression visuelle** avec barres animées
- **Comparaison** avec les moyennes
- **Tendances** sur 7/30 jours

#### Vue Détaillée :
- **Graphiques temporels** de performance
- **Analyse par catégorie** de deck
- **Distribution** des temps de réponse
- **Corrélation** précision/vitesse

#### Vue Achievements :
- **Progression** de tous les achievements
- **Statistiques** par catégorie
- **Prochains objectifs** recommandés
- **Historique** des déblocages

#### Vue Prédictions :
- **Projections IA** de performance
- **Recommandations** d'optimisation
- **Analyse comportementale** personnalisée
- **Objectifs suggérés** adaptatifs

### Métriques Détaillées

#### Performance d'Apprentissage :
- **Taux de rétention** par intervalle
- **Courbe d'oubli** personnalisée
- **Efficacité temporelle** des sessions
- **Impact des pauses** sur la mémorisation

#### Analyse Comportementale :
- **Heures optimales** d'étude
- **Durée idéale** des sessions
- **Fréquence** recommandée
- **Types de contenu** préférés

---

## 💡 Système de Conseils IA

### Types de Conseils

#### Personnalisés par IA :
- **Analyse du profil** d'apprentissage
- **Recommandations temporelles** selon les habitudes
- **Optimisations** basées sur les données
- **Corrections** des patterns d'erreur

#### Par Catégorie :

**📚 Étude :**
- Techniques de mémorisation active
- Méthodes de répétition espacée
- Organisation du contenu
- Gestion de la charge cognitive

**🧠 Mémoire :**
- Mnémotechniques personnalisées
- Associations visuelles
- Techniques de rappel
- Consolidation nocturne

**⏱️ Temps :**
- Planification optimale
- Techniques Pomodoro adaptées
- Gestion des pauses
- Rythmes circadiens

**🔥 Motivation :**
- Maintien de l'engagement
- Gestion des échecs
- Célébration des succès
- Objectifs adaptatifs

**⚡ Technique :**
- Optimisations de l'interface
- Raccourcis efficaces
- Workflows personnalisés
- Intégrations avancées

### Utilisation des Conseils

#### Recherche Intelligente :
- **Mots-clés** dans le contenu
- **Filtrage** par catégorie
- **Tri** par pertinence/impact
- **Suggestions** automatiques

#### Système de Favoris :
- **Marquage** des conseils utiles
- **Organisation** personnalisée
- **Rappels** périodiques
- **Partage** avec la communauté

#### Évaluation d'Impact :
- **Notation** de l'efficacité
- **Suivi** de l'application
- **Amélioration** des recommandations
- **Feedback** à l'IA

---

## 🎨 Interface et Micro-Interactions

### Composants Interactifs

#### Boutons avec Effets :
```tsx
// Bouton avec lueur et pulsation
<GlowButton variant="primary" glow pulse>
  Action Importante
</GlowButton>

// Bouton avec chargement
<GlowButton loading loadingText="Traitement...">
  Valider
</GlowButton>
```

#### Cartes Morphing 3D :
```tsx
// Carte retournable pour flashcards
<MorphingCard
  frontContent={question}
  backContent={answer}
  isFlipped={showAnswer}
  onFlip={() => setShowAnswer(!showAnswer)}
/>
```

#### Barres de Progression Liquides :
```tsx
// Progression avec effet liquide
<LiquidProgress
  progress={xpProgress}
  color="#667eea"
  animated
  showWave
  label="XP Progress"
/>
```

### Animations et Transitions

#### Types d'Animations :
- **Scale** : Agrandissement élégant
- **Slide** : Glissement fluide
- **Fade** : Apparition en fondu
- **Spring** : Rebond naturel

#### Configuration :
```tsx
// Animation d'entrée personnalisée
const transition = new FluidTransitionMastery()
await transition.animateIn(element, {
  type: 'spring',
  duration: 400,
  delay: 100,
  easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
})
```

### Feedback Utilisateur

#### Notifications Système :
- **Achievements** : Popup avec confettis
- **Level Up** : Animation de célébration
- **Erreurs** : Messages informatifs
- **Succès** : Confirmations visuelles

#### Sons et Vibrations :
```tsx
// Activation des effets sensoriels
<MicroInteraction
  type="click"
  sound={true}
  haptic={true}
  intensity="medium"
>
  <YourComponent />
</MicroInteraction>
```

---

## ⚙️ Configuration et Paramètres

### Préférences d'Étude

#### Horaires Optimaux :
- **Détection automatique** des pics de performance
- **Rappels intelligents** selon les habitudes
- **Adaptation** aux contraintes personnelles
- **Synchronisation** avec le calendrier

#### Objectifs Personnalisés :
- **Cartes quotidiennes** : Objectif adaptatif
- **Précision cible** : Progression par paliers
- **Temps d'étude** : Recommandations IA
- **Streaks** : Maintien automatique

### Personnalisation Interface

#### Thèmes et Couleurs :
- **Mode sombre/clair** avec transition
- **Couleurs d'accent** personnalisables (palette HSL auto: variables --accent-100..900)
- **Presets**: Solarized / Nord / Dracula / Gruvbox
- **Contrastes** adaptés à la vision (mode High Contrast)
- **Tailles & Zoom**: facteur d'échelle UI global (--ui-scale)
- **Poids de police**: variable --ui-font-weight (100 à 900)
- **Famille de police** personnalisable

#### Animations et Effets :
- **Intensité** des micro-interactions
- **Vitesse** des transitions
- **Particules** et effets visuels
- **Sons** et retour haptique
- **Flip 3D cartes**: profondeur & vitesse ajustables (card3DDepth, cardFlipSpeedMs)
- **Mode réduit motion**: override global (classe .reduced-motion-force)
- **Mode focus**: cache navigation & barre de recherche pour immersion

### Données et Confidentialité

#### Stockage Local :
- **Chiffrement** des données sensibles
- **Sauvegarde** automatique
- **Export** complet des données
- **Import** depuis d'autres sources

#### Synchronisation :
- **Cloud backup** (optionnel)
- **Multi-appareils** avec conflit résolution
- **Partage sélectif** de decks
- **Anonymisation** des analytics

---

## 🔧 Dépannage et Optimisation

### Performance

#### Problèmes Courants :
1. **Lenteur** : Vider le cache navigateur
2. **Memory leak** : Redémarrer l'application
3. **Animations saccadées** : Réduire les effets
4. **Synchronisation** : Vérifier la connexion

#### Optimisations :
- **Lazy loading** automatique des composants
- **Compression** des assets
- **Cache intelligent** des données
- **Garbage collection** optimisée

### Accessibilité

#### Support Complet :
- **Navigation clavier** avec focus visible
- **Lecteurs d'écran** avec ARIA complet
- **Contraste élevé** mode automatique
- **Réduction mouvement** respectée

#### Raccourcis Clavier :
- `Tab/Shift+Tab` : Navigation
- `Enter/Space` : Activation
- `Esc` : Fermeture modale
- `F1` : Aide contextuelle
- `Space` : Retourner la carte (session)
- `0–4` : Noter la carte (qualité SM‑2)
- `Ctrl + /` (suggestion future) : Palette commandes (à venir)

---

## 📱 Usage Mobile et Responsive

### Adaptation Mobile

#### Interface Tactile :
- **Gestes swipe** pour les cartes
- **Zones de touche** optimisées
- **Feedback haptique** sur actions
- **Mode paysage** adaptatif

#### Performance Mobile :
- **Bundle size** optimisé
- **Loading** progressif
- **Cache** agressif
- **Battery** efficient

### Fonctionnalités Avancées

#### Mode Hors-ligne :
- **Service Worker** pour cache
- **Synchronisation** différée
- **Conflits** résolution automatique
- **Indicateurs** de statut réseau

#### PWA Features :
- **Installation** sur écran d'accueil
- **Notifications push** (optionnelles)
- **Background sync** pour données
- **App shell** architecture
- **Manifest** PWA optimisé (icônes multiples, thème)
- *(Prévu)* Enregistrement Service Worker & cache offline évolué

---

## 🔐 Variables CSS Exposées

| Variable | Rôle |
|----------|------|
| --accent-color | Couleur d'accent choisie |
| --accent-100..900 | Nuances générées HSL |
| --accent-h/s/l | Composantes HSL accent |
| --ui-scale | Facteur de zoom global |
| --ui-font-family | Famille de police active |
| --ui-font-weight | Poids typographique global |

---

## ♻️ Persistance & Restauration

- Paramètres stockés via Zustand persist (localStorage clé `cards-settings`).
- Focus Mode persistant (`cards-focus-mode`).
- Sessions d'étude actives stockées par deck (`cards.activeSession.{deckId}`) et restaurées automatiquement.

---

---

*Cards - Maîtrisez vos révisions avec l'IA et la gamification* 🎯
