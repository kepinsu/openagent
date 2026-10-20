 Go Code Standards

## Naming Conventions

### Packages
- Use lowercase names, no underscores or camelCase
- Prefer short, descriptive names
- Avoid generic names like `util`, `common`, `helper`
- Package name should reflect its purpose

```go
// ✅ Good
package user
package httpclient

// ❌ Bad
package UserService
package http_client
package utils
```

### Variables and Functions

Use camelCase for names (exported or not)
Exported names start with uppercase
Unexported names start with lowercase
Prefer short names for local variables (i, j, err, ok)
Avoid non-standard abbreviations
```go
// ✅ Good
var userCount int
func GetUserByID(id int) (*User, error)
var isActive bool

// ❌ Bad
var usrCnt int
func GetUserById(id int) (*User, error)
var is_active bool
```

### Constants

Use camelCase or PascalCase
Type-specific constants can be typed
```go
// ✅ Good
const maxRetries = 3
const DefaultTimeout = 30 * time.Second

type Status string
const (
    StatusActive   Status = "active"
    StatusInactive Status = "inactive"
)
```

### Interfaces

Single-method interfaces follow the MethodName-er convention
For multi-method interfaces, use a descriptive name
```go
// ✅ Good
type Reader interface {
    Read(p []byte) (n int, err error)
}

type UserRepository interface {
    Save(user *User) error
    FindByID(id string) (*User, error)
}
```

## Code Structure

### File Organization

One file per package (except tests)
Exported types first
Exported functions next
Unexported functions last
Tests in separate _test.go files
Declaration Order in a File

Package declaration
Imports
Constants
Global variables
Exported types
Exported functions
Unexported types
Unexported functions
```go
package user

import (
    "context"
    "time"
)

const (
    maxLoginAttempts = 5
    sessionDuration  = 24 * time.Hour
)

var (
    ErrUserNotFound = errors.New("user not found")
)

type User struct {
    ID        string
    Email     string
    CreatedAt time.Time
}

func NewUser(email string) *User {
    return &User{
        ID:        uuid.New().String(),
        Email:     email,
        CreatedAt: time.Now(),
    }
}

func (u *User) IsValid() bool {
    return u.Email != ""
}

type userValidator struct {
    // ...
}

func (v *userValidator) validate(email string) error {
    // ...
}
```

### Error Handling

Core Principles

Always handle errors (never ignore with _)
Return errors to the caller with appropriate context
Use fmt.Errorf with %w for wrapping
Create sentinel errors for specific cases
```go
// ✅ Good
func GetUser(id string) (*User, error) {
    user, err := db.Find(id)
    if err != nil {
        return nil, fmt.Errorf("failed to get user %s: %w", id, err)
    }
    return user, nil
}

// ❌ Bad
func GetUser(id string) (*User, error) {
    user, _ := db.Find(id) // Ignoring error
    return user, nil
}
```

### Sentinel Errors

```go
var (
    ErrUserNotFound  = errors.New("user not found")
    ErrInvalidInput  = errors.New("invalid input")
    ErrUnauthorized  = errors.New("unauthorized")
)

// Usage
if errors.Is(err, ErrUserNotFound) {
    // Handle specifically
}
```

### Error Types

```go
// Custom error type for more context
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation failed on %s: %s", e.Field, e.Message)
}
```

### Concurrency

Goroutines

Always know when a goroutine terminates
Use channels or sync.WaitGroup for synchronization
Avoid unbounded goroutines
Use contexts for cancellation
```go
// ✅ Good
func processUsers(ctx context.Context, users []User) error {
    var wg sync.WaitGroup
    errCh := make(chan error, len(users))
    
    for _, u := range users {
        wg.Add(1)
        go func(user User) {
            defer wg.Done()
            if err := processUser(ctx, user); err != nil {
                errCh <- err
            }
        }(u)
    }
    
    go func() {
        wg.Wait()
        close(errCh)
    }()
    
    for err := range errCh {
        return err
    }
    return nil
}
```

### Channels

Use buffered channels when capacity is known
Always close channels when done sending
Don't close a channel from the receiver side
```go
// ✅ Good
ch := make(chan int, 10)
go func() {
    for i := 0; i < 10; i++ {
        ch <- i
    }
    close(ch)
}()

for v := range ch {
    fmt.Println(v)
}
```

### Mutexes

```go
// ✅ Good
type Counter struct {
    mu    sync.Mutex
    value int
}

func (c *Counter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.value++
}
```

### Performance

#### Memory Allocation

Pre-allocate slices when size is known
Avoid allocations in critical loops
Use sync.Pool for frequently allocated objects
```go
// ✅ Good - Pre-allocated slice
users := make([]User, 0, expectedSize)

// ❌ Bad - Repeated reallocation
var users []User
for i := 0; i < 1000; i++ {
    users = append(users, User{}) // Can cause multiple reallocations
}
```

#### String Concatenation

```go
// ✅ Good - For many concatenations
var builder strings.Builder
for i := 0; i < 1000; i++ {
    builder.WriteString(strconv.Itoa(i))
}
result := builder.String()

// ❌ Bad - For many concatenations
var result string
for i := 0; i < 1000; i++ {
    result += strconv.Itoa(i) // O(n²) complexity
}
```

