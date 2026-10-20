# Métriques

Nous utilisons Prometheus : suivre les conventions de [Prometheus](https://prometheus.io/docs/practices/naming/) pour le nommage des métriques et des labels.

## Règles clés

- Utiliser des noms de métriques clairs et descriptifs, conformes aux conventions de nommage Prometheus.
- Utiliser un nommage de labels cohérent entre toutes les métriques d'un même service.
- Éviter les labels à forte cardinalité (par ex. identifiants d'utilisateur, identifiants de requête) dans les noms de métriques.
- Utiliser le suffixe `_total` pour les compteurs, et les suffixes `_seconds` ou `_count` quand ils sont appropriés.
- Pour le nommage des labels, suivre les conventions Prometheus (`snake_case`).
- Les labels Prometheus sont en `snake_case`, à ne pas confondre avec les clés de log zap en `camelCase` (voir [logging](./logging.md)).

> Note : la recommandation antérieure du `camelCase` pour les labels est caduque ; les conventions Prometheus s'appliquent.

## Exemple

```go
// Good — follows the Prometheus conventions
metrics.IncrementHandlersProcedure(
    metrics.GetLabelForProcedure(
        metrics.CreatePDPContext,
        metrics.SuccessLabel,
        metrics.GtpV1,
        gtpv1.ResCauseRequestAccepted,
    ),
)
```

## Références

- [Prometheus Best Practices — Naming](https://prometheus.io/docs/practices/naming/)
- [Prometheus Best Practices — Labels](https://prometheus.io/docs/practices/labels/)
