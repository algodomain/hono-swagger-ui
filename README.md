# Hono Swagger UI 📚

![npm version](https://img.shields.io/npm/v/hono-swagger-ui)
![npm downloads](https://img.shields.io/npm/dm/hono-swagger-ui)
![license](https://img.shields.io/npm/l/hono-swagger-ui)

Automatic Swagger/OpenAPI documentation middleware for [Hono](https://hono.dev/) applications. Generate beautiful, interactive API documentation with **zero configuration** and **automatic route discovery**!

## 🎯 TL;DR

```typescript
import { Hono } from 'hono';
import { swagger } from 'hono-swagger-ui';

const app = new Hono();
const swaggerUI = swagger(app, { title: 'My API' });
app.use('*', swaggerUI.init());

app.get('/users/:id', (c) => c.json({ id: c.req.param('id') }));

// Visit /swagger-ui for interactive docs! 🚀
```

**3 lines of code** = Complete API documentation with interactive testing!

## ✨ Features

- 🚀 **Zero Configuration** - Works out of the box with your existing Hono routes
- 🔍 **Auto-Scanning** - Automatically detects and documents all Hono routers
- 📖 **Auto-Documentation** - Automatically detects and documents your API routes
- 👀 **File Watching** - Real-time documentation updates when files change
- 🎨 **Beautiful UI** - Integrates Swagger UI for interactive documentation
- 🔍 **Zod Integration** - Full support for `@hono/zod-validator` schemas
- 🏷️ **Custom Tags** - Organize your endpoints with custom tags and descriptions
- 🔧 **Flexible Configuration** - Customize everything from route paths to API info
- 📱 **Mobile Friendly** - Responsive documentation that works on all devices
- 🎯 **TypeScript** - Full TypeScript support with type safety

## 🚀 Quick Start

### Installation

```bash
npm install hono-swagger-ui
# or
yarn add hono-swagger-ui
# or
pnpm add hono-swagger-ui
```

### Simple Example

Here's a complete working example:

```typescript
// app.ts
import { Hono } from 'hono';
import { swagger } from 'hono-swagger-ui';

const app = new Hono();

// Initialize swagger middleware
const swaggerUI = swagger(app, {
  title: 'My API',
  version: '1.0.0',
  description: 'A simple API example'
});

// Apply the swagger middleware
app.use('*', swaggerUI.init());

// Define your routes (these will be automatically documented)
app.get('/', (c) => {
  return c.json({ message: 'Hello World!' });
});

app.get('/users/:id', (c) => {
  const id = c.req.param('id');
  return c.json({ id, name: 'John Doe', email: 'john@example.com' });
});

app.post('/users', async (c) => {
  const body = await c.req.json();
  return c.json({ id: '123', ...body }, 201);
});

// Start the server
const port = 3000;
console.log(`🚀 Server running on http://localhost:${port}`);
console.log(`📚 Swagger UI: http://localhost:${port}/swagger-ui`);

export default {
  port,
  fetch: app.fetch,
};
```

### Run the Example

```bash
# Install dependencies
npm install hono hono-swagger-ui

# Run with Bun
bun run app.ts

# Or with Node.js
npx tsx app.ts
```

Visit `http://localhost:3000/swagger-ui` to see your interactive API documentation!

> 💡 **Want to try it right now?** Copy the [simple-example.ts](./simple-example.ts) file and run it with `bun run simple-example.ts`!

### Basic Usage with Auto-Scanning

For larger applications with multiple routers:

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

// Your existing routes work automatically!
app.get('/users/:id', (c) => {
  return c.json({ id: c.req.param('id'), name: 'John' });
});

// Enable auto-scanning for automatic route discovery
await swaggerUI.enableAutoScan('./src');

export default app;
```

### Auto-Scanning with Routers

```typescript
import { Hono } from 'hono';
import { swagger } from 'hono-swagger-ui';

// Create routers (auto-detected)
const usersRouter = new Hono();
const authRouter = new Hono();

usersRouter.get('/', (c) => c.json({ users: [] }));
usersRouter.get('/:id', (c) => c.json({ id: c.req.param('id') }));

authRouter.post('/login', (c) => c.json({ token: 'abc123' }));

const app = new Hono();
const swaggerUI = swagger(app, { title: 'My API' });
app.use('*', swaggerUI.init());

// Mount routes (no manual registration needed!)
app.route('/api/users', usersRouter);
app.route('/api/auth', authRouter);

// Enable auto-scanning
await swaggerUI.enableAutoScan('./src');

// Optionally enable file watching for real-time updates
await swaggerUI.enableFileWatching('./src');
```

Routes are automatically discovered and documented! 🚀

### What You Get Out of the Box

With just a few lines of code, you get:

✅ **Interactive API Documentation** - Beautiful Swagger UI interface  
✅ **Automatic Route Detection** - All your routes are documented automatically  
✅ **Path Parameter Support** - `:id` becomes `{id}` in the documentation  
✅ **HTTP Method Support** - GET, POST, PUT, DELETE all documented  
✅ **Request/Response Examples** - See your API in action  
✅ **Try It Out** - Test your endpoints directly from the UI  
✅ **Mobile Responsive** - Works on all devices  

### Quick Test

After running the example above, you can:

1. **View Documentation**: Visit `http://localhost:3000/swagger-ui`
2. **Test Endpoints**: Click "Try it out" on any endpoint
3. **See Parameters**: Path parameters like `:id` are automatically documented
4. **Explore Responses**: See example responses for each endpoint

## 📖 Documentation

### 🆕 Auto-Scanning Features

The new auto-scanning functionality automatically detects and documents all your Hono routers:

#### Router Detection
- **File System Scanning**: Scans your `src` directory for Hono routers
- **Pattern Recognition**: Detects `new Hono()` instances in TypeScript/JavaScript files
- **Route Extraction**: Extracts all routes from discovered routers
- **Smart Path Generation**: Automatically generates base paths from file structure

#### File Watching
- **Real-time Updates**: Monitors file changes and updates documentation automatically
- **Debounced Scanning**: Prevents excessive scanning during rapid file changes
- **Error Handling**: Graceful error handling for file system issues

#### Usage
```typescript
// Enable auto-scanning (scans once and registers all routes)
await swaggerUI.enableAutoScan('./src');

// Enable file watching (monitors for changes and updates automatically)
await swaggerUI.enableFileWatching('./src');

// Disable file watching when needed
swaggerUI.disableFileWatching();
```

#### File Structure
The scanner automatically generates paths from your file structure:
```
src/routes/users.ts     → /api/users
src/routes/auth.ts      → /api/auth
src/routes/admin.ts     → /api/admin
```

### ⚠️ Deprecation Notice

The `registerSubApp` method has been **deprecated** in favor of auto-scanning:

**Before (Deprecated):**
```typescript
swaggerUI.registerSubApp('/api/users', usersRouter);
app.route('/api/users', usersRouter);
```

**After (Recommended):**
```typescript
app.route('/api/users', usersRouter);
await swaggerUI.enableAutoScan('./src');
```

See [DEPRECATION_NOTICE.md](./DEPRECATION_NOTICE.md) for detailed migration guide.

### Configuration Options

```typescript
interface SwaggerOptions {
  title?: string;           // API title (default: 'API Documentation')
  version?: string;         // API version (default: '1.0.0')
  description?: string;     // API description
  route?: string;          // Swagger UI route (default: '/swagger-ui')
  excludePaths?: string[]; // Paths to exclude from documentation
  info?: {
    title?: string;
    version?: string;
    description?: string;
    contact?: {
      name?: string;
      email?: string;
      url?: string;
    };
    license?: {
      name?: string;
      url?: string;
    };
  };
}
```

### Advanced Usage

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { swagger } from 'hono-swagger-ui';

// Create routers with enhanced documentation
const usersRouter = new Hono();
const authRouter = new Hono();

const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(120).optional()
});

// Enhanced route documentation with Zod validation
usersRouter.get('/:id',
  zValidator('param', z.object({ id: z.string() })),
  swaggerUI.documentRoute({
    tags: ['Users'],
    summary: 'Get user by ID',
    description: 'Retrieve a single user by their unique identifier'
  }),
  (c) => {
    const { id } = c.req.valid('param');
    return c.json({ id, name: 'John Doe', email: 'john@example.com' });
  }
);

usersRouter.post('/',
  zValidator('json', UserSchema.omit({ id: true })),
  swaggerUI.documentRoute({
    tags: ['Users'],
    summary: 'Create user',
    description: 'Create a new user with the provided data'
  }),
  async (c) => {
    const userData = c.req.valid('json');
    return c.json({ id: '123', ...userData }, 201);
  }
);

authRouter.post('/login',
  zValidator('json', z.object({
    email: z.string().email(),
    password: z.string().min(6)
  })),
  swaggerUI.documentRoute({
    tags: ['Authentication'],
    summary: 'User login',
    description: 'Authenticate user and return access token'
  }),
  (c) => {
    return c.json({ token: 'abc123', expiresIn: 3600 });
  }
);

const app = new Hono();

const swaggerUI = swagger(app, {
  title: 'My Advanced API',
  version: '2.0.0',
  description: 'A comprehensive API with full documentation',
  route: '/docs', // Custom route
  excludePaths: ['/internal', '/health'], // Exclude internal routes
  info: {
    contact: {
      name: 'API Support',
      email: 'support@example.com',
      url: 'https://example.com/support'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  }
});

app.use('*', swaggerUI.init());

// Mount routes (auto-scanning will detect and document these)
app.route('/api/users', usersRouter);
app.route('/api/auth', authRouter);

// Enable auto-scanning and file watching
await swaggerUI.enableAutoScan('./src');
await swaggerUI.enableFileWatching('./src');
```

### 🎯 Benefits of Auto-Scanning

- **Zero Configuration**: No need to manually register routes
- **Automatic Discovery**: All routes are found automatically
- **Real-time Updates**: Documentation updates when files change
- **No Missing Routes**: Impossible to forget to document a route
- **Flexible Paths**: Base paths generated from file structure
- **Less Code**: No manual registration required
- **Better DX**: Improved developer experience

### Manual Route Documentation (Legacy)

For special cases, you can still manually add routes to documentation:

```typescript
swaggerUI.addRoute({
  method: 'get',
  path: '/api/custom/{id}',
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string' }
    }
  ],
  responses: {
    '200': {
      description: 'Success',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              data: { type: 'object' }
            }
          }
        }
      }
    }
  },
  tags: ['Custom'],
  summary: 'Custom endpoint'
});
```

> **Note**: With auto-scanning, manual route documentation is rarely needed.

## 🔧 Integration Examples

### Different Ways to Use

#### 1. **Simple Setup** (Recommended for beginners)
```typescript
import { Hono } from 'hono';
import { swagger } from 'hono-swagger-ui';

