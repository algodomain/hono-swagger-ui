# 🔍 Auto-Scanning Router Detection

This enhanced version of `hono-swagger-ui` includes automatic router detection and file watching capabilities that eliminate the need for manual route registration.

## ✨ Features

### 🚀 Automatic Router Detection
- **File System Scanning**: Automatically scans your `src` directory for Hono routers
- **Pattern Recognition**: Detects `new Hono()` instances in TypeScript/JavaScript files
- **Route Extraction**: Extracts all routes from discovered routers
- **Smart Path Generation**: Automatically generates base paths from file structure

### 👀 File Watching
- **Real-time Updates**: Monitors file changes and updates documentation automatically
- **Debounced Scanning**: Prevents excessive scanning during rapid file changes
- **Error Handling**: Graceful error handling for file system issues

### 🎯 Zero Configuration
- **No Manual Registration**: Routes are discovered automatically
- **No Import Required**: Works with existing code structure
- **Backward Compatible**: Existing manual registration still works

## 📁 How It Works

### 1. Router Detection Patterns

The scanner looks for these patterns in your source files:

```typescript
// Pattern 1: Const declaration
const router = new Hono();

// Pattern 2: Let declaration
let router = new Hono();

// Pattern 3: Export const
export const router = new Hono();

// Pattern 4: Export default
export default new Hono();

// Pattern 5: Named export
export { router };
```

### 2. Route Extraction

For each detected router, it extracts routes like:

```typescript
router.get('/', handler);           // GET /
router.post('/users', handler);     // POST /users
router.get('/users/:id', handler);  // GET /users/{id}
router.put('/users/:id', handler);  // PUT /users/{id}
```

### 3. Path Generation

Base paths are generated from file structure:

```
src/routes/users.ts     → /api/users
src/routes/auth.ts      → /api/auth
src/routes/admin.ts     → /api/admin
src/services/api.ts     → /api/api
```

## 🛠️ Usage

### Basic Setup

```typescript
import { Hono } from 'hono';
import { swagger } from 'hono-swagger-ui';

const app = new Hono();

// Initialize swagger
const swaggerUI = swagger(app, {
  title: 'My API',
  version: '1.0.0'
});

// Apply middleware
app.use('*', swaggerUI.init());

// Enable auto-scanning
await swaggerUI.enableAutoScan('./src');

// Enable file watching (optional)
await swaggerUI.enableFileWatching('./src');
```

### Advanced Setup

```typescript
import { Hono } from 'hono';
import { swagger } from 'hono-swagger-ui';

const app = new Hono();

const swaggerUI = swagger(app, {
  title: 'Enhanced API',
  version: '1.0.0',
  description: 'API with automatic route discovery'
});

app.use('*', swaggerUI.init());

// Setup auto-scanning with custom path
await swaggerUI.enableAutoScan('./src/routes');

// Setup file watching with custom options
await swaggerUI.enableFileWatching('./src/routes');

// Disable file watching when needed
swaggerUI.disableFileWatching();
```

### Example Router Files

**`src/routes/users.ts`**
```typescript
import { Hono } from 'hono';

const usersRouter = new Hono();

usersRouter.get('/', (c) => {
  return c.json({ message: 'Get all users' });
});

usersRouter.get('/:id', (c) => {
  return c.json({ message: 'Get user by ID', id: c.req.param('id') });
});

usersRouter.post('/', (c) => {
  return c.json({ message: 'Create user' });
});

usersRouter.put('/:id', (c) => {
  return c.json({ message: 'Update user', id: c.req.param('id') });
});

usersRouter.delete('/:id', (c) => {
  return c.json({ message: 'Delete user', id: c.req.param('id') });
});

export default usersRouter;
```

**`src/routes/auth.ts`**
```typescript
import { Hono } from 'hono';

export const authRouter = new Hono();

authRouter.post('/login', (c) => {
  return c.json({ message: 'Login' });
});

authRouter.post('/logout', (c) => {
  return c.json({ message: 'Logout' });
});

authRouter.post('/refresh', (c) => {
  return c.json({ message: 'Refresh token' });
});
```

## 📊 Generated Documentation

The auto-scanner will automatically generate documentation for:

```
/api/users:
  GET /api/users - Get all users
  GET /api/users/{id} - Get user by ID
  POST /api/users - Create user
  PUT /api/users/{id} - Update user
  DELETE /api/users/{id} - Delete user

/api/auth:
  POST /api/auth/login - Login
  POST /api/auth/logout - Logout
  POST /api/auth/refresh - Refresh token
```

