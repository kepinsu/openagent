---
name: review-mr
description: Reviewer une merge request Go et produire des threads GitLab prêts à coller. Lance le panel (dogmatic-go-reviewer, annoying-product-owner, paranoid-perf-gopher, plus un audit 3GPP délégué et une passe architecture/style projet si applicables), déduplique les findings par fusion, les vérifie contre le code réel, et les ordonne dans l'ordre de l'onglet Changes. Isole la revue dans un worktree jetable dès que la cible est une MR, un range ou une autre branche, pour tourner en parallèle d'un dev en cours et survivre à un changement de branche en cours de route, sans toucher à l'arbre principal. Sortie en français, jargon technique en anglais, criticité et axe sur chaque thread. Sait aussi poster les threads et la note de synthèse sur la MR, en draft notes, après confirmation explicite. À invoquer quand on demande de reviewer une MR, un diff de branche, un range de commits, ou de préparer des commentaires de revue GitLab.
argument-hint: "[MR-IID | <sha>..<sha> | <path>] [instructions...]"
allowed-tools: Bash, Read, Grep, Glob, Write, Skill, Agent, TodoWrite, mcp__gitlab__get_merge_request, mcp__gitlab__get_merge_request_diffs, mcp__gitlab__list_merge_request_changed_files, mcp__gitlab__mr_discussions, mcp__gitlab__get_merge_request_notes, mcp__gitlab__get_issue
---

# Review MR

## Exécution OpenCode V2

Utiliser le catalogue d'outils réellement disponible : `shell`, `subagent` et
`question`, et découvrir les outils MCP exposés plutôt que recopier les noms
Claude de `allowed-tools` (métadonnées de provenance, pas des permissions V2).
Les agents du panel ont les identifiants `local/dogmatic-go-reviewer`,
`local/annoying-product-owner`, `local/paranoid-perf-gopher`,
`local/3gpp-conformance-auditor` et `local/review-fusion`.
Les arguments viennent de la demande utilisateur ; OpenCode ne substitue pas
automatiquement `$ARGUMENTS` dans une skill.

Lire `AGENTS.md` et les skills `.opencode/skills/` du projet en priorité. Les
ledgers `.claude/progress/` mentionnés ci-dessous sont des entrées historiques
optionnelles d'autres workflows, jamais une dépendance OpenCode obligatoire.
Écrire les checkpoints de cette revue sous `.tmp/reviews/` ; conserver les
rapports finaux sous `.drafts/reviews/`. Les plugins externes et caches de specs
cités doivent être présents explicitement ; s'ils manquent, signaler la limite.

Revue consolidée d'une merge request Go, sortie en threads GitLab. Quatre passes
consolidées (ou plus, voir §4), criticité, note de méthodo, section « ce qui est bien »,
verdict. La déduplication est une étape nommée avec sa propre passe de vérification, et
le format de sortie (§7) comme les règles de ton (§8) sont normatifs pour cette skill : ce
n'est pas un référentiel externe, c'est ce document.

**Quand l'invoquer** : reviewer la MR d'un collègue, se relire avant de demander une revue,
préparer les commentaires d'une MR déjà ouverte.

**Quand NON** : pendant l'implémentation d'une issue. Si le plugin `halys-issue-workflow`
est installé, c'est sa skill `implement-issue` qui pilote son propre panel par step, pour
produire un fix plan appliqué inline. Les deux se composent mais ne se remplacent pas :
l'une corrige un step qu'on vient d'écrire, l'autre répond à l'auteur d'une MR.

Arguments (`$ARGUMENTS`) : le premier token est la cible (voir §1). Le reste est un jeu
d'instructions valables pour cette invocation seulement, à empiler sur les règles ci-dessous.

---

## 1. Cadrer la cible

| Premier token | Résolution |
|---|---|
| absent | `git merge-base origin/master HEAD` puis diff jusqu'à `HEAD` |
| numérique (`687`) | MCP GitLab sur le projet courant |
| `<sha>..<sha>` | range explicite |
| un chemin | restreint la revue à ce sous-arbre |

**Le projet GitLab cible se résout une fois**, depuis le remote git, jamais codé en dur :

```bash
PROJECT_PATH=$(git -C "$ROOT" remote get-url origin \
  | sed -E 's#^[a-z+]+://##; s#^[^@]+@##; s#^[^/:]+(:[0-9]+)?[/:]##; s#\.git$##')
PROJECT=$(python3 -c "import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1], safe=''))" "$PROJECT_PATH")
```

**Ne jamais essayer de deviner le namespace par une regex gourmande.** Retirer le schéma,
l'utilisateur, l'hôte et le port, puis le `.git` final, et garder tout le reste. Un `.*[:/]`
en tête consomme jusqu'au dernier séparateur qui laisse encore matcher la suite, et rend
`laboratory/claude-workflow` là où le projet est `halys/laboratory/claude-workflow` : toutes
les cibles `/projects/<id>/...` partent alors en 404. Tous les projets Halys sont rangés en
sous-groupes, donc la version gourmande ne marche nulle part.

| Remote | `PROJECT_PATH` |
|---|---|
| `ssh://git@host:8022/halys/products/5gc/halys-5gc.git` | `halys/products/5gc/halys-5gc` |
| `git@host:halys/products/5gc/halys-5gc.git` | `halys/products/5gc/halys-5gc` |
| `https://host/halys/products/5gc/halys-5gc.git` | `halys/products/5gc/halys-5gc` |

Toutes les cibles `/projects/<id>/...` de cette skill, MCP comme `curl` (§9), utilisent
cette valeur `$PROJECT`.

Sur cible MCP : `get_merge_request` (titre, description, `diff_refs`, auteur),
`get_merge_request_diffs`, `list_merge_request_changed_files`, et surtout `mr_discussions`, qui
sert à ne pas redire ce qui est déjà commenté.

Toujours collecter, quelle que soit la cible :

- **Les `diff_refs`** (`base_sha`, `start_sha`, `head_sha`). Ils vont en tête du fichier de
  sortie. Sans eux, on ne pourra pas poster les threads automatiquement plus tard.
- **Le numéro d'issue.** Sur branche locale il se lit dans le nom de branche, `^([0-9]+)-`
  (convention `<issue>-<titre-slugifié>`, celle que GitLab applique par défaut quand une
  branche est créée depuis une issue).
- **Les critères de succès de l'issue.** D'abord le draft local : grep du numéro dans
  `.drafts/`, section « Critère de succès » de la Vue d'Ensemble — imposée par la skill
  `writing-rules` si le plugin `halys-issue-workflow` est installé. À défaut, `get_issue`.
- **Le ledger de l'issue** s'il existe, `.claude/progress/<issue>.md` (produit par
  `implement-issue`, plugin `halys-issue-workflow`, si installé) : ses sections
  « Decisions that bind » et « Findings REJECTED (do not re-open) » sont directement du matériel
  de dédup.

Exclure de la revue ligne à ligne, et le dire dans l'en-tête de sortie : `*.gen.go`, `*.pb.go`,
`go.sum`. Un fichier généré de 10 000 lignes noie la revue et ne se corrige pas à la main.

## 2. Isoler la revue dans un worktree

Une revue ne doit jamais déranger le travail en cours. Si la cible n'est pas déjà sous les yeux,
checkout le code dans un **worktree jetable** et laisser l'arbre principal intact : la revue de
la MR d'un collègue tourne alors en parallèle du dev sur une autre branche, sans stash, sans
switch, sans rien à remettre en place après.

Dans ce qui suit, `$SCRATCH` est le répertoire scratchpad de la session et `$MAIN` la racine de
l'arbre principal.

| Situation | Worktree |
|---|---|
| pas d'argument, on relit la branche courante | non, et c'est voulu : le travail non commité fait partie de ce qu'on relit |
| tout le reste : MR d'un collègue, range, autre branche | oui |
| **la cible est déjà checkoutée dans l'arbre principal** | **oui quand même**, voir ci-dessous |

**Le worktree se monte même quand la cible est déjà sous les yeux.** Une revue dure des dizaines
de minutes et le user continue de travailler pendant ce temps : il peut changer de branche en
plein milieu. Les fichiers de la MR disparaîtraient sous les subagents en cours de lecture, et
leurs rapports seraient à jeter. Le worktree coûte une seconde et rend la revue insensible à ça.
Le monter **avant** de lancer le panel, jamais après.

```bash
git worktree prune                     # purge les worktrees dont le repertoire a disparu
git fetch origin +refs/merge-requests/<iid>/head:refs/mr/<iid>
git worktree add --detach "$SCRATCH/review-mr-<iid>" refs/mr/<iid>
```

`--detach` est obligatoire : sans lui, git refuse de sortir une branche déjà checkoutée dans
l'arbre principal, ce qui est exactement le cas qu'on veut couvrir. Le refspec
`refs/merge-requests/<iid>/head` n'est pas fetché par défaut (le remote n'a que
`+refs/heads/*`), il faut le demander explicitement. Croiser le SHA obtenu avec le `head_sha`
des `diff_refs` : un écart veut dire que la MR a bougé depuis, et ça se dit dans l'en-tête de la
revue plutôt que de se découvrir au moment de coller les threads.

**Ce qui peut manquer dans un worktree neuf.** Si `AGENTS.md`, `.opencode/` ou `.drafts/` sont
exclus par `.git/info/exclude` dans ce projet, un worktree nu n'a ni les conventions du repo, ni
les skills project-local, ni les drafts d'issue. Les liens suivants les y ramènent
uniquement si les sources existent et les destinations sont absentes. Les
ledgers historiques éventuels se lisent directement depuis `$MAIN`.

```bash
for entry in AGENTS.md .opencode .drafts; do
  if [ -e "$MAIN/$entry" ] && [ ! -e "$SCRATCH/review-mr-<iid>/$entry" ] \
      && [ ! -L "$SCRATCH/review-mr-<iid>/$entry" ]; then
    grep -qxF "/$entry" "$MAIN/.git/info/exclude" \
      || printf '/%s\n' "$entry" >> "$MAIN/.git/info/exclude"
    ln -s "$MAIN/$entry" "$SCRATCH/review-mr-<iid>/$entry"
  fi
done
```

Le garde est idempotent et reste local : `.git/info/exclude` n'est jamais commité. Un
`info/exclude` propre au worktree ne marcherait pas, git résout ce fichier depuis le common dir
et pas depuis le `$GIT_DIR` du worktree.

Le worktree se comporte alors comme l'arbre principal, y compris pour les subagents qui vont
chercher les conventions eux-mêmes au lieu de les recevoir. Et le fichier de revue écrit sous
`.drafts/` atterrit dans l'arbre principal, là où il doit être : c'est le seul artefact durable
de l'opération, le reste est jetable.

**Après.** `git worktree remove --force "$SCRATCH/review-mr-<iid>"` une fois la revue écrite. En
cas d'interruption, le `git worktree prune` du lancement suivant fait le ménage. Ne jamais
`git checkout`, `git switch` ni `git stash` dans l'arbre principal : c'est précisément ce que le
worktree existe pour éviter.

## 3. Gates locaux

Avant de briefer qui que ce soit, depuis chaque module touché. `$ROOT` est le worktree quand il
y en a un, l'arbre principal sinon : les gates se lancent sur le code qu'on review, jamais sur
celui d'à côté. **Jamais depuis la racine du repo** si le repo contient des sources non-Go
(templates de doc, scripts) qu'un lint Go planterait dessus et masquerait le reste du rapport.

```bash
cd "$ROOT/<module>" && golangci-lint run
cd "$ROOT" && go build ./...
```

Si le projet définit un lint d'architecture (ex. un fichier `.go-arch-lint.yml`), le lancer
aussi sur le module concerné :

```bash
go-arch-lint check --project-path "$ROOT" --arch-file <module>/.go-arch-lint.yml
```

Deux usages, dans les deux sens :

- **Écarter.** Un finding déjà rouge en CI n'a pas besoin d'un thread : la CI le dit déjà. Il
  part dans l'annexe des findings écartés.
- **Couvrir les trous.** Avant de faire cette hypothèse, vérifier la config de lint du projet :
  `run.tests: false` dans un `.golangci.yml` veut dire que les `*_test.go` ne sont **jamais**
  lintés ; certains packages peuvent n'avoir aucun job CI ; un arch-lint peut n'être branché que
  sur un seul module du repo, laissant sa Dependency Rule non vérifiée ailleurs. Un diff qui
  touche une surface sous-couverte mérite plus d'attention, pas moins — et le savoir vient de la
  config CI/lint du projet, pas d'une hypothèse générique.

Les tests restent à la CI. Si un finding de test a besoin d'un run pour être affirmé, lancer
`go test -race` sur le seul package concerné et citer la sortie.

## 4. Panel

Découpage repris de `implement-issue` (plugin `halys-issue-workflow`) quand il est installé,
avec sa raison : les revues tournent en subagents parce qu'un reviewer qui partage ton contexte
n'est pas indépendant, et l'audit 3GPP, quand il s'applique, reste délégué parce qu'il tire du
texte de spec qui ne doit pas entrer dans ce contexte-ci.

**Délégué**, en parallèle, toujours les trois mêmes :

- `dogmatic-go-reviewer` : idiomatique, Uber style guide, sécurité.
- `annoying-product-owner` : clarté du domaine, naming, qualité des tests.
- `paranoid-perf-gopher` : performance, résilience, scalabilité.

**Délégué, conditionnel** — un quatrième subagent d'audit 3GPP, uniquement si **les deux**
tiennent : le diff touche du code protocolaire/télécom (types 3GPP, GTP-C, PFCP, SBI, NAS...) et
le plugin `halys-3gpp-expert` est installé. Le sous-agent est briefé pour charger la skill
`3gpp-expert` en premier, et la skill `neutrality-audit` du projet en plus si elle existe et
qu'un type du diff est tagué protocol-neutral ou partagé cross-protocole. Ne jamais utiliser le
MCP `3gpp` générique : c'est une source différente, non auditée par cette skill. Si l'une des
deux conditions manque, cette passe est simplement sautée — le dire une ligne dans l'en-tête de
sortie plutôt que de le laisser implicite.

**Inline**, sans subagent : une passe style et architecture, en chargeant `coding-style` (ce
plugin) et, si le projet en définit un, son propre skill ou fichier de conventions
d'architecture (`.claude/skills/<projet>-architecture/SKILL.md`, un `CLAUDE.md`, un
`docs/architecture/` — cette skill ne présume d'aucun nom précis, elle regarde ce que le projet
expose et le cite s'il existe). C'est une checklist de conventions sans source volumineuse à
aller chercher, et le diff est déjà là. Un projet qui documente des patterns interdits ou une
checklist de revue les fait respecter par ce biais.

Aucun agent au-delà de ceux-là.

**Briefing.** Le diff s'écrit **une fois** dans un fichier, avant de briefer qui que ce soit, et
chaque brief porte son chemin :

```bash
# <range> est celui cadré en 1 : base_sha..head_sha sur cible MCP,
# merge-base..HEAD quand il n'y a pas d'argument.
git -C "$ROOT" diff <range> > "$SCRATCH/review-mr-<iid>.diff"
```

Le fichier vit **hors** du worktree : dedans, il sortirait en `??` au premier `git status`. Chaque
brief dit : le diff complet est dans `$SCRATCH/review-mr-<iid>.diff`, lis ce fichier, ne relance
pas `git diff` et ne reconstruis pas le diff à la main. La lecture du code alentour reste permise
quand juger un hunk le demande.

**Pas de seuil de taille.** Un chemin coûte quatre-vingts caractères quel que soit le diff. Une
règle du type « coller inline sous ~600 lignes, sinon donner le range » est calibrée pour un diff
de step dans `implement-issue` ; sur une MR entière elle ne se déclenche jamais, et chaque agent
repart reconstruire le diff de son côté — mesuré sur une MR de 54 fichiers/4901 insertions : les
quatre agents avaient dépensé 221 appels de découverte avant de juger quoi que ce soit.

Chaque brief porte aussi : ce que la MR est censée faire, les critères de succès de l'issue, la liste des
fichiers touchés, les exclusions (`*.gen.go`, `go.sum`), la consigne de sortir des findings avec
`fichier:ligne` exacts, et **`$ROOT` comme racine de lecture du code**. Un reviewer qui lit
l'arbre principal pendant qu'on review une autre branche juge le mauvais code, et ça ne se voit
pas dans son rapport.

**L'audit 3GPP, quand il tourne, se brief en deux passes nommées.** D'abord la complétude : les
types, IEs, messages et procédures que la spec impose sont-ils présents et atteignables. Ensuite
la conformité, en **table walk littéral** : tirer les tables IE par message de la spec
correspondante et parcourir **chaque ligne**, requests **et** responses. Par IE : la présence
M/C/O du code correspond-elle, et cet IE s'applique-t-il sur **cette** interface (un IE valide
sur une interface peut être invalide sur une autre). Plus les plages de validation, la
normalisation mandatée par la spec (casse, ordre des nibbles BCD/TBCD, ordre des octets) et les
cause codes de chaque chemin de rejet.

Une passe par préoccupations (« ce mapping est-il sain ? ») **n'est pas** l'audit. Poser ces
questions au lieu de parcourir les tables laisse passer des bugs de presence-condition jusqu'aux
tests d'interop.

## 5. Dédup par fusion

Plusieurs sources qui regardent le même diff (trois en permanence, jusqu'à cinq quand les passes
conditionnelles du §4 tournent) trouvent le même défaut sous des angles différents. La dédup
n'est pas un filtre qui garde le meilleur exemplaire : c'est une **fusion**.

Clé : `(fichier, ligne ±5, nature du défaut)`.

- **Même défaut, même endroit : un seul thread.** Criticité = le max des sources. Le corps
  compose les meilleures preuves de chacune : l'audit donne la clause de spec, la passe perf
  donne le mode de défaillance sous charge, la passe Go donne l'idiome, le PO donne l'impact
  métier. On ne choisit pas une source gagnante, on écrit le thread que la meilleure source
  aurait écrit si elle avait tout su.
- **Même défaut sur N fichiers : un seul thread**, ancré sur la première occurrence, qui liste
  les N-1 autres avec leur `fichier:ligne`.
- **Défauts différents sur la même ligne : threads séparés.** Ne pas sur-fusionner : un thread
  qui traite trois sujets ne se résout jamais.
- **Déjà rouge en CI** (règle lint, règle arch-lint) : écarté, une ligne dans l'annexe.
- **Déjà tracé comme report assumé** (issue draftée avec son numéro, ou section
  « Findings REJECTED (do not re-open) » du ledger) : écarté, ou rétrogradé à une mention d'une
  ligne. Un point déjà au backlog est un report tracé, pas un manque.
- **Déjà soulevé dans les discussions de la MR** : écarté s'il est résolu ; s'il est ouvert, ne
  pas ouvrir un doublon, référencer le thread existant dans la synthèse.

## 6. Vérification avant émission

Aucun finding ne devient un thread sans passer ces gardes.

1. **Relire le fichier à la ligne citée, sous `$ROOT`.** Si la ligne ne dit pas ce que le finding
   dit, corriger le numéro, ou tuer le finding. Un numéro de ligne faux discrédite toute la
   revue, et un numéro relu dans le mauvais arbre est faux sans en avoir l'air.
   **Les numéros que rendent les subagents sont faux par défaut jusqu'à preuve du contraire** :
   une revue a vu deux passes citer des lignes qui ne correspondaient pas au fichier réel (un
   fichier de 408 lignes cité à `:784`, une ligne réelle à 160 citée `:121`). Le finding était
   juste, l'ancre non. Ne jamais recopier un `fichier:ligne` d'un rapport d'agent dans un thread :
   le retrouver soi-même par `grep -n` sur le symbole que le finding nomme.
2. **Confirmer que la ligne est dans le diff.** Sinon le finding part en section hors-diff,
   marqué *(hors diff, pré-existant, exposé par la MR)*. Il ne se met pas sur le dos de l'auteur,
   mais il est utile pour l'issue qui le traitera.
3. **Finding 3GPP (si la passe a tourné) : la clause vient de la spec en cache**, jamais de
   mémoire. Si la spec manque, voir ci-dessous.
4. **Finding perf : une mesure, un profil, un argument de complexité, ou le benchmark exact qui
   trancherait.** Jamais « plus rapide » sans l'un des quatre.