const app = new Hono();
const swaggerUI = swagger(app, { title: 'My API' });
app.use('*', swaggerUI.init());

// Your routes here...
app.get('/hello', (c) => c.json({ message: 'Hello!' }));

export default app;
```

#### 2. **With Auto-Scanning** (For larger apps)
```typescript
import { Hono } from 'hono';
import { swagger } from 'hono-swagger-ui';

const app = new Hono();
const swaggerUI = swagger(app, { title: 'My API' });
app.use('*', swaggerUI.init());

// Mount routers
app.route('/api/users', usersRouter);
app.route('/api/auth', authRouter);

// Auto-detect all routes
await swaggerUI.enableAutoScan('./src');
```

#### 3. **With File Watching** (For development)
```typescript
import { Hono } from 'hono';
import { swagger } from 'hono-swagger-ui';

const app = new Hono();
const swaggerUI = swagger(app, { title: 'My API' });
app.use('*', swaggerUI.init());

// Auto-detect and watch for changes
await swaggerUI.enableAutoScan('./src');
await swaggerUI.enableFileWatching('./src');
```

### With Bun

```typescript
import { Hono } from 'hono';
import { swagger } from 'hono-swagger-ui';

const app = new Hono();
const swaggerUI = swagger(app);
app.use('*', swaggerUI.init());

