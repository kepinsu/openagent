# Modèles

**_Suivre les guidelines définies par Uber :_** [Uber Go Style Guide (EN)](https://github.com/uber-go/guide/blob/master/style.md)

## Placement dans `models.go`

**_Placer/Déplacer les modèles dans un fichier `models.go`_**, fichier ne contenant **aucune logique** — uniquement des définitions de structs et leurs tags.

### ✅ Bon

```go
// models.go

// User represents the basic infos about the user
type User struct {
    ID        int64     `json:"id"`
    Email     string    `json:"email"`
    CreatedAt time.Time `json:"createdAt"`
    Status    Status    `json:"status"`
}
```

### ❌ Mauvais

```go
// models.go

func getUserEmail(usr User) string { // no logic should be in models.go file
    return usr.Email
}

type User struct {
    ID        int64     `json:"ID"`
    Email     string    `json:"Email"`
    CreatedAt time.Time `json:"CreatedAt"`
    Status    Status    `json:"STATUS"`
}
```

## Tags des champs

Pour les tags internes, toujours utiliser :

- du `camelCase` pour les tags `JSON` ;
- du `snake_case` pour les tags `YAML`.

### ✅ Bon

```go
// User represents the basic infos about the user
type User struct {
    ID        int64     `json:"id"`
    Email     string    `json:"email"`
    CreatedAt time.Time `json:"createdAt"`
    Status    Status    `json:"status"`
}
```

### ❌ Mauvais

```go
type User struct {
    // no fields are in camelCase
    ID        int64     `json:"ID"`
    Email     string    `json:"Email"`
    CreatedAt time.Time `json:"CreatedAt"`
    Status    Status    `json:"STATUS"`
}
```

## Ordre des modèles

**_Ordonner les modèles_** par séquentialité (ordre de dépendance), pour plus de clarté : les structs publiques d'abord, puis les structs privées qu'elles possèdent. Même principe de séquentialité / ownership que pour [l'organisation du code](./code-organization.md).

### ✅ Bon

```go
// User represents the basic infos about the user
type User struct { // public struct
    ID           int64        `json:"id"`
    Email        string       `json:"email"`
    CreatedAt    time.Time    `json:"createdAt"`
    Status       Status       `json:"status"`
    Localisation localisation `json:"localisation"`
}

// localisation represents the localisation of the user
type localisation struct { // private struct (owned by the public struct)
    Country string `json:"country"`
    State   string `json:"state"`
    Address string `json:"address"`
}
```

### ❌ Mauvais

```go
// localisation represents the localisation of the user
type localisation struct { // private struct (owned by the public struct)
    Country string `json:"country"`
    State   string `json:"state"`
    Address string `json:"address"`
}

// User represents the basic infos about the user
type User struct { // public struct
    ID           int64        `json:"id"`
    Email        string       `json:"email"`
    CreatedAt    time.Time    `json:"createdAt"`
    Status       Status       `json:"status"`
    Localisation localisation `json:"localisation"`
}
```

## Exception : modèles d'erreurs

Une exception est faite pour le modèle des erreurs : il suit les règles de [la gestion des erreurs](./error-handling.md) (il est placé dans `error.go`, pas dans `models.go`).
