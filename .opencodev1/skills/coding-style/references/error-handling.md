# Gestion des erreurs

## Les erreurs statiques

Les erreurs statiques sont les erreurs qui sont définies par une string (cette string peut être dynamique).

### Nommage des erreurs statiques

Contrairement aux constantes (voir la section [Constantes](./constants.md)), la liste des erreurs statiques doit rester dans le même fichier que la méthode qui les utilise. Les erreurs sont généralement stockées en variable globale : selon que ces erreurs sont internes ou exposées, utiliser le préfixe `err` (interne) ou `Err` (exposée) pour ces variables.

### ✅ Bon

```go
var (
    ErrMissingTotoField = errors.New("missing toto field")
    ErrMissingAnotherField = errors.New("missing another field")
)
```

### ❌ Mauvais

```go
var (
    _ErrMissingTotoField = errors.New("missing toto field")
    _ErrMissingAnotherField = errors.New("missing another field")
)
```

### Utilisation des erreurs statiques

Les erreurs statiques doivent être utilisées **uniquement** pour :

- Les méthodes de Decode
- Les méthodes d'Encode
- La lecture de fichiers
- Le lancement de service

**Règle clé :** pour faire simple, tant qu'il n'y a pas d'échange avec un autre service.

_Exemple :_

```go
var (
    ErrMissingTotoField = errors.New("missing toto field")
    ErrMissingAnotherField = errors.New("missing another field")
)

// DataModel represent the database for Main table
type DataModel struct {
    Toto         string
    AnotherField ...
}

// SanityCheck check the DataModel and return a static error if the structure had any problem.
//
// - the error can be ErrMissingTotoField or ErrMissingAnotherField
func (s DataModel) SanityCheck() error {
    if s.Toto == "" {
        return ErrMissingTotoField
    }
    if s.AnotherField == nil {
        return ErrMissingAnotherField
    }
    return nil
}
```

> **Attention :** la déclaration du `DataModel` doit être, comme indiqué dans la section [Modèles](./models.md), dans un fichier `models.go`, mais la liste des erreurs et le `SanityCheck()` doivent être dans un fichier `datamodel.go`.

## Les erreurs à structure

Les erreurs à structure sont en réalité les erreurs avec une structure permettant d'ajouter du contexte à une procédure, par exemple.

### Nommage des erreurs à structure

