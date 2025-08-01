# ⚠️ registerSubApp Deprecation Notice

## Overview

The `registerSubApp` method has been **deprecated** in favor of the new auto-scanning functionality. This change simplifies the API and eliminates the need for manual route registration.

## Why registerSubApp is Deprecated

### ❌ Problems with Manual Registration

1. **Redundant**: Auto-scanning eliminates the need for manual registration
2. **Error-prone**: Easy to forget to register a route
3. **Maintenance burden**: Requires keeping registration in sync with routes
4. **Less flexible**: Hard-coded paths don't adapt to file structure changes
5. **Code duplication**: Routes are defined twice (in router + registration)

### ✅ Benefits of Auto-Scanning

1. **Zero configuration**: Routes are discovered automatically
2. **No missing routes**: Impossible to forget to register a route
3. **Real-time updates**: Documentation updates when files change
4. **Flexible paths**: Base paths generated from file structure
5. **Less code**: No manual registration required

## Migration Guide

### Before (Deprecated)

```typescript
import { Hono } from 'hono';
import { swagger } from 'hono-swagger-ui';

const app = new Hono();
const swaggerUI = swagger(app, options);

app.use('*', swaggerUI.init());

// Manual registration required
swaggerUI.registerSubApp('/api/users', usersRouter);
app.route('/api/users', usersRouter);

swaggerUI.registerSubApp('/api/auth', authRouter);
app.route('/api/auth', authRouter);
```

### After (Recommended)

```typescript
import { Hono } from 'hono';
import { swagger } from 'hono-swagger-ui';

const app = new Hono();
const swaggerUI = swagger(app, options);

app.use('*', swaggerUI.init());

// Just mount routes - auto-scanning handles the rest!
app.route('/api/users', usersRouter);
app.route('/api/auth', authRouter);

// Enable auto-scanning
await swaggerUI.enableAutoScan('./src');
```

## What Happens Now

### Deprecation Warnings

When you use `registerSubApp`, you'll see a warning:

```
⚠️ registerSubApp is deprecated. Use enableAutoScan() for automatic router detection.
```

### Backward Compatibility

- `registerSubApp` still works but is deprecated
- Existing code will continue to function
- No breaking changes in this version

### Future Versions

- `registerSubApp` will be removed in a future major version
- Auto-scanning will be the only supported approach
- Migration guide will be provided when removal is planned

## Best Practices

### ✅ Do This

```typescript
// 1. Organize your routes in a clear structure
src/
├── routes/
│   ├── users.ts
│   ├── auth.ts
│   └── admin.ts

// 2. Use consistent export patterns
export const usersRouter = new Hono();
// or
export default new Hono();

// 3. Enable auto-scanning
await swaggerUI.enableAutoScan('./src');

// 4. Optionally enable file watching
await swaggerUI.enableFileWatching('./src');
```

### ❌ Don't Do This

```typescript
// Don't use manual registration
swaggerUI.registerSubApp('/api/users', usersRouter);

// Don't mix approaches
await swaggerUI.enableAutoScan('./src');
swaggerUI.registerSubApp('/api/users', usersRouter); // Confusing!
```

## File Structure Recommendations

For best results with auto-scanning:

```
src/
├── routes/
│   ├── users.ts          → /api/users
│   ├── auth.ts           → /api/auth
│   └── admin.ts          → /api/admin
├── services/
│   ├── billing.ts        → /api/billing
│   └── notifications.ts  → /api/notifications
└── index.ts              → Main app
```

## Migration Checklist

- [ ] Remove all `registerSubApp` calls
- [ ] Organize routes in a clear directory structure
- [ ] Use consistent export patterns
- [ ] Enable auto-scanning with `enableAutoScan('./src')`
- [ ] Optionally enable file watching with `enableFileWatching('./src')`
- [ ] Test that all routes are documented correctly
- [ ] Remove any manual route registration code

## Support

If you need help migrating from `registerSubApp` to auto-scanning:

1. Check the [AUTO_SCANNING_README.md](./AUTO_SCANNING_README.md)
2. Review the example files in the `example/` directory
3. Test with the provided examples

The auto-scanning approach is simpler, more reliable, and provides better developer experience than manual registration. 