#### Avoid Reflection When Possible

```go
// ❌ Bad - Uses reflection
json.Unmarshal(data, &user)

// ✅ Good - Use code generation or specific parsing
user, err := parseUser(data)
Testing

Test Structure

Use *testing.T for tests
Use *testing.B for benchmarks
Follow the pattern: func TestXxx(t *testing.T)
Table-driven tests are preferred
go
// ✅ Good - Table-driven test
func TestAdd(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive", 2, 3, 5},
        {"negative", -1, -2, -3},
        {"zero", 0, 0, 0},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := Add(tt.a, tt.b)
            if result != tt.expected {
                t.Errorf("Add(%d, %d) = %d, want %d", 
                    tt.a, tt.b, result, tt.expected)
            }
        })
    }
}
```

### Mocking

Use interfaces to enable mocking
Prefer simple manual mocks over complex frameworks
```go
// ✅ Good
type UserRepository interface {
    Get(id string) (*User, error)
}

type mockUserRepo struct {
    user *User
    err  error
}

func (m *mockUserRepo) Get(id string) (*User, error) {
    return m.user, m.err
}
```

### Subtests

```go
func TestProcess(t *testing.T) {
    t.Run("success case", func(t *testing.T) {
        // Test happy path
    })
    
    t.Run("error case", func(t *testing.T) {
        // Test error path
    })
}
```

### Dependency Management

#### Modules

Use Go modules (go.mod and go.sum)
Keep dependencies minimal
Regularly update dependencies
Pin to specific versions when necessary
Imports

Group imports: standard library, third-party, internal
Use explicit import paths
Avoid relative imports
```go
import (
    // Standard library
    "context"
    "fmt"
    
    // Third-party
    "github.com/gorilla/mux"
    "github.com/lib/pq"
    
    // Internal
    "myproject/internal/config"
    "myproject/internal/models"
)
```

## Documentation

### Package Documentation

Each package should have a comment at the top
Document the package purpose and usage
```go
// Package user provides user management functionality.
// It handles user creation, authentication, and profile management.
package user
```

### Function Documentation

Document exported functions
Start with the function name
Describe parameters, return values, and possible errors
```go
// GetUserByID retrieves a user by their unique identifier.
// It returns the user and nil error if found.
// If the user doesn't exist, it returns nil and ErrUserNotFound.
func GetUserByID(id string) (*User, error) {
    // ...
}
```

### Type Documentation

```go
// User represents a registered user in the system.
// It contains all the user's profile information and account status.
type User struct {
    ID       string    `json:"id"`
    Email    string    `json:"email"`
    Active   bool      `json:"active"`
    CreatedAt time.Time `json:"created_at"`
}
```

### Linting and Formatting

Code Formatting

Always use go fmt or gofmt
Use goimports to manage imports automatically
Linters

Use golangci-lint or similar tools

```bash
#!/bin/bash
# .git/hooks/pre-commit
go fmt ./...
go vet ./...
golangci-lint run
go test ./...
```

Common Anti-patterns

Avoid

Panic in library code (use errors instead)
Exposing internal channels or mutexes
Using global state
Returning unexported types
Deep nesting (use early returns)
Overuse of pointers (use values when possible)
```go
// ✅ Good - Early return
func Process(data []byte) error {
    if len(data) == 0 {
        return ErrEmptyData
    }
    // Continue processing...
}

// ❌ Bad - Deep nesting
func Process(data []byte) error {
    if len(data) > 0 {
        // Process...
        if isValid(data) {
            // More processing...
            if canSave(data) {
                // Save...
            }
        }
    }
    return nil
}
```

## Build and Deployment

### Build Flags

```bash
# Standard build
go build -o app ./cmd/app

# Build with optimizations
go build -ldflags="-s -w" -o app ./cmd/app

# Build for specific platform
GOOS=linux GOARCH=amd64 go build -o app ./cmd/app
Environment Variables
```

Use os.Getenv for configuration
Use os.Setenv sparingly
Prefer configuration files for complex configs
```go
// ✅ Good
func getDBConnection() string {
    return os.Getenv("DATABASE_URL")
}

// ❌ Bad
func getDBConnection() string {
    return "localhost:5432" // Hardcoded
}```

### Versioning

#### Semantic Versioning

Follow semantic versioning: v1.2.3
Breaking changes: increment major version
New features: increment minor version
Bug fixes: increment patch version
API Versioning

```go
// Package v1 - Version 1 API
package v1

// Package v2 - Version 2 API
package v2
```

## Final Checklist

Before Commit

□ Code compiles without warnings
□ All tests pass
□ Code is formatted (go fmt)
□ Imports are sorted (goimports)
□ Linters pass (golangci-lint run)
□ No commented-out code
□ Proper error handling
□ Appropriate naming
□ Documentation added for exports
□ No unused variables
Code Review Focus

□ Error handling is comprehensive
□ Concurrency is properly managed
□ Performance considerations addressed
□ Test coverage is adequate
□ Code is maintainable and readable
□ Security concerns addressed
text

---
