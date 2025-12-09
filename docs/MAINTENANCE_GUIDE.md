# 🛠️ Guide de maintenance du projet

**Dernière mise à jour :** Octobre 17, 2025

---

## 📋 Vue d'ensemble

Ce guide fournit les meilleures pratiques pour maintenir le projet propre et organisé. Suivez ces directives pour éviter l'accumulation de fichiers temporaires, doublons et autres éléments inutiles.

---

## 🗂️ Structure des fichiers

### Documentation (`/docs`)

```text
docs/
├── README.md          # Index principal - À JOUR
├── guides/            # Guides pratiques actifs
├── reports/           # Rapports récents (< 3 mois)
└── archived/          # Anciens rapports (> 3 mois)
```

**Règles :**

- ✅ **Nouveaux guides** → Placer dans `docs/guides/`
- ✅ **Nouveaux rapports** → Placer dans `docs/reports/`
- ✅ **Rapports > 3 mois** → Déplacer vers `docs/archived/`
- ❌ **Jamais** de fichiers `.md` à la racine (sauf `README.md` et `CHANGELOG.md`)

### Code source (`/src`)

**Fichiers interdits :**

- ❌ Fichiers de backup (`.bak`, `.backup`, `.old`)
- ❌ Fichiers temporaires (`.tmp`, `.temp`, `.cache`)
- ❌ Tests désactivés (`.disabled`, `.skip`)
- ❌ Doublons de fichiers principaux (`main.jsx` quand `main.tsx` existe)

**Bonnes pratiques :**

- ✅ Un seul point d'entrée : `main.tsx`
- ✅ Tests actifs uniquement (supprimer ou corriger les tests `.disabled`)
- ✅ Utiliser Git pour l'historique (pas de `.bak`)

### Fichiers publics (`/public`)

**Fichiers autorisés :**

- ✅ Fichiers servis par l'app (icônes, manifests, HTML offline)
- ✅ Fichiers JSON de données publiques

**Fichiers interdits :**

