# Organisation du code

## Séquentialité des appels

**_Garder la séquentialité des appels_** dans le fichier, pour la lisibilité : les fonctions d'entrée viennent en premier, puis les appels privés dans l'ordre d'appel, puis les appels privés « possédés » (owned) à la fin.

### ✅ Bon

```go
// process.go

func ProcessData() { // entry call
    processCandles()
}

func processCandles() { // 1st private call
    getCandles()
    readCandles()
    exportCandler()
}

func getCandles() {} // 2nd private called (owned by 1st private call)

func readCandles() {} // 3rd private called (owned by 1st private call)

func exportCandler() {} // 4th private called (owned by 1st private call)
```

### ❌ Mauvais

```go
// process.go

func processCandles() { // 1st private call
    getCandles()
    readCandles()
    exportCandler()
}

func ProcessData() { // entry call
    processCandles()
}

func exportCandler() {} // 4th private called (owned by 1st private call)

func getCandles() {} // 2nd private called (owned by 1st private call)

func readCandles() {} // 3rd private called (owned by 1st private call)
```

La même logique d'ordonnancement s'applique aux structs : voir [models.md](./models.md).

## Commentaires godoc

**_Utiliser des commentaires au format godoc_** afin de produire une documentation auto-générée. Toutes les fonctions et tous les types exportés DOIVENT avoir un commentaire godoc.

### ✅ Bon

```go
// process.go

// ProcessData retrieves and unifies the data over the months
func ProcessData() {
    ...
}
```

### ❌ Mauvais

```go
// process.go

func ProcessData() {
    ...
}
```
