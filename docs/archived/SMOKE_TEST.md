# 🔥 Smoke Test Manuel (Pré‑Prod Cards)

Objectif: Vérifier rapidement qu'aucune régression critique n'empêche les parcours fondamentaux.

## Préparation
1. Build prod: `npm run build`
2. Servir: `npx serve dist` puis ouvrir http://localhost:3000
3. Ouvrir DevTools (onglet Console & Application > Service Workers)

## Checklist Parcours
| Étape | Action | OK |
|-------|--------|----|
| Deck: créer | Bouton "Nouveau deck" → nom → créer | |
| Deck: éditer nom | Renommer deck existant | |
| Deck: supprimer | Supprimer (vérifier confirmation) | |
| Carte: créer | Ajouter carte recto/verso simple | |
| Carte: éditer | Modifier texte + tags | |
| Carte: supprimer | Supprimer carte | |
| Étude: lancer session | Depuis deck → Étudier → montrer réponse | |
| Étude: rating | Sélectionner un choix (facile/difficile) | |
| Recherche | Barre globale: retrouver carte créée | |
| Rebuild index | Forcer rebuild / prime (Diagnostics si flag) | |
| Warmups | Aucun blocage UI durant ~5s post chargement | |
| Import (petit csv) | Importer fichier test (<50 lignes) | |
| Export médias (si feature) | Export zip/media OK | |

## Offline / PWA
1. Vérifier SW actif (Application > Service Workers)
2. Cocher Offline (Network) → naviguer route → fallback `offline.html` affiché
3. Revenir online, recharger OK

## Console (zéro erreur)
| Type | Attendu |
|------|---------|
| Erreurs | 0 |
| Warnings | ≈0 (hors éventuels React strict dev) |
| Logs Performance Budget | Absents (prod sans diagnostics) |

## Données / Dexie
1. Inspecter IndexedDB → AribaDB → tables présentes (cards,decks,sessions,media,searchIndex,searchTermStats,searchTrigrams,meta)
2. Table meta contient `schemaVersion=7`

## Monitoring (si endpoint configuré)
1. Génération métriques Web Vitals (diagnostics activés) → batched

## Critères Go / No-Go
- Tous les points OK
- Aucune erreur console
- Performances initiales correctes (<2s TTI subjectif, pas de freeze)

---
Mettre à jour ce fichier à chaque ajout de fonctionnalité critique.