// Your routes...

export default {
  port: 3000,
  fetch: app.fetch,
};
```

### With Node.js

```typescript
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { swagger } from 'hono-swagger-ui';

const app = new Hono();
const swaggerUI = swagger(app);
app.use('*', swaggerUI.init());

// Your routes...

const port = 3000;
console.log(`Server running at http://localhost:${port}/swagger-ui`);
serve({
  fetch: app.fetch,
  port
});
```

### With Cloudflare Workers

```typescript
import { Hono } from 'hono';
import { swagger } from 'hono-swagger-ui';

const app = new Hono();
const swaggerUI = swagger(app);
app.use('*', swaggerUI.init());

// Your routes...

export default app;
```

## 🎯 Zod Integration

The middleware automatically detects and converts Zod schemas to OpenAPI specifications:

```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  age: z.number().int().min(18, 'Must be 18 or older').optional(),
  role: z.enum(['user', 'admin']).default('user')
});

app.post('/users',
  zValidator('json', CreateUserSchema),
  (c) => {
    const user = c.req.valid('json');
    return c.json({ id: '123', ...user });
  }
);
```

This automatically generates proper OpenAPI schema with:
- Required fields
- Type validation
- Format validation (email, etc.)
- Min/max constraints
- Enum values
- Default values

## 🔧 Troubleshooting

### Common Issues

#### Routes Not Showing Up?
- Make sure you've applied the middleware: `app.use('*', swaggerUI.init())`
- Check that your routes are defined after the middleware
- For routers, use auto-scanning: `await swaggerUI.enableAutoScan('./src')`

#### Getting 404 on `/swagger-ui`?
- Ensure the middleware is applied before your routes
- Check that the route path is correct (default: `/swagger-ui`)
- Verify the server is running

#### Auto-scanning Not Working?
- Make sure the source path is correct: `./src`
- Check that your routers use `new Hono()`
- Ensure files have `.ts`, `.js`, `.tsx`, or `.jsx` extensions

#### TypeScript Errors?
```bash
npm install @types/node typescript
# or
bun add -d @types/node typescript
```

### Getting Help

- Check the [Auto-Scanning Guide](./AUTO_SCANNING_README.md) for detailed examples
- Review the [Deprecation Notice](./DEPRECATION_NOTICE.md) if migrating from older versions
- Open an issue on GitHub for bugs or feature requests

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/yourusername/hono-swagger-ui.git
cd hono-swagger-ui

# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm test

# Run example
cd example
npm install
npm run dev
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Add tests for your changes
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
7. Push to the branch (`git push origin feature/AmazingFeature`)
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Hono](https://hono.dev/) - The ultrafast web framework
- [Swagger UI](https://swagger.io/tools/swagger-ui/) - Interactive API documentation
- [Zod](https://zod.dev/) - TypeScript-first schema validation

## ⚡ Performance

This middleware is designed to be lightweight and performant:

- Routes are analyzed on-demand
- OpenAPI spec is cached and generated once
- Swagger UI assets are loaded from CDN
- Minimal runtime overhead

## 🔒 Security

- No sensitive information is exposed in documentation
- Configurable path exclusions for internal routes
- CORS headers properly handled
- No eval() or unsafe operations

## 📊 Roadmap

- [x] ✅ Auto-scanning router detection
- [x] ✅ File watching for real-time updates
- [x] ✅ Automatic route discovery
- [x] ✅ Smart path generation
- [ ] Enhanced Zod schema conversion
- [ ] JSDoc comment parsing
- [ ] Custom theme support
- [ ] Authentication documentation
- [ ] Response example generation
- [ ] Postman collection export
- [ ] Multiple API version support

## 📚 Additional Documentation

- [Auto-Scanning Guide](./AUTO_SCANNING_README.md) - Complete guide to auto-scanning features
- [Deprecation Notice](./DEPRECATION_NOTICE.md) - Migration guide from `registerSubApp`

---

Made with ❤️ for the Hono community