# 🚀 Guide de Migration - Nouveaux Utilitaires de Service

## 📌 Vue d'ensemble

Ce guide explique comment migrer les services existants pour utiliser le nouveau système centralisé de gestion d'erreurs et de validation.

---

## 🎯 Étapes de Migration (5 minutes par service)

### Étape 1: Importer les Nouveaux Utilitaires

**Ajouter ces imports en haut du fichier:**

```typescript
import { createServiceError, safeLog } from "./base/ServiceError";
import {
  validateId,
  validateRequiredString,
  validateNumber,
} from "./base/validators";
```

### Étape 2: Supprimer Code Dupliqué

**Supprimer ces fonctions locales:**

```typescript
// ❌ Supprimer
function svcError(code: string, message: string) {
  const e: any = new Error(message);
  e.code = code;
  return e;
}

// ❌ Supprimer
const safeWarn = (cat: string, msg: string, data?: any) => {
  try {
    const anyLogger = logger as any;
    if (typeof anyLogger.warn === "function") {
      anyLogger.warn(cat, msg, data);
    } else if (typeof anyLogger.debug === "function") {
      anyLogger.debug(cat, msg, data);
    }
  } catch {
    /* ignore */
  }
};
```

### Étape 3: Remplacer Appels d'Erreur

**Rechercher et remplacer (Regex):**

```regex
Rechercher: throw svcError\('([^']+)',\s*'([^']+)'\)
Remplacer: throw createServiceError.operationFailed('$2', 'resourceType')
```

**Ou manuellement:**

| Ancien Code                                             | Nouveau Code                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `throw svcError('NO_ID', 'ID requis')`                  | `throw createServiceError.invalidId('resourceType')`                           |
| `throw svcError('NOT_FOUND', 'Resource introuvable')`   | `throw createServiceError.notFound('ResourceType', id)`                        |
| `throw svcError('OPERATION_FAILED', 'échec opération')` | `throw createServiceError.operationFailed('opération', 'resourceType', error)` |

### Étape 4: Remplacer Validations Manuelles

**Avant:**

```typescript
async getResource(id: string): Promise<Resource> {
  if (!id) {
    safeWarn('ServiceName', 'ID requis')
    throw svcError('NO_ID', 'ID requis')
  }

  try {
    // ...
  }
}
```

**Après:**

```typescript
async getResource(id: string): Promise<Resource> {
  validateId(id, 'resource')  // Lève ValidationError automatiquement

  try {
    // ...
  }
}
```

### Étape 5: Améliorer Try-Catch

**Pattern Standard:**

```typescript
async methodName(param: Type): Promise<ReturnType> {
  // 1. Validations AVANT try-catch
  validateId(param.id, 'resourceType')

  try {
    // 2. Logique métier
    const result = await this.repository.operation(param)

    // 3. Vérification existence
    if (!result) {
      safeLog(logger, 'warn', 'ServiceName', 'Resource not found', { id: param.id })
      throw createServiceError.notFound('ResourceType', param.id)
    }

    return result
  } catch (error) {
    // 4. Re-throw ServiceErrors (déjà typées)
    if ((error as any)?.code) {
      throw error
    }

    // 5. Logging enrichi
    logger.error('ServiceName', 'Operation failed', { param, error })

    // 6. Wrap erreur inconnue
    throw createServiceError.operationFailed('operation', 'resourceType', error)
  }
}
```

### Étape 6: Ajouter Documentation

**Template JSDoc:**

````typescript
/**
 * [Description courte de la méthode]
 *
 * [Description longue optionnelle avec détails importants]
 *
 * @param param - [Description du paramètre]
 * @returns [Description de la valeur retournée]
 * @throws ValidationError si [condition]
 * @throws NotFoundError si [condition]
 * @throws ServiceError si [condition]
 *
 * @example
 * ```ts
 * const result = await service.methodName(param)
 * ```
 */
````

---

## 📚 Référence Rapide des Validators

### validateId

```typescript
validateId(id, "deck"); // Vérifie que id est une string non vide
```

**Lève:** `ValidationError` si id est null, undefined, vide ou non-string

### validateRequiredString

```typescript
validateRequiredString(data.name, "nom du deck", {
  minLength: 1, // Longueur minimale
  maxLength: 100, // Longueur maximale
  pattern: /^[a-z]+$/i, // Regex
  trim: true, // Trim avant validation
});
```