## 🔧 Configuration Options

### Router Scanner Options

```typescript
const scanner = new RouterScanner('./src', ['.ts', '.js', '.tsx', '.jsx']);
```

### File Watcher Options

```typescript
const fileWatcher = new FileWatcher({
  srcPath: './src',
  fileExtensions: ['.ts', '.js', '.tsx', '.jsx'],
  debounceMs: 1000,
  onRoutersChanged: (routers) => {
    console.log('Routers changed:', routers);
  },
  onError: (error) => {
    console.error('File watcher error:', error);
  }
});
```

## 🎯 Benefits

### For Developers
- **Zero Configuration**: No need to manually register routes
- **Automatic Updates**: Documentation updates when you add/remove routes
- **Real-time Feedback**: See changes immediately in Swagger UI
- **Reduced Maintenance**: Less code to maintain

### For Teams
- **Consistent Documentation**: All routes are automatically documented
- **No Missing Routes**: Impossible to forget to document a route
- **Easy Onboarding**: New developers don't need to learn manual registration
- **Better DX**: Improved developer experience

## 🚀 Migration Guide

### From Manual Registration

**Before (Deprecated):**
```typescript
// Manual registration required - NO LONGER NEEDED!
swaggerUI.registerSubApp('/api/users', usersRouter);
app.route('/api/users', usersRouter);

swaggerUI.registerSubApp('/api/auth', authRouter);
app.route('/api/auth', authRouter);
```

**After (Recommended):**
```typescript
// Just mount routes - auto-scanning handles the rest!
app.route('/api/users', usersRouter);
app.route('/api/auth', authRouter);

// Enable auto-scanning
await swaggerUI.enableAutoScan('./src');
// Routes are automatically discovered and documented
```

### Why registerSubApp is Deprecated

- **Redundant**: Auto-scanning eliminates the need for manual registration
- **Error-prone**: Easy to forget to register a route
- **Maintenance burden**: Requires keeping registration in sync with routes
- **Less flexible**: Hard-coded paths don't adapt to file structure changes

### Hybrid Approach (Not Recommended)

While technically possible, using both approaches is not recommended:

```typescript
// Auto-scan for most routes
await swaggerUI.enableAutoScan('./src');

// Manual registration for special cases (deprecated)
swaggerUI.registerSubApp('/api/special', specialRouter); // ⚠️ Deprecated
app.route('/api/special', specialRouter);
```

**Better approach**: Use auto-scanning for all routes and organize your file structure accordingly.

## 🔍 Debugging

### Enable Debug Logging

```typescript
// The scanner provides detailed logging
console.log('Scanning for routers...');
const routers = await scanner.scanForRouters();
console.log(`Found ${routers.length} routers`);
```

### Check Router Detection

```typescript
// Manually scan to see what's detected
const routers = await swaggerUI.manualScan();
routers.forEach(router => {
  console.log(`${router.routerName}: ${router.routes.length} routes`);
});
```

## 📝 Best Practices

1. **Organize Routes**: Keep routers in a `routes/` directory for better path generation
2. **Consistent Naming**: Use consistent router naming conventions
3. **File Extensions**: Use `.ts` or `.js` extensions for better detection
4. **Export Patterns**: Use consistent export patterns (default or named exports)
5. **Path Structure**: Organize files to match your desired API structure

## 🎉 Example Output

When you run the auto-scanner, you'll see output like:

```
🚀 Setting up Auto-Swagger...

📁 Enabling auto-scanning...
Scanning for routers in source files...
Found 5 routers:
  - usersRouter (src/routes/users.ts) with 5 routes
  - authRouter (src/routes/auth.ts) with 3 routes
  - adminRouter (src/routes/admin.ts) with 8 routes
Registered routes from 5 routers

👀 Enabling file watching...
File watcher started for ./src

✅ Auto-Swagger setup complete!
📊 Found 16 routes automatically:

  USERS:
    - GET /api/users
    - GET /api/users/{id}
    - POST /api/users
    - PUT /api/users/{id}
    - DELETE /api/users/{id}

  AUTH:
    - POST /api/auth/login
    - POST /api/auth/logout
    - POST /api/auth/refresh

🌐 Swagger UI available at: http://localhost:3000/swagger-ui
```

This enhanced functionality makes `hono-swagger-ui` truly automatic and eliminates the need for manual route registration while providing real-time updates through file watching. 