- ❌ Fichiers de test HTML (`test.html`, `react-test.html`)
- ❌ Fichiers JSON temporaires (sauf si nécessaires à l'app)

---

## 🧹 Checklist de nettoyage mensuel

### 1. Documentation

- [ ] Vérifier les rapports dans `docs/reports/` de plus de 3 mois
- [ ] Déplacer les anciens rapports vers `docs/archived/`
- [ ] Mettre à jour `docs/README.md` si nouvelle documentation

### 2. Code source

```powershell
# Rechercher les fichiers de backup
Get-ChildItem -Path .\src -Include *.bak,*.backup,*.old -Recurse

# Rechercher les tests désactivés
Get-ChildItem -Path .\src\__tests__ -Filter *.disabled -Recurse

# Rechercher les doublons potentiels
Get-ChildItem -Path .\src -Include *.jsx -Recurse | Where-Object { Test-Path ($_.FullName -replace '\.jsx$', '.tsx') }
```

### 3. Fichiers temporaires racine

```powershell
# Vérifier les fichiers JSON temporaires
Get-ChildItem -Path . -Include *.json -File | Where-Object { $_.Name -notmatch '^(package|tsconfig|playwright|vitest)' }

# Vérifier les fichiers de configuration obsolètes
Get-ChildItem -Path . -Include *.minimal.*,*.old.* -File
```

### 4. Git

```powershell
# Vérifier le statut Git
git status --short

# Vérifier les fichiers non suivis
git ls-files --others --exclude-standard
```

---

## 🚫 Fichiers à ne jamais committer

Le `.gitignore` est configuré pour bloquer automatiquement :

### Générés automatiquement

- `node_modules/`
- `dist/`, `build/`
- `coverage/`
- `.cache/`, `.vite/`

### Temporaires

- `*.log`
- `*.tmp`, `*.temp`, `*.cache`
- `*.bak`, `*.backup`, `*.old`
- `saveImage/`, `tmp/`, `temp/`

### Environnement

- `.env`, `.env.local`, `.env.*.local`
- `.vscode/settings.json` (sauf exceptions listées)

### OS

- `.DS_Store`, `Thumbs.db`
- `*~` (fichiers de backup Unix)

---

## ✅ Checklist avant commit

Avant chaque commit, vérifier :

1. [ ] Pas de fichiers `.bak` ou `.backup`
2. [ ] Pas de `console.log()` de debug oubliés
3. [ ] Pas de fichiers temporaires (`*.tmp`, `*.temp`)
4. [ ] Pas de tests désactivés non documentés (`.disabled`)
5. [ ] Documentation à jour si modifications majeures
6. [ ] `.gitignore` respecté (vérifier `git status`)

---

## 🔄 Scripts de maintenance automatique

### Script de nettoyage rapide

Créer un fichier `scripts/cleanup.ps1` :

```powershell
# Nettoyage automatique du projet
Write-Host "🧹 Nettoyage du projet..." -ForegroundColor Cyan

# Supprimer les fichiers de backup
Get-ChildItem -Path .\src -Include *.bak,*.backup,*.old -Recurse -File | Remove-Item -Force

# Supprimer les fichiers temporaires
Get-ChildItem -Path . -Include *.tmp,*.temp,*.cache -Recurse -File | Remove-Item -Force

# Supprimer les tests désactivés (après confirmation)
$disabledTests = Get-ChildItem -Path .\src\__tests__ -Filter *.disabled -Recurse
if ($disabledTests) {
    Write-Host "Tests désactivés trouvés:"
    $disabledTests | ForEach-Object { Write-Host "  - $($_.Name)" }
    $confirm = Read-Host "Supprimer ces fichiers? (o/n)"
    if ($confirm -eq 'o') {
        $disabledTests | Remove-Item -Force
    }
}

Write-Host "✅ Nettoyage terminé!" -ForegroundColor Green
```

### Utilisation

```powershell
# Exécuter le script
.\scripts\cleanup.ps1
```

---

## 📊 Métriques de santé du projet

### Indicateurs à surveiller

| Métrique            | Cible  | Action si dépassé     |
| ------------------- | ------ | --------------------- |
| Fichiers .md racine | ≤ 2    | Déplacer vers `docs/` |
| Fichiers backup     | 0      | Supprimer ou commit   |
| Tests désactivés    | 0      | Corriger ou supprimer |
| Rapports récents    | ≤ 5    | Archiver anciens      |
| Taille node_modules | ~500MB | Vérifier dépendances  |

### Commandes de vérification

```powershell
# Compter fichiers .md à la racine
(Get-ChildItem -Path . -Filter *.md -File).Count

# Compter fichiers backup
(Get-ChildItem -Path .\src -Include *.bak,*.backup,*.old -Recurse).Count

# Compter tests désactivés
(Get-ChildItem -Path .\src\__tests__ -Filter *.disabled -Recurse).Count

# Taille node_modules
(Get-ChildItem -Path .\node_modules -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
```

---

## 🎯 Objectifs de maintenance

### Court terme (chaque sprint)

- ✅ Aucun fichier temporaire dans `src/`
- ✅ Tous les tests actifs passent
- ✅ Documentation des nouvelles fonctionnalités
- ✅ `.gitignore` à jour

### Moyen terme (chaque mois)

- ✅ Archivage des anciens rapports
- ✅ Révision des dépendances obsolètes
- ✅ Nettoyage des branches Git mergées
- ✅ Mise à jour du CHANGELOG.md

### Long terme (chaque trimestre)

- ✅ Audit complet de la structure
- ✅ Refactoring documentation si nécessaire
- ✅ Revue des scripts de maintenance
- ✅ Optimisation des performances

---

## 📞 Support

Pour toute question sur la maintenance :

1. Consulter ce guide
2. Vérifier `docs/README.md`
3. Examiner les rapports dans `docs/reports/`

---

**Note :** Ce guide fait partie de l'initiative de nettoyage d'octobre 2025. Voir `CLEANUP_SUMMARY.md` pour les détails de la réorganisation initiale.
