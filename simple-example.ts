// Simple Example - Copy this file and run it!
import { Hono } from 'hono';
import { swagger } from 'hono-swagger-ui';

const app = new Hono();

// Initialize swagger middleware
const swaggerUI = swagger(app, {
  title: 'Simple API Example',
  version: '1.0.0',
  description: 'A simple API to demonstrate hono-swagger-ui'
});

// Apply the swagger middleware
app.use('*', swaggerUI.init());

// Define your routes (these will be automatically documented)
app.get('/', (c) => {
  return c.json({ 
    message: 'Hello World!',
    docs: '/swagger-ui',
    endpoints: ['/users', '/users/:id', '/posts']
  });
});

app.get('/users', (c) => {
  return c.json([
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
  ]);
});

app.get('/users/:id', (c) => {
  const id = c.req.param('id');
  return c.json({ 
    id, 
    name: 'John Doe', 
    email: 'john@example.com',
    createdAt: new Date().toISOString()
  });
});

app.post('/users', async (c) => {
  const body = await c.req.json();
  return c.json({ 
    id: '3', 
    ...body, 
    createdAt: new Date().toISOString() 
  }, 201);
});

app.get('/posts', (c) => {
  return c.json([
    { id: '1', title: 'First Post', content: 'Hello World!' },
    { id: '2', title: 'Second Post', content: 'Another post' }
  ]);
});

// Start the server
const port = 3000;
console.log(`🚀 Server running on http://localhost:${port}`);
console.log(`📚 Swagger UI: http://localhost:${port}/swagger-ui`);
console.log(`🔗 Try these endpoints:`);
console.log(`   GET  http://localhost:${port}/`);
console.log(`   GET  http://localhost:${port}/users`);
console.log(`   GET  http://localhost:${port}/users/1`);
console.log(`   POST http://localhost:${port}/users`);
console.log(`   GET  http://localhost:${port}/posts`);

export default {
  port,
  fetch: app.fetch,
}; 