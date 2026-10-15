# Constantes

## Constantes exportées

- Utiliser du `PascalCase` pour les consts publiques (exportées)
- Utiliser du `camelCase` pour les consts privées (internes), et les nommer en commençant par un `_`

### ✅ Bon

```go
const ExternalBuffer = 2048 // external, PascalCase
const _internalBuffer = 4096 // internal, camelCase, '_' at the start
```

### ❌ Mauvais

```go
const External_buffer = 2048 // external, not PascalCase
const INTERNAL_BUFFER = 4096 // internal, not camelCase, no '_' at the start
```

## Constantes internes : exporter uniquement ce qui a besoin de l'être

N'exporter que les constantes qui doivent être accessibles depuis l'extérieur du package.

### ✅ Bon

```go
const _internalBuffer = 4096 // internal, not exported
```

### ❌ Mauvais

```go
const InternalBuffer = 4096 // exported for no reason
```

## Iota : éviter les jumps

Utiliser le blank identifier `_` uniquement pour la valeur initiale, sans sauter de valeurs d'iota en cours de bloc.

### ✅ Bon

```go
// Container ID definitions
const ( // no iota jumps
	_ uint16 = iota
	ContIDPDUSessionID
	ContIDEthernetFramePayloadMTURequest
)
```

### ❌ Mauvais

```go
// Container ID definitions
const (
	_ uint16 = iota
	ContIDPDUSessionID
	_ // jump
	_ // jump
	ContIDEthernetFramePayloadMTURequest
)
```
