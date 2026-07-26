# Projet Calendriar - Instructions pour les agents

## Règles strictes

1. **Une seule tentative** : Chaque agent ne fait qu'une seule itération.
2. **Pas de lecture** : Ne lis aucun fichier existant.
3. **Pas de vérification** : Écris et arrête-toi.
4. **Terminaison** : Après avoir écrit, réponds exactement "TASK_COMPLETE".
5. **Pas de continuation** : Ne dis jamais "Continue if you have next steps".
6. **Pas de "Let me check"** : Ne vérifie pas les fichiers.

## Architecture visée

calendriar/
├── go.mod
├── cmd/main.go
├── internal/
│ ├── domain/ # Logique métier
│ ├── ports/
│ │ ├── inbound/ # Interface d'entrée
│ │ └── outbound/ # Interface de sortie
│ ├── codec/ # Transformations
│ └── adapters/ # Adaptateurs concrets


## Références

- Les standards Go sont dans `.opencode/context/standards/code.md` (si besoin)