**Lève:** `ValidationError` avec message descriptif

### validateNumber

```typescript
validateNumber(limit, "limite quotidienne", {
  min: 0, // Minimum
  max: 1000, // Maximum
  integer: true, // Doit être entier
  allowNegative: false, // Autorise négatifs
});
```

**Lève:** `ValidationError` si ne respecte pas contraintes

### validateNonEmptyArray

```typescript
validateNonEmptyArray<CardEntity>(cards, "cartes");
```

**Lève:** `ValidationError` si pas un tableau ou tableau vide

### validateEnum

```typescript
validateEnum(
  status,
  ["active", "paused", "completed"] as const,
  "statut de session"
);
```

**Lève:** `ValidationError` si valeur pas dans enum

---

## 🎨 Référence Rapide des Erreurs

### createServiceError.invalidId

```typescript
throw createServiceError.invalidId("deck", id);
// Message: "ID deck invalide ou manquant"
// Métadonnées: { resourceType: 'deck', resourceId: id }
```

### createServiceError.missingField

```typescript
throw createServiceError.missingField("nom", "deck");
// Message: "Champ requis manquant: nom"
// Métadonnées: { resourceType: 'deck', context: { fieldName: 'nom' } }
```

### createServiceError.notFound

```typescript
throw createServiceError.notFound("Deck", id);
// Message: "Deck introuvable"
// Métadonnées: { resourceType: 'Deck', resourceId: id }
```

### createServiceError.operationFailed

```typescript
throw createServiceError.operationFailed("création", "deck", error);
// Message: "Échec création deck"
// Métadonnées: { resourceType: 'deck', cause: error }
```

### createServiceError.fromUnknown

```typescript
throw createServiceError.fromUnknown(error, "Contexte optionnel");
// Wrap n'importe quelle erreur en ServiceError
```

---

## 🔍 Checklist de Migration

Pour chaque service à migrer:

- [ ] Ajouter imports `createServiceError`, `safeLog`, validators
- [ ] Supprimer fonction locale `svcError()`
- [ ] Supprimer fonction locale `safeWarn()` ou équivalent
- [ ] Remplacer `throw svcError(...)` par `throw createServiceError....`
- [ ] Remplacer `if (!id) throw...` par `validateId(id, 'type')`
- [ ] Remplacer validations manuelles par validators appropriés
- [ ] Améliorer blocs try-catch avec re-throw conditionnel
- [ ] Enrichir logging avec contexte (`{ id, error }`)
- [ ] Ajouter JSDoc à toutes méthodes publiques
- [ ] Tester que tous les tests passent
- [ ] Vérifier pas d'erreur TypeScript

---

## 🧪 Tests Après Migration

```bash
# Tester le service migré
npm run test:run -- NomDuService

# Vérifier pas d'erreur TypeScript
npx tsc --noEmit

# Vérifier linting
npm run lint

# Tester toute la suite (si confiant)
npm run test:fast
```

---

## 💡 Astuces

### 1. Migration Incrémentale

Vous pouvez migrer méthode par méthode. Les anciens et nouveaux patterns peuvent coexister temporairement.

### 2. Recherche Globale

Utilisez VS Code pour trouver tous les usages:

- `Ctrl+Shift+F` → Rechercher `svcError` dans tout le projet
- `Ctrl+Shift+F` → Rechercher `safeWarn` dans tout le projet

### 3. Copier DeckService

Le fichier `DeckService.ts` refactorisé peut servir de template parfait. Copiez la structure!

### 4. Tests Unitaires des Validators

Si vous voulez tester vos validations isolément:

```typescript
import { describe, it, expect } from "vitest";
import { validateId, ValidationError } from "./base/validators";

describe("validateId", () => {
  it("lève erreur si ID vide", () => {
    expect(() => validateId("", "deck")).toThrow(ValidationError);
  });

  it("passe si ID valide", () => {
    expect(() => validateId("abc123", "deck")).not.toThrow();
  });
});
```

---

## 📞 Support

Si vous avez des questions sur la migration:

1. Consultez `CODE_IMPROVEMENT_REPORT.md` pour contexte complet
2. Regardez `DeckService.ts` comme exemple de référence
3. Consultez les fichiers source:
   - `src/application/services/base/ServiceError.ts`
   - `src/application/services/base/validators.ts`

---

**Bonne migration! 🚀**
