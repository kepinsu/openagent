---
name: coding-style
description: Conventions de code Go Halys — séquentialité du code, godoc, layout models.go, nommage des constantes, Uber style guide, logs zap (message en minuscule, clés camelCase, préfixe "failed to:"), métriques Prometheus (labels snake_case), erreurs statiques vs à structure, wrapping/unwrapping. À appliquer à l'écriture, la revue ou l'audit de code Go dans n'importe quel projet Halys.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(go:*), Bash(git:*), Agent
---

# Conventions de code Go Halys

**Persona** : développeur Go de l'équipe Halys. Les conventions du projet
s'appliquent strictement : séquentialité des appels, documentation claire,
gestion structurée des erreurs, logs cohérents. Un échec silencieux, un log en
doublon ou de la logique égarée dans `models.go` sont également inacceptables.

Les règles constituent un cadre général, volontairement légèrement flexible
pour s'adapter aux contraintes de chaque projet. C'est un document vivant :
pour toute question ou proposition, contacter les référents techniques ou
ouvrir un ticket. Source de vérité :
[wiki Coding-Style](https://gitlab.halys.fr/halys/products/hubs/drf-v2/drf-v2-monorepo/-/wikis/Contributing/Coding-Style).

## Modes

- **Écriture** — nouvelle implémentation : appliquer les règles au fil de
  l'eau ; possibilité de lancer en fond un sous-agent qui greppe les
  violations dans le code adjacent (logique dans `models.go`, logs en
  doublon, sens de wrapping interdit) sans bloquer l'implémentation.
- **Revue** — diff de MR : contrôler séquentialité, godoc, placement des
  modèles, nommage des constantes, niveaux de log, sens de wrapping,
  couverture de test. Séquentiel.
- **Audit** — base de code entière : jusqu'à 6 sous-agents en parallèle,
  un par catégorie (voir la section dédiée).

## Les règles, par catégorie

Chaque fichier de référence porte le détail et les exemples ✅/❌. Ne charger
que les catégories utiles au travail en cours.

### [Organisation du code](./references/code-organization.md)

- Séquentialité des appels dans un fichier : fonction d'entrée d'abord, puis
  les fonctions privées dans l'ordre d'appel, les fonctions « owned » à la fin.
- Commentaires godoc obligatoires sur toutes les fonctions et tous les types
  exportés (documentation auto-générée).

### [Modèles](./references/models.md)

- Uber Go Style Guide pour tous les modèles ; regroupés dans `models.go`,
  sans aucune logique (structs et tags uniquement).
- Tags JSON en camelCase, tags YAML en snake_case.
- Ordonnés par séquentialité : structs publiques d'abord, puis les structs
  privées possédées.
- Exception : le modèle des erreurs vit dans `error.go`.

### [Constantes](./references/constants.md)

- Publiques en PascalCase ; privées en camelCase préfixé par `_`.
- N'exporter que les constantes réellement accédées hors du package.
- Blocs iota sans sauts de valeurs.

### [Logs](./references/logging.md)

- Logger zap obligatoire ; messages en minuscules commençant par un verbe,
  clés en camelCase, messages d'erreur préfixés par un énoncé d'échec
  (`failed to:`, `could not:`, …).
- Logs minimaux : rien si tout se passe bien (flux général en `debug`),
  erreurs 4xx côté serveur en `info`, échecs réels en `error` avec le
  contexte fonctionnel utile au débogage.
- Logger une seule fois, à la frontière (le handler), pas dans les fonctions
  appelées — rares exceptions admises.
- Attention au cumul log `info` + métrique : ne pas tracer deux fois la même
  information (voir [Métriques](./references/metrics.md)).

### [Métriques](./references/metrics.md)

- Conventions Prometheus pour les métriques **et** les labels — labels en
  `snake_case` ; l'ancienne recommandation camelCase est caduque, et les clés
  de log zap (camelCase) ne sont pas des labels.
- Éviter les labels à forte cardinalité ; suffixes `_total`, `_seconds`,
  `_count`.

### [Gestion des erreurs](./references/error-handling.md)

- Erreurs statiques (`errors.New`, préfixe `Err` exposée / `err` interne,
  déclarées dans le fichier de la méthode) réservées aux Decode/Encode,
  lecture de fichiers et lancement de service — jamais quand il y a un
  échange avec un autre service.
- Erreurs à structure pour les échanges inter-services et les handlers : une
  seule par service/interface, dans `error.go`, retour documenté en godoc.
- Trois sens de wrapping seulement : statique→statique
  (`fmt.Errorf("préfixe: %w")` en pile sans répétition), statique→structure,
  structure→structure. Le sens structure→statique est **interdit**.
- `errors.Is()` pour les erreurs statiques, `errors.As()` pour les erreurs à
  structure.

### [Tests d'intégration](./references/integration-tests.md)

- Section TBD : toute API testable avec Postman doit l'être ; versions
  minimale et étendue à définir ; E2E à définir avec les devops, sur merge
  uniquement.

## Audit parallèle d'une base de code

Pour auditer une base de code entière, jusqu'à 6 sous-agents via l'outil
Agent, un par catégorie indépendante :

1. Organisation du code — séquentialité et godoc
2. Modèles — placement `models.go`, tags, ordre
3. Constantes — nommage et iota
4. Logs — zap, niveaux, doublons, clés
5. Métriques — conventions Prometheus
6. Gestion des erreurs — sens de wrapping, nommage, unwrapping

Les tests d'intégration sont exclus de l'audit tant que la section est TBD.
Consolider les constats par catégorie, avec fichier et ligne pour chacun.

## Références externes

- [Uber Go Style Guide](https://github.com/uber-go/guide/blob/master/style.md)
- [Zap](https://github.com/uber-go/zap)
- [Prometheus — conventions de nommage](https://prometheus.io/docs/practices/naming/)
- [Wiki Coding-Style](https://gitlab.halys.fr/halys/products/hubs/drf-v2/drf-v2-monorepo/-/wikis/Contributing/Coding-Style)
