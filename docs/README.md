# 📚 Documentation Ariba JS

Bienvenue dans la documentation du projet Ariba JS - Application de cartes mémoire avec répétition espacée.

## 📖 Structure de la documentation

### 📘 Guides (`/guides`)

Guides pratiques et références pour les développeurs :

- **[DEV_GUIDE.md](guides/DEV_GUIDE.md)** - Guide principal du développeur
- **[USER_GUIDE.md](guides/USER_GUIDE.md)** - Guide utilisateur de l'application
- **[TESTING_GUIDE.md](guides/TESTING_GUIDE.md)** - Guide des tests et bonnes pratiques
- **[PERFORMANCE_GUIDE.md](guides/PERFORMANCE_GUIDE.md)** - Optimisation et monitoring des performances
- **[ERROR_HANDLING_GUIDE.md](guides/ERROR_HANDLING_GUIDE.md)** - Gestion des erreurs et validation
- **[INFRASTRUCTURE_GUIDE.md](guides/INFRASTRUCTURE_GUIDE.md)** - Architecture et infrastructure
- **[TYPE_SAFETY_GUIDE.md](guides/TYPE_SAFETY_GUIDE.md)** - TypeScript et sécurité des types
- **[DEBUGGING_GUIDE.md](guides/DEBUGGING_GUIDE.md)** - Débogage et troubleshooting
- **[ADVANCED_LOGGING_GUIDE.md](guides/ADVANCED_LOGGING_GUIDE.md)** - Logging avancé
- **[MIGRATION_GUIDE.md](guides/MIGRATION_GUIDE.md)** - Guide de migration des services

### 🛠️ Maintenance

- **[MAINTENANCE_GUIDE.md](MAINTENANCE_GUIDE.md)** - Guide de maintenance et bonnes pratiques pour garder le projet propre

### 📊 Rapports (`/reports`)

Rapports d'amélioration et refactoring récents :

- **[CORRECTION_FINALE.md](reports/CORRECTION_FINALE.md)** - ✅ Rapport final des corrections (Dernière version)
- **[REFACTORING_SUMMARY.md](reports/REFACTORING_SUMMARY.md)** - Résumé du refactoring des services
- **[CODE_IMPROVEMENT_REPORT.md](reports/CODE_IMPROVEMENT_REPORT.md)** - Rapport détaillé des améliorations

### 📦 Archives (`/archived`)

Anciens rapports et documentation historique conservés pour référence.

## 🚀 Liens rapides

### Pour commencer

1. Lire le [README principal](../README.md) du projet
2. Consulter le [Guide développeur](guides/DEV_GUIDE.md)
3. Parcourir le [Guide utilisateur](guides/USER_GUIDE.md)

### Pour contribuer

1. Suivre le [Guide de migration](guides/MIGRATION_GUIDE.md) pour refactorer les services
2. Appliquer les [Bonnes pratiques de test](guides/TESTING_GUIDE.md)
3. Respecter les [Standards de gestion d'erreurs](guides/ERROR_HANDLING_GUIDE.md)

### Pour débugger

1. Consulter le [Guide de débogage](guides/DEBUGGING_GUIDE.md)
2. Vérifier les [Rapports de correction](reports/CORRECTION_FINALE.md)
3. Analyser les [Logs avancés](guides/ADVANCED_LOGGING_GUIDE.md)

## 📝 Dernières mises à jour

### Octobre 2025 - Refactoring majeur des services

- ✅ Centralisation de la gestion d'erreurs avec `ServiceError`
- ✅ Validation unifiée avec la classe `Validators`
- ✅ Refactoring de `DeckService`, `CardService`, `StudySessionService`
- ✅ Élimination de 60 lignes de code dupliqué
- ✅ Documentation JSDoc complète (22 méthodes)
- ✅ 0 erreurs TypeScript
- ✅ Tests critiques passent avec succès
- ✅ 100% de compatibilité descendante

Voir [CORRECTION_FINALE.md](reports/CORRECTION_FINALE.md) pour les détails complets.

## 🏗️ Architecture du projet

```text
Ariba JS/
├── src/                    # Code source
│   ├── application/        # Couche application (services)
│   ├── domain/             # Modèles de domaine
│   ├── infrastructure/     # Infrastructure (DB, workers)
│   └── ui/                 # Composants React
├── docs/                   # Documentation (vous êtes ici)
│   ├── guides/            # Guides de référence
│   ├── reports/           # Rapports récents
│   └── archived/          # Archives historiques
├── memory-bank/           # Contexte et décisions architecturales
└── scripts/               # Scripts d'automatisation
```

## 📞 Support

Pour toute question ou problème :

1. Consulter les guides pertinents ci-dessus
2. Vérifier les rapports d'erreurs dans `/reports`
3. Examiner les archives pour l'historique des changements

---

**Dernière mise à jour :** Octobre 2025  
**Statut du projet :** ✅ Production-ready - Tests critiques passent