**Specs absentes du cache** (pertinent seulement si l'audit 3GPP a tourné). En fin d'audit, une
demande **groupée** : lister les specs manquantes avec numéro, release et version cible, et
demander de les déposer dans `~/.cache/3gpp-specs/` (le cache du plugin `halys-3gpp-expert`). Ne
pas demander spec par spec au fil de l'eau. Si elles ne sont pas fournies, le thread sort quand
même, avec le marqueur *(à vérifier contre TS xx.xxx, hors cache)* et une confiance annoncée. Ne
jamais écrire qu'un point est « invérifiable ».

## 7. Format de sortie

Fichier : `.drafts/reviews/REVIEW-<slug>.md`, et la synthèse dans
`.drafts/reviews/REVIEW-<slug>-synthese.md`. Le `slug` vaut `MR<IID>` sur cible MR, le nom de
branche sinon. **Le répertoire est inconditionnel**, quelle que soit la façon dont le projet
range ses drafts d'issues : une revue se retrouve par MR, pas par network function, et la
mélanger aux drafts d'issues rend les deux plus durs à parcourir.

En-tête : cible, SHA, `diff_refs` complets, exclusions, les passes qui ont tourné (§4), et la
légende de criticité.

**Criticité.**

| | Sens |
|---|---|
| 🔴 **Bloquant** | empêche le merge. Bug de correction ou de conformité qui casse l'interop, faille, perte de données, critère de succès de l'issue non atteint, test qui entérine un bug |
| 🟠 **Majeur** | à traiter dans cette MR, ou à re-scoper explicitement dans l'issue. Vrai problème, pas encore un incendie |
| 🟡 **Mineur** | à corriger, non bloquant. Convention repo, godoc, allocation évitable |
| 🔵 **Suggestion** | question ouverte ou cosmétique, libre à l'auteur |

Une criticité peut être conditionnelle, et c'est souvent le bon appel : *« Devient 🔴 Bloquant
dès qu'OAuth2 est activé. »*

**Axe**, un seul par thread, le plus mordant : `conformité`, `archi`, `perf`, `sécurité`,
`tests`, `maintenabilité`.

**La criticité et l'axe doivent survivre au POST.** Le titre `### T07 · L151 · 🔴 Bloquant ·
conformité` sert à naviguer dans le fichier de revue, et il est **retiré par le découpage
de §9** : le corps posté commence à la ligne 3 du bloc, et seule l'ancre de la ligne 2 y est
réinjectée, en fin de corps. Un thread écrit sans plus de précaution arrive donc sur GitLab
sans criticité, dans un onglet Changes où trente commentaires se ressemblent et où rien ne dit
par lequel commencer. C'est le trieur de l'auteur qu'on lui retire.

Donc **la première ligne du corps est un badge**, et c'est une ligne de contenu, pas de
métadonnée :

```markdown
**🔴 Bloquant · conformité** · 4 emplacements
```

Criticité, axe, et le nombre d'emplacements quand le thread en couvre plusieurs (§5) : c'est
précisément le poids qui décide de l'ordre d'attaque. Un thread sur un seul emplacement s'arrête
après l'axe. Une criticité conditionnelle se met là aussi : `**🟠 Majeur · sécurité** · devient
🔴 dès qu'OAuth2 est activé`.

Le badge se répète dans le titre parce que les deux publics diffèrent : le titre sert à celui qui
relit le fichier, le badge à celui qui lit la MR. Les garder cohérents est un contrôle de §9.

**Trois blocs.**

**Bloc 1, commentaire de synthèse**, à coller en commentaire général de la MR. Le TL;DR d'abord :
ce qui tient, puis les familles de blockers numérotées, puis la section « Ce qui est bien », puis
`**Verdict : Changes requested.**` ou les critères Approve que le projet définit (s'il a sa
propre checklist de revue) sinon le jugement du reviewer, puis les actions prioritaires. La
section « ce qui est bien » n'est pas décorative : elle dit à l'auteur ce qu'il ne faut surtout
pas casser au prochain refactor. Elle vit ici et pas en threads inline, parce qu'un thread
« bravo » oblige l'auteur à le résoudre.

**Bloc 2, état vis-à-vis des critères de succès de l'issue.** `| Critère | État | Commentaire |`
avec ✅ / ⚠️ / ❌. C'est le bloc qui attrape le finding qu'aucune passe ne trouve seule, du type
« le critère central de l'issue n'est PAS atteint » : les agents jugent le code écrit, pas
l'écart entre le code et ce qui était demandé.

**Bloc 3, les threads**, groupés par fichier dans l'ordre du diff, ligne croissante, avec un
compteur global `T01..Tn`. Le compteur est le fil : on descend l'onglet Changes une seule fois,
sans jamais remonter. Une phrase de cadrage par fichier quand elle apporte quelque chose.

**Numéroter en dernier.** Trier d'abord la liste complète des findings par
`(rang du fichier dans le diff, ligne croissante)`, puis attribuer `T01..Tn` d'un seul coup, puis
seulement écrire les corps. Numéroter au fil de l'écriture oblige à renuméroter dès qu'un thread
s'insère ou qu'une section se réordonne, et chaque renumérotation doit propager dans le bloc 1,
le bloc 2 et les renvois entre threads. Fait par substitutions successives `T12 -> T13`,
`T13 -> T14`, ça se télescope : sept identifiants peuvent fusionner sur le même numéro. Si un
renumérotage est inévitable, passer par des placeholders uniques en deux temps
(`T12 -> @@A@@`, puis `@@A@@ -> T13`), et finir par un contrôle : les identifiants définis sont
uniques, croissants, et tout renvoi pointe sur un identifiant qui existe.

```markdown
## 4. `network-functions/pgwc-smf/internal/interfaces/sbi/nsmfpdusession/nsmf.go`

Le cœur de l'ingress. C'est là que se joue le critère central de #1369.

### T07 · L151 · 🔴 Bloquant · conformité
<!-- gl-thread id=7f3a1c04 new_path=network-functions/pgwc-smf/internal/interfaces/sbi/nsmfpdusession/nsmf.go old_path=network-functions/pgwc-smf/internal/interfaces/sbi/nsmfpdusession/nsmf.go new_line=151 old_line=- -->

**🔴 Bloquant · conformité**

`PostSmContexts` renvoie un 201 sans header `Location`. TS 29.502 crée la ressource
"Individual SM context" par POST : c'est le `Location` qui porte le `smContextRef` vers l'AMF,
`SmContextCreatedData` n'a pas ce champ. Donc l'AMF n'a aucun moyen de cibler les modify et
release suivants. Et le test d'intégration est vert parce qu'il asserte sur le stub vide :
il entérine le bug.

Fix : `c.Header("Location", c.Request.URL.Path+"/"+result.SessionID.String())` avant le `c.JSON`.
```

Le commentaire `<!-- gl-thread -->` est invisible au rendu GitLab, et c'est lui que §9 consomme
pour poster. **Il repart obligatoirement avec le corps**, réinjecté en fin de note : c'est la
seule marque qui survit côté serveur, donc la seule chose qui rende le round 2 idempotent (§9).
Un corps posté sans son ancre est indiscernable d'un thread neuf à la re-revue, et le run
suivant reposte tout en doublon. Ses champs :

| Champ | Rôle |
|---|---|
| `id` | 8 hex stables, hash de `(new_path, ligne, axe, première phrase)`. C'est la clé d'idempotence : deux runs sur le même finding donnent le même `id` |
| `new_path` / `old_path` | les deux chemins du hunk. Identiques hors rename, et `old_path` = `new_path` sur un fichier ajouté |
| `new_line` / `old_line` | **la paire qui décide si le POST passe ou part en 400.** Ligne ajoutée (`+`) : `new_line` seul, `old_line=-`. Ligne supprimée (`-`) : `old_line` seul. Ligne de contexte inchangée dans un hunk : **les deux**, sinon GitLab refuse |

Cette dernière règle est le piège classique de l'API. Déterminer add / delete / contexte en lisant
le hunk au moment où le thread est écrit, pas au moment de poster : à ce moment-là l'information
n'est plus là.

**Annexes locales**, en fin de fichier, sous un titre qui dit de ne pas les coller :

- **Hors diff** : les findings sur du code pré-existant que la MR expose sans l'avoir écrit.
- **Traçabilité des passes** : quel finding vient de quelle passe. Une convergence à trois passes
  sur un même point est un signal de confiance qui mérite d'être vu.
- **Écartés à la vérification** : faux positifs tués, doublons fusionnés et dans quel thread,
  points déjà rouges en CI, reports déjà tracés. Savoir ce qui a été regardé et rejeté vaut
  autant que ce qui reste.

## 8. Voix

Le texte collé sonne comme le reviewer parlant franchement à un collègue. Direct, précis, oral
quand ça tombe juste. Jamais corporate, jamais tiède.

- **« on »** pour l'équipe et le projet. **« je / mon »** réservé à la responsabilité personnelle
  (« faux positif, mon erreur »). « nous » jamais. Pas de « tu » ni de « vous » adressé à
  l'auteur : le sujet de la phrase, c'est le code.
- **Alterner** la phrase analytique longue qui déroule la chaîne causale, et le verdict de quatre
  mots. *Le test entérine le bug.* *La colonne vertébrale est saine.* *Rien à corriger.*
- **L'antithèse « X, pas Y » en closer** : *c'est un bug de fixture, pas de code* ; *un load test
  modélise N abonnés, pas un seul* ; *report assumé et nommé, pas un oubli*.
- **Oral assumé** quand ça tombe juste : « Bon, franchement », « Alors ici », « nickel »,
  « chapeau », « les trucs », « (et qu'on garde, hein) ». Avec la précision technique intacte.
- **Le désaccord s'énonce en fait, avec sa preuve, jamais en opinion.** « TS 32.255 §5.2.2.11.1
  dit l'inverse. » Quand le raisonnement d'origine était défendable, le dire avant de le
  contredire : *« une déduction raisonnable en l'absence de lecture de TS 32.255 »*. La
  contradiction s'attribue au code ou au document, pas à la personne.
- **Tout thread finit par un fix concret**, souvent la ligne de Go à écrire.
- **Un changement exigé propose toujours l'alternative de report explicite** : « à traiter, ou à
  re-scoper explicitement dans l'issue ». Un report nommé est une décision ; un report tu est une
  dette invisible.
- **Chiffrer le coût** quand c'est possible : « au spike 5000 VUs », « ~3s de round-trip », « un
  vrai CHF rejette ». Pas « cela pourrait poser problème ».

Interdits, parce qu'ils trahissent une revue automatique :

- Les formules qui hedgent : « il serait préférable de », « je suggère de considérer », « il
  semblerait que », « pourrait potentiellement ».
- L'em-dash. Utiliser `:`, `,`, `;`, une parenthèse ou une nouvelle phrase.
- Le sandwich compliment / critique / compliment. Les compliments vont dans le bloc 1.
- Reformuler le code à l'auteur avant de dire quoi que ce soit.
- **Toute mention d'outillage** dans le texte collé : ni nom d'agent, ni skill, ni MCP, ni cache
  local, ni « un grep ne trouve rien ». Le thread cite la clause de spec, le code AVP, le chemin
  de code. C'est exactement pour ça que la traçabilité des passes vit dans une annexe locale.
- **Les renvois `Txx` dans un corps de thread ou dans la synthèse.** Le compteur `T01..Tn` vit
  dans le fichier de revue et sert à le parcourir dans l'ordre. Le titre qui le porte est retiré
  au moment de poster : sur GitLab, `Txx` ne désigne rien. Un renvoi vers un autre thread se fait
  par son `fichier:ligne`, qui est ce que le lecteur a sous les yeux dans l'onglet Changes.
  Attention à la formulation : un `fichier:ligne` est un lieu, pas un nom. « corriger
  `association.go:226` seul » ne veut rien dire. Nommer le défaut, puis situer : « corriger le
  heartbeat (`pfcp/association.go:226`) ». Un remplacement mécanique de `Txx` laisse des phrases
  bancales, il se relit.
- Le jargon francisé. logger, handler, wrappé, store, timeout, back-pressure, endpoint, peer,
  aggregate, fallback, nit restent en anglais. Table complète dans `writing-rules` si le plugin
  `halys-issue-workflow` est installé.

Le même finding, écrit des deux façons :

```markdown
<!-- NON -->
Il semblerait que le handler `PostSmContexts` ne définisse pas le header `Location`.
Il serait préférable de considérer son ajout, car la spécification TS 29.502 pourrait
potentiellement l'exiger. Cela étant, le reste du handler est bien structuré.

<!-- OUI -->
`PostSmContexts` renvoie un 201 sans header `Location`. TS 29.502 crée la ressource
"Individual SM context" par POST : c'est le `Location` qui porte le `smContextRef` vers
l'AMF. Sans lui, tous les modify et release suivants ratent.

Fix : `c.Header("Location", c.Request.URL.Path+"/"+result.SessionID.String())`.
```

Quatre hedges, aucune conséquence, aucun fix et un compliment de politesse contre un fait, sa
clause, son impact et la ligne à écrire.

## 9. Poster sur GitLab

La revue est d'abord un fichier. Poster est une **seconde opération, toujours confirmée**, jamais
un effet de bord du run. Écrire des threads sur la MR de quelqu'un d'autre le notifie et engage
le reviewer : ça se décide, ça ne se subit pas.

### Accès

Vérifier les capacités du serveur MCP `gitlab` chargé. S'il expose les écritures
requises, les utiliser après confirmation. S'il est en lecture seule
(`GITLAB_READ_ONLY_MODE=true`), utiliser le repli HTTP ci-dessous.

- API : `https://gitlab.halys.fr/api/v4`, projet `$PROJECT` (résolu en §1).
- Token et URL : les variables d'environnement `GITLAB_API_URL` et
  `GITLAB_PERSONAL_ACCESS_TOKEN` — les mêmes que consomme le serveur MCP `gitlab`, pour éviter
  une deuxième méthode de configuration. Chacun les alimente comme il veut (export dans le shell,
  gestionnaire de secrets, dérivé d'un `~/.netrc` personnel) : cette skill ne présume que du nom
  des variables, jamais de leur source.
- Si elles ne sont pas dans l'environnement du shell, demander leur configuration
  pour le repli HTTP. Dans OpenCode V2, les variables d'un serveur local se
  configurent sous `mcp.servers.gitlab.environment`, avec des substitutions
  `{env:...}` ; elles ne sont pas nécessairement exportées aux outils shell.
  Ne pas lire automatiquement `~/.claude.json` ni extraire des credentials OAuth
  du stockage OpenCode pour contourner cette séparation.
- Le token ne sort jamais : pas d'`echo`, pas dans une URL, pas en query param. Uniquement dans
  l'en-tête `PRIVATE-TOKEN`, jamais en affichage intermédiaire.
- Si `curl` échoue sur une erreur de certificat, le poste n'a probablement pas la CA interne
  Halys dans son magasin système : passer `--cacert "$NODE_EXTRA_CA_CERTS"` si cette variable est
  définie (c'est celle que le serveur MCP `gitlab` utilise pour la même raison).
- **Un preflight avant tout envoi** : `GET /projects/$PROJECT` doit rendre 200, et le
  `path_with_namespace` renvoyé doit être identique à `$PROJECT_PATH` (§1). Une résolution de
  projet fausse se voit alors sur un appel, pas sur N POST partis en 404.

### Le gate de confirmation

Une fois le fichier écrit, afficher l'état et demander. Rien avant.

```
⏸  MR !691  Resolve "PGW-C/SMF : Client NRF"
   32 threads  ·  🔴 4   🟠 11   🟡 13   🔵 4
   synthèse à coller à la main dans « Add optional summary content » :
     .drafts/reviews/REVIEW-MR691-synthese.md (TL;DR, critères, ce qui est bien, hors-diff)
     soumettre avec « Request changes » publie les threads dans le même geste
   jamais envoyé : traçabilité des passes, findings écartés

   [1] draft notes      invisible et non notifié, tu relis dans l'UI puis tu publies
   [2] dry-run          affiche les payloads, valide les positions, n'envoie rien
   [3] ne rien poster
```

Le premier passage sur une MR se fait en **dry-run**. Il construit chaque payload et vérifie que
la ligne visée tombe bien dans un hunk du diff : c'est là qu'on attrape les 400 avant de les
provoquer.

La validation se fait contre **le diff que GitLab a stocké**, `GET /merge_requests/<iid>/diffs`,
pas contre un `git diff` local. Les deux coïncident quand le `head_sha` du worktree colle aux
`diff_refs`, mais c'est justement ce qu'on veut prouver plutôt que supposer. Parser les hunks de
chaque fichier en `new_line -> (add|ctx, old_line)` et, pour chaque ancre, vérifier les trois
choses d'un coup : la ligne existe dans un hunk, une ligne `add` ne porte pas d'`old_line`, une
ligne `ctx` en porte une.

### Draft notes, puis publication

```bash
POST /projects/$PROJECT/merge_requests/<iid>/draft_notes                 # x N, un par thread
POST /projects/$PROJECT/merge_requests/<iid>/draft_notes/bulk_publish    # une seule fois, apres relecture
```

Tant que `bulk_publish` n'est pas appelé, les notes ne sont visibles que de leur auteur et ne
notifient personne. C'est le filet : une erreur de la skill se supprime dans l'UI sans que
l'équipe l'ait vue. **`bulk_publish` est une confirmation distincte**, jamais enchaînée
automatiquement derrière la création des drafts.

**La note de synthèse ne part pas en draft note : elle se colle dans la boîte de résumé.** Le
modal « Submit your review » de l'UI porte un champ « Add optional summary content » et un choix
Comment / Approve / Request changes. Les deux valent mieux qu'une note de plus dans le tas : le
résumé s'attache à la soumission de la revue, et « Request changes » enregistre l'état du
reviewer sur la MR, ce qu'aucune note ne fait.

Ni l'un ni l'autre n'est atteignable par l'API GitLab REST/GraphQL documentée à ce jour : pas de
`note` ni d'état d'approbation sur `draft_notes/bulk_publish`, pas d'endpoint `reviewer_state`, et
les mutations GraphQL correspondantes n'existent pas. Le modal passe par une route interne du
frontend, hors API documentée — à revérifier si ce comportement compte, les versions GitLab
évoluent.

Donc le flux nominal est : **les N threads en draft notes, la synthèse hors bande.** Écrire les
blocs 1 et 2 dans un fichier à part, `.drafts/reviews/REVIEW-<slug>-synthese.md` (§7), et le dire
dans le gate de confirmation : le user colle ce fichier dans la boîte de résumé et soumet, ce qui
publie les threads dans le même geste. `bulk_publish` ne sert alors que si le user préfère publier
sans passer par le modal.

Un run ultérieur ne doit pas re-poster la synthèse : elle est publiée comme note générale, sans
position, et son ancre `<!-- gl-thread id=synthese<iid> -->` est à conserver en fin de fichier
pour que la relecture d'idempotence de §9 la retrouve dans `GET /discussions`.

**Découper le fichier de revue pour en extraire un corps de thread.** Le piège : découper sur les
seuls titres `### T\d\d` laisse chaque thread **absorber le titre `## N. \`chemin\`` de la section
suivante**, plus sa phrase de cadrage. Ça ne touche que le dernier thread de chaque section, et ça
se voit en clair dans l'UI. Découper sur **les deux** niveaux et vérifier :

```python
BADGE = re.compile(r"^\*\*(🔴 Bloquant|🟠 Majeur|🟡 Mineur|🔵 Suggestion) · \w+\*\*")

for blk in re.split(r"(?m)^(?=### T\d\d |## \d+\. )", bloc3):
    if not blk.startswith("### T"): continue
    lines = blk.rstrip().splitlines()                         # [0]=titre, [1]=ancre
    anchor = lines[1]
    body = "\n".join(lines[2:]).strip()
    assert "\n## " not in "\n" + body, f"{tid} embarque un titre de section"
    assert BADGE.match(body), f"{tid} part sans criticité ni axe"
    assert body.split("·")[0][2:].strip() in lines[0], f"{tid}: badge et titre divergent"
    assert not re.search(r"\bT\d\d\b", body), f"{tid}: renvoi Txx dans un corps posté"

    # l'ancre repart : c'est elle qui rend le round 2 idempotent
    note = body + "\n\n" + anchor
    assert re.search(r"gl-thread id=\w+", note), f"{tid} part sans son ancre"
```

**Le titre est retiré, l'ancre est réinjectée.** C'est le seul point du découpage où une erreur
ne se voit pas : les N POST rendent 201, les positions sont bonnes, le rendu GitLab est correct,
et le défaut n'apparaît qu'au round 2 en repostant N doublons sur la MR d'un collègue. L'ancre va
en fin de corps, où elle ne mange pas le premier écran.

Les `assert` sont le vrai garde-fou : ils coûtent cinq lignes et ils attrapent avant l'envoi ce
qui ne se verrait qu'après.

- **Titre de section embarqué.** Sans lui, un thread sur trois ou quatre absorbe le titre
  `## N. \`chemin\`` de la section suivante. Le test est ancré en début de ligne : un
  `"## " not in body` matche un `## ` en milieu de ligne ou dans un bloc de code, et bloque des
  corps parfaitement valides.
- **Badge absent.** Plus discret parce qu'il ne casse rien : les threads partent, ils sont justes,
  ils sont simplement tous gris. Le défaut ne se voit qu'en ouvrant l'onglet Changes en se
  demandant par où commencer.
- **Badge et titre divergents.** Les deux redisent la même chose à deux publics différents. Si le
  corps évolue et que la criticité change, elle doit changer aux deux endroits, plus dans le
  bloc 1 et dans le bloc 2.
- **Renvoi `Txx` dans le corps** (§8). Sur GitLab le compteur ne désigne rien, puisque le titre
  qui le porte vient d'être retiré.
- **Ancre absente.** Celui qui aurait attrapé le défaut d'idempotence sans avoir à aller lire
  l'état du serveur.

Corps du POST : `note` pour un draft note (et non `body`, qui est le champ des discussions), plus
le `position` :

```
note=<corps du thread + son ancre, sans le titre T07 ni les annexes>
position[position_type]=text
position[base_sha]=<diff_refs.base_sha>
position[start_sha]=<diff_refs.start_sha>
position[head_sha]=<diff_refs.head_sha>
position[new_path]=<new_path de l ancre>
position[old_path]=<old_path de l ancre>
position[new_line]=<new_line>            # et/ou old_line, cf. la regle du §7
```

Poster dans l'ordre `T01..Tn`, séquentiellement, pour que la MR se lise dans l'ordre du diff.

**Corriger un draft se fait par DELETE puis POST, jamais par PUT.**
`PUT /draft_notes/<id>` avec un `note` seul **efface la position** : l'API renvoie ensuite un
`position` à champs tous nuls et le thread devient une note générale, alors que le `line_code`
survit et donne l'illusion que tout va bien. Donc :

```bash
DELETE /projects/$PROJECT/merge_requests/<iid>/draft_notes/<id>     # 204
POST   /projects/$PROJECT/merge_requests/<iid>/draft_notes          # avec note + position complets
```

Et le contrôle d'après-coup se fait sur `position.new_path`, pas sur la présence de l'objet
`position` : GitLab renvoie **toujours** un objet, rempli de `null` quand la note n'est pas
positionnée. Un `if d.get("position")` est vrai pour une note générale et ne prouve rien.

### Idempotence et round 2

Le corps posté embarque son ancre, donc son `id`. Avant tout envoi, lire l'existant et collecter
les `id` déjà présents : `GET .../discussions` (paginé) **et** `GET .../draft_notes`, parce qu'un
draft non publié compte déjà comme posté.

Sur une re-revue, trois cas et un compte rendu :

- **Finding inchangé, déjà posté** : sauté. Aucun doublon, jamais.
- **Finding corrigé depuis** : réponse dans le thread existant,
  `POST /discussions/<discussion_id>/notes`, dans le format `✅ vérifié corrigé sur <sha8>`. La
  résolution du thread (`PUT /discussions/<id>?resolved=true`) est proposée dans le gate de
  confirmation, jamais automatique : fermer le thread d'un autre est une décision de reviewer.
- **Finding nouveau** : posté. Et s'il est né du fix pass, le dire dans le corps. « le fix a
  introduit trois régressions » est le finding le plus utile d'un round 2, il ne se noie pas au
  milieu des autres.

Compte rendu final : `sautés N · répondus N · nouveaux N`, avec les régressions listées à part.

### Ce qui ne part jamais

Les annexes locales. La traçabilité des passes nomme les agents, les findings écartés nomment ce
qui a été rejeté et pourquoi : les deux violent « énoncer le fait, jamais l'outillage ». Les
findings hors-diff, eux, partent dans la note de synthèse, en section informative : ils n'ont pas
de ligne où s'ancrer et ils sont utiles à l'auteur.

### Échecs

- **400 sur une note positionnée** : re-tenter en note non positionnée dont le corps commence par
  `` `chemin:ligne` ``, pour qu'elle reste actionnable. Compter les replis et les annoncer.
- **Distinguer 4xx et erreur de connexion.** Un `4xx` est définitif, il part au repli. Une coupure
  réseau ne l'est pas : `TLSV1_ALERT_INTERNAL_ERROR`, timeout, reset. Ne pas attraper seulement
  `HTTPError` et s'arrêter sur une stack trace à moitié posté. Attraper `URLError`, `ssl.SSLError`
  et `TimeoutError`, et re-tenter trois ou quatre fois avec un backoff court.
- **Après toute interruption, relire l'état du serveur avant de reprendre.** `GET /draft_notes`,
  extraire les `id` d'ancre déjà présents, et ne reposter que le complément. Ne jamais déduire de
  son propre log ce qui est parti : le log dit ce qui a été tenté, pas ce qui a abouti.
- **Trois échecs consécutifs** : arrêter le lot, dire ce qui est parti et ce qui ne l'est pas.
  Un envoi à moitié fait qu'on croit complet est pire qu'un envoi interrompu.
- Ne jamais laisser tomber un thread en silence.
- Un draft parti à tort se retire par `DELETE .../draft_notes/<id>` (204), tant que
  `bulk_publish` n'a pas été appelé. C'est réparable sans que personne l'ait vu : d'où le choix
  du draft plutôt que de la discussion directe.

## Final checklist

- [ ] Chaque thread a un `fichier:ligne` relu dans le code réel, pas recopié d'un agent.
- [ ] Chaque thread a une criticité, un axe, et un fix concret.
- [ ] La criticité et l'axe sont dans le **corps** du thread, pas seulement dans le titre : le
      titre ne part pas sur GitLab. Badge en première ligne, cohérent avec le titre.
- [ ] Zéro doublon : un défaut répété sur N fichiers est **un** thread listant les N emplacements.
- [ ] L'ordre `T01..Tn` suit l'onglet Changes, ligne croissante, sans retour en arrière.
- [ ] Chaque thread porte son ancre `<!-- gl-thread id=... -->` et l'en-tête porte les `diff_refs`.
- [ ] Aucun finding déjà rouge en CI, déjà tracé au backlog, ou déjà résolu en discussion.
- [ ] Les findings hors diff sont marqués et rangés à part.
- [ ] Section « ce qui est bien » présente et sincère, dans le bloc 1.
- [ ] Verdict énoncé.
- [ ] Aucun em-dash, aucun terme francisé, aucune mention d'outillage hors annexe.
- [ ] Les specs manquantes (si l'audit 3GPP a tourné) ont fait l'objet d'une demande groupée.
- [ ] L'arbre principal est intact : aucun `checkout`, `switch` ni `stash` dessus, `git status`
      identique avant et après.
- [ ] Le worktree jetable est supprimé, et la revue est bien dans `.drafts/` de l'arbre principal.
- [ ] Rien n'a été posté sans confirmation explicite, et `bulk_publish` a été confirmé à part.
- [ ] Chaque ancre porte un `id`, et la paire `new_line` / `old_line` correspond au type de ligne.
- [ ] Les `id` déjà présents sur la MR (discussions **et** drafts) ont été relus avant d'envoyer.
- [ ] Aucune annexe locale n'est partie sur GitLab.
- [ ] Les replis en note non positionnée et les échecs sont comptés et annoncés.
- [ ] Aucun corps de thread ne contient un titre `## `, et chacun ouvre sur son badge : les cinq
      `assert` du découpage sont passés.
- [ ] Chaque corps posté embarque son ancre, vérifiée par `assert` avant l'envoi et relue côté
      serveur après : c'est elle, et elle seule, qui rend le round 2 idempotent.
- [ ] Aucun renvoi `Txx` dans un corps de thread ni dans la synthèse : les renvois se font par
      `fichier:ligne`, avec le défaut nommé avant le lieu.
- [ ] Après envoi, relecture serveur : chaque draft a son ancre, son corps attendu, et un
      `position.new_path` non nul. Un `PUT` de correction a été remplacé par DELETE + POST.
- [ ] Le nombre de drafts sur le serveur correspond au nombre de threads (la synthèse n'est pas
      un draft, elle se colle dans la boîte de résumé du modal), et
      `GET /discussions` ne montre encore aucune ancre publiée.

## Voir aussi

- [`coding-style`](../coding-style/SKILL.md) : chargée inline pour la passe style (§4)
- Si `halys-3gpp-expert` est installé : sa skill `3gpp-expert`, chargée par le sous-agent d'audit
  3GPP conditionnel (§4)
- Si `halys-issue-workflow` est installé : sa skill `implement-issue` (découpage du panel repris
  en §4), son `writing-rules` (table du jargon à ne pas franciser, §8) et son ledger
  `.claude/progress/` (matériel de dédup, §1)
- Le projet cible peut définir sa propre skill/doc d'architecture (patterns interdits, checklist
  de revue) et une skill `neutrality-audit` : cette skill les charge s'ils existent (§4, §7)
