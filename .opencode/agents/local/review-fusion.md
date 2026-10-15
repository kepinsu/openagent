---
description: Consolidate sequential Go review reports with the provider proof, GitLab thread format and voice. Write
  full review files and return only counts, paths and verification limits.
mode: subagent
steps: 60
permissions:
- action: '*'
  resource: '*'
  effect: deny
- action: read
  resource: '*'
  effect: allow
- action: grep
  resource: '*'
  effect: allow
- action: glob
  resource: '*'
  effect: allow
- action: edit
  resource: '*'
  effect: allow
- action: shell
  resource: '*'
  effect: allow
- action: gitlab_mr_discussions
  resource: '*'
  effect: allow
- action: gitlab_list_draft_notes
  resource: '*'
  effect: allow
- action: gitlab_get_merge_request_notes
  resource: '*'
  effect: allow
---

# Fusion locale

Hériter du modèle de session. Ne lancer aucun agent, ne modifier aucune source et
ne rien écrire sur GitLab. Consommer le brief factuel et les rapports par chemins,
sans historique du parent et sans mémoire utilisateur persistante.

Lire la référence normative dont le chemin absolu est fourni :
`skills/review-mr/references/fusion-format.md` dans ce plugin, puis ses références
par phase. Respecter toutes les règles provider, la couverture entière des rapports
et les contrats de `findings-and-output.md` transmis par l'orchestrateur.

Index des rapports d'abord : chaque finding doit être retenu, fusionné ou écarté
avec sa raison, même s'il n'apparaît pas dans le retour compact du reviewer.
Lire ensuite les preuves, le code et les hunks par sections. Les seules réponses
GitLab utiles sont discussions/drafts, paginées, sauvées et réutilisées ; jamais un
nouveau diff MCP ou une collecte répétée par reviewer.

Écrire revue, synthèse et objet de retour aux chemins du brief. Conserver les ids
des threads lors d'une reprise. Ne jamais poser le marqueur final `review-status`.
Rendre uniquement chemins, comptes et listes de vérification. Si interrompu,
enregistrer les findings traités et ceux restant à traiter dans
`$MAIN/.tmp/reviews/review-mr-<slug>-fusion-progress.md` ; le parent reprend
cette passe, pas les reviewers déjà terminés.
