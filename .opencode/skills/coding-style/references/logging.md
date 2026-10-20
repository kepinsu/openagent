# Logs

Utiliser le logger [zap](https://github.com/uber-go/zap) avec un format standard.

## Format standard

- **Messages :** en `lowercase`, commençant par un verbe
- **Clés :** en `camelCase`
- **Messages d'erreur :** commençant par un énoncé d'erreur : `failed to:`, `could not:`, ... (liste ouverte, d'autres préfixes du même type sont admis)

Ne pas confondre les clés de log zap, en `camelCase`, avec les labels Prometheus, en `snake_case` (voir [metrics.md](./metrics.md)).

### ✅ Bon

```go
logger.Info(
    "redirects gtp message", // lowercase
    zap.String("sessionId", sessionId), // keys with camelCase
    zap.Int("gtpVersion", 1), // keys with camelCase
)
logger.Error(
    "failed to: pull comfone configuration", // error message begins with an error statement
    zap.Error(err),
)
```

### ❌ Mauvais

```go
logger.Info(
    "Message CallBack", // not lowercase
    zap.String("sessionID", sessionId), // keys not with camelCase
    zap.Int("GTPVersion", 1), // keys not with camelCase
)
logger.Error(
    "comfone config could not be retrieved", // error message does not begin with an error statement
    zap.Error(err),
)
```

## Niveaux de log et contextes fonctionnels

Utiliser des contextes fonctionnels dans les logs :

- **Logs minimaux :** si tout se passe bien, il ne doit pas y avoir de logs — les logs de flux général vont en niveau `debug`
- **Niveau `info` :** logs avec un code d'erreur `4xx` côté serveur (p. ex. `400`, `404`), c'est-à-dire les erreurs client attendues
- **Niveau `error` :** échecs réels — penser à quels sont les éléments fonctionnels nécessaires pour déboguer l'erreur en tant qu'humain

### ✅ Bon

```go
func handler() {
    logger.Debug( // general log, debug level
        "receive gtp message",
        zap.String("request", req),
    )

    // ...

    if err := getData(); err != nil {
        if err == "404" { // i.e. not found
            logger.Info( // 400 code error, info level
                "could not: get <source> data",
                zap.Error(err),
            )
        }
    }

    if err := processRequest(); err != nil {
        logger.Error(
            "failed to: process message",
            zap.Error(err),
            // any data related to the context of the error
        )
    }

    // ...

    logger.Debug( // general log, debug level
        "forward gtp message",
        zap.String("response", resp),
    )
}
```

### ❌ Mauvais

```go
func handler() {
    logger.Info( // non-essential message at info level
        "receive gtp message",
        zap.String("request", req),
    )

    // ...

    if err := getData(); err != nil {
        logger.Error( // 400 code error, should be info level
            "could not: get <source> data",
            zap.Error(err),
        )
    }

    // ...

    logger.Info( // non-essential message at info level
        "forward gtp message",
        zap.String("response", resp),
    )
}
```

## Éviter les logs en double

Logger une seule fois, à la frontière (le handler), pas dans les fonctions appelées.

Le bon exemple est celui de la section précédente : `handler()` est le seul endroit qui logge (réception/transmission en `debug`, erreur 4xx en `info`, échec en `error`), les fonctions appelées comme `getData()` ne loggent pas.

### ❌ Mauvais

```go
func handler() {
    logger.Info( // non-essential message at info level
        "receive gtp message",
        zap.String("request", req),
    )

    // ...

    if err := getData(); err != nil {
        logger.Error(
            "could not: get <source> data",
            zap.Error(err),
        )
    }

    if err := processRequest(); err != nil {
        logger.Error( // too much or too little logs
            "failed to: process message",
            zap.Error(err),
        )
    }

    // ...

    logger.Info( // non-essential message at info level
        "forward gtp message",
        zap.String("response", resp),
    )
}

func getData() error {
    // ...
    logger.Info("retrieve data success") // duplicate log
}
```

**Exception :** il arrive parfois qu'un log doive être émis en doublon pour la même information — l'interdiction n'est pas absolue.

## Utilisation simultanée de logs `info` et de métriques

Être attentif sur les cas d'utilisation simultanée de logs `info` et de métriques : s'assurer de ne pas tracer deux fois la même information (une fois dans le log, une fois dans la métrique).

_Exemple :_

```go
func handler() {

    // ...

    logger.Info( // log
        "processed gtp message",
        zap.String("message", msg),
    )
    metrics.IncrementHandlersProcedure( // metric
        // ...
    )

    // ...
}
```

Voir [metrics.md](./metrics.md) pour l'exemple complet de métrique.