Suivre les guidelines définies par Uber : [Uber Go Style Guide (EN)](https://github.com/uber-go/guide/blob/master/style.md#error-naming).

**Exception :** pour les erreurs normées par les standards (RFC, 3GPP, etc.), si une erreur est renvoyée par une API, conserver le même nom. Par exemple, dans les standards 3GPP pour la 5G, les API retournent un _ProblemDetails_ : il faut alors garder ce type `ProblemDetails`.

### Utilisation des erreurs à structure

Les erreurs à structure doivent être utilisées pour les cas suivants :

- Un échange entre deux services
- Une erreur rencontrée dans un Handler

_Exemple :_

```go
// FailedProcessError represents the stack explaining why the process failed
type FailedProcessError struct {
    Cause string
    Error error
    // ...
}

// Error return a string for the error interface
func (f FailedProcessError) Error() string { return "" }

// process apply a specific process for by example gtp handler.
//
// Any returned error will be of type [*yourpackage.FailedProcessError].
func process() error {
    if err {
        return &FailedProcessError{
            // ...
        }
    }
    // ...
    return nil
}
```

### Règles complémentaires

- **Une seule** erreur à structure par service/interface
- Si une méthode renvoie une erreur à structure via l'interface `error`, indiquer dans le format godoc que la méthode renvoie une structure
- Cette structure doit être dans un fichier `error.go`

## Wrapping des erreurs (3 sens autorisés uniquement)

Le wrapping des erreurs doit se faire uniquement en trois sens :

- Erreur statique vers erreur statique
- Erreur statique vers erreur à structure
- Erreur à structure vers erreur à structure

> **Sens INTERDIT :** erreur à structure vers erreur statique (ne jamais wrapper une erreur à structure dans une erreur statique).

### 1. Erreur statique vers erreur statique

Pour passer l'erreur d'une string à une autre string, utiliser `fmt.Errorf("contexte: %w", err)`, mais faire en sorte que les erreurs se superposent comme une pile (chaque niveau ajoute son propre préfixe, sans répéter celui des autres).

### ❌ Mauvais

```go
var ErrMissingDBAddr = errors.New("missing addr fields")

type Config struct {
    DB DB `yaml:"db"`
}

type DB struct {
    Addr string `yaml:"addr"`
}

func (c Config) SanityCheck() error {
    if err := c.DB.SanityCheck(); err != nil {
        return fmt.Errorf("bad config: %w", err)
    }
    return nil
}

func (d DB) SanityCheck() error {
    if d.Addr == "" {
        return fmt.Errorf("bad config: %w", ErrMissingDBAddr)
    }
    return nil
}
```

À l'affichage de l'erreur, on obtient :

```bash
    bad config: bad config: missing addr fields
```

### ✅ Bon

```go
var ErrMissingDBAddr = errors.New("missing addr fields")

type Config struct {
    DB DB `yaml:"db"`
}

type DB struct {
    Addr string `yaml:"addr"`
}

func (c Config) SanityCheck() error {
    if err := c.DB.SanityCheck(); err != nil {
        return fmt.Errorf("config: %w", err)
    }
    return nil
}

func (d DB) SanityCheck() error {
    if d.Addr == "" {
        return fmt.Errorf("db: %w", ErrMissingDBAddr)
    }
    return nil
}
```

À l'affichage de l'erreur, on obtient :

```bash
    config: db: missing addr fields
```

### 2. Erreur statique vers erreur à structure

Quand on wrap une erreur statique vers une erreur à structure, faire attention à ne pas perdre le contexte de la première erreur. Utiliser un champ `error` dans la structure pour la convertir.

_Exemple :_

**models.go**

```go
type Config struct {
    DB DB `yaml:"db"`
}

type DB struct {
    Addr string `yaml:"addr"`
}
```

**error.go**

```go
type SendConfigError struct {
    Error     error
    ProcessID string
}

// Error return a string for the error interface
func (f SendConfigError) Error() string { return "" }
```

**config.go**

```go
var ErrMissingDBAddr = errors.New("missing addr fields")

func (c Config) SanityCheck() error {
    if err := c.DB.SanityCheck(); err != nil {
        return fmt.Errorf("config: %w", err)
    }
    return nil
}

func (d DB) SanityCheck() error {
    if d.Addr == "" {
        return fmt.Errorf("db: %w", ErrMissingDBAddr)
    }
    return nil
}
```

**process.go**

```go
// sendConfig is the process by which the manager service sends the configuration to the router service
//
// Any returned error will be of type [*yourpackage.SendConfigError].
func sendConfig(processID string) error {
    var c Config
    if err := c.SanityCheck(); err != nil {
        return &SendConfigError{
            Error:     err,
            ProcessID: processID,
        }
    }
    // ...
    return nil
}
```

### 3. Erreur à structure vers erreur à structure

Quand on wrap une erreur à structure vers une autre erreur à structure, faire attention à ne pas perdre le contexte de la première erreur. Utiliser un champ `error` dans la structure pour la convertir.

_Exemple :_

```go
type HandlerError struct {
    Error error
    Cause string
}

type SendConfigError struct {
    Error     error
    ProcessID string
}

// Error return a string for the error interface
func (f HandlerError) Error() string { return "" }

// Error return a string for the error interface
func (f SendConfigError) Error() string { return "" }

// handler is the process that handles the request
//
// Any returned error will be of type [*yourpackage.HandlerError].
func handler() error {
    processID := "test"
    if err := sendConfig(processID); err != nil {
        return &HandlerError{
            Error: err,
            //  Inject the cause you need
            Cause: "...",
        }
    }
    // ...
    return nil
}

// sendConfig is the process by which the manager service sends the configuration to the router service
//
// Any returned error will be of type [*yourpackage.SendConfigError].
func sendConfig(processID string) error {
    var c Config
    if err := c.SanityCheck(); err != nil {
        return &SendConfigError{
            Error:     err,
            ProcessID: processID,
        }
    }
    // ...
    return nil
}
```

## Unwrapping des erreurs

Cette section s'applique uniquement au moment de créer une erreur contextualisée pour un handler à partir d'autres erreurs.

Utiliser les méthodes que la librairie standard propose, à savoir :

- `errors.As()` pour les erreurs à structure
- `errors.Is()` pour les erreurs statiques

### Exemple — checker la bonne erreur

Ici, le code pour décoder un fichier de configuration par exemple :

```go
var (
    ErrMissingDBAddr = errors.New("missing addr fields")
)

type Config struct {
    DB DB `yaml:"db"`
}

type DB struct {
    Addr string `yaml:"addr"`
}

func New(path string) (*Config, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("open configuration file: %w", err)
	}
	defer func() {
		_ = f.Close()
	}()

	return decodeCfg(f)
}

func decodeCfg(r io.Reader) (*Config, error) {
	cfg := &Config{}
	err := yaml.NewDecoder(r).Decode(cfg)
	if err != nil {
		return nil, fmt.Errorf("could not decode configuration file: %w", err)
	}
	// Add sanity check for HTTP block
	if err := cfg.SanityCheck(); err != nil {
		return nil, err
	}

	return cfg, nil
}

func (c Config) SanityCheck() error {
    if err := c.DB.SanityCheck(); err != nil {
        return fmt.Errorf("config: %w", err)
    }
    return nil
}

func (d DB) SanityCheck() error {
    if d.Addr == "" {
        return fmt.Errorf("db: %w", ErrMissingDBAddr)
    }
    return nil
}
```

Ainsi, pour l'unwrap des erreurs, on aurait quelque chose qui ressemble à :

```go
func main() {
    cfg, err := New()
    if err != nil {
        var (
            failureOpen *os.PathError
            failureRead *yaml.TypeError
        )
        switch {
        case errors.As(err, &failureOpen):
            // ...
        case errors.Is(err, ErrMissingDBAddr):
            // ...
        case errors.As(err, &failureRead):
            // ...
        }
    }
    // ...
}
```

L'utilisation de la méthode `Unwrap() error` peut également être envisagée si cela simplifie la gestion des erreurs.
