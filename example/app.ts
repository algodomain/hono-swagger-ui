// Example usage of hono-swagger-ui
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { swagger } from '../src/index';
import { loginRoutes } from './login';
import rolesRouter from './roles';

const app = new Hono();

// Initialize swagger middleware
const swaggerMiddleware = swagger(app, {
  title: 'My API',
  version: '1.0.0',
  description: 'A sample API built with Hono',
  route: '/swagger-ui', // This is the default
  info: {
    contact: {
      name: 'API Support',
      email: 'support@example.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  }
});

// Apply the middleware globally
const swaggerInit = swaggerMiddleware.init();
app.use('*', swaggerInit);

// Define your schemas
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().int().min(0).max(120).optional()
});

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(120).optional()
});

const SearchQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.string().regex(/^\d+$/).optional(),
  offset: z.string().regex(/^\d+$/).optional()
});

// Mount routes (auto-scanning will detect these automatically)
app.route("/login", loginRoutes)
app.route("/roles", rolesRouter)

// Enable auto-scanning to automatically detect and document all routes
await swaggerMiddleware.enableAutoScan('./src');


// Routes with automatic documentation
app.get('/', 
  // swaggerMiddleware.documentRoute({
  //   tags: ['Root'],
  //   summary: 'Root endpoint',
  //   description: 'Returns a welcome message'
  // }),
  
  (c) => {
    return c.json({ message: 'Hello Hono!' });
  }
);

// User routes with detailed documentation
app.get('/api/users/:id', 
  zValidator('param', z.object({ id: z.string() })),
  swaggerMiddleware.documentRoute({
    tags: ['Users'],
    summary: 'Get user by ID',
    description: 'Retrieve a single user by their unique ID'
  }),
  (c) => {
    const { id } = c.req.valid('param');
    
    // Your logic here
    return c.json({
      id,
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    });
  }
);

app.post('/api/users',
  zValidator('json', CreateUserSchema),
  swaggerMiddleware.documentRoute({
    tags: ['Users'],
    summary: 'Create a new user',
    description: 'Create a new user with the provided information'
  }),
  async (c) => {
    const userData = c.req.valid('json');
    
    // Your creation logic here
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      ...userData
    };
    
    return c.json(newUser, 201);
  }
);

app.put('/api/users/:id',
  zValidator('param', z.object({ id: z.string() })),
  zValidator('json', CreateUserSchema),
  swaggerMiddleware.documentRoute({
    tags: ['Users'],
    summary: 'Update user',
    description: 'Update an existing user with new information'
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const userData = c.req.valid('json');
    
    // Your update logic here
    return c.json({
      id,
      ...userData
    });
  }
);

app.delete('/api/users/:id',
  zValidator('param', z.object({ id: z.string() })),
  swaggerMiddleware.documentRoute({
    tags: ['Users'],
    summary: 'Delete user',
    description: 'Delete a user by their ID'
  }),
  (c) => {
    const { id } = c.req.valid('param');
    
    // Your deletion logic here
    return c.json({ message: 'User deleted successfully' });
  }
);

// Search endpoint with query validation
app.get('/api/search',
  zValidator('query', SearchQuerySchema),
  swaggerMiddleware.documentRoute({
    tags: ['Search'],
    summary: 'Search users',
    description: 'Search for users with various filters'
  }),
  async (c) => {
    const { q, limit = '10', offset = '0' } = c.req.valid('query');
    
    // Your search logic here
    return c.json({
      query: q,
      results: [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
      ],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: 2
      }
    });
  }
);

// Routes without explicit documentation will be auto-documented
app.get('/api/health', 
  swaggerMiddleware.documentRoute({
    tags: ['System'],
    summary: 'Health check',
    description: 'Check the health status of the API'
  }),
  (c) => {
    return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
  }
);

app.get('/api/version', 
  swaggerMiddleware.documentRoute({
    tags: ['System'],
    summary: 'Get API version',
    description: 'Get the current version of the API'
  }),
  (c) => {
    return c.json({ version: '1.0.0', build: process.env.BUILD_NUMBER || 'dev' });
  }
);

// Routes in excluded paths won't be documented
app.get('/internal/metrics', (c) => {
  return c.json({ metrics: 'internal data' });
});

// Initialize auto-scanning and start the server
async function startServer() {
  // Enable auto-scanning to automatically detect and document all routes
  await swaggerMiddleware.enableAutoScan('./src');
  
  const port = process.env.PORT || 3000;
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📚 API Documentation available at: http://localhost:${port}/swagger-ui`);
}

startServer();

export default app;

