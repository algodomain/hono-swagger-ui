import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { swagger, HonoSwagger } from '../src/index';

describe('HonoSwagger', () => {
  let app: Hono;
  let swaggerInstance: HonoSwagger;

  beforeEach(() => {
    app = new Hono();
    swaggerInstance = swagger(app, {
      title: 'Test API',
      version: '1.0.0'
    });
  });

  describe('initialization', () => {
    it('should create swagger instance with default options', () => {
      const defaultSwagger = swagger(app);
      expect(defaultSwagger).toBeInstanceOf(HonoSwagger);
    });

    it('should create swagger instance with custom options', () => {
      const customSwagger = swagger(app, {
        title: 'Custom API',
        version: '2.0.0',
        route: '/docs'
      });
      expect(customSwagger).toBeInstanceOf(HonoSwagger);
    });
  });

  describe('route documentation', () => {
    it('should add route to documentation', () => {
      const route = {
        method: 'get',
        path: '/test',
        parameters: [],
        responses: {},
        tags: ['test'],
        summary: 'Test route'
      };

      swaggerInstance.addRoute(route);
      const spec = swaggerInstance.generateOpenAPISpec();
      
      expect(spec.paths['/test']).toBeDefined();
      expect(spec.paths['/test'].get).toBeDefined();
      expect(spec.paths['/test'].get.summary).toBe('Test route');
    });

    it('should generate OpenAPI spec with correct structure', () => {
      swaggerInstance.addRoute({
        method: 'get',
        path: '/users/{id}',
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
                schema: { type: 'object' }
              }
            }
          }
        },
        tags: ['users'],
        summary: 'Get user by ID'
      });

      const spec = swaggerInstance.generateOpenAPISpec();

      expect(spec.openapi).toBe('3.0.0');
      expect(spec.info.title).toBe('Test API');
      expect(spec.info.version).toBe('1.0.0');
      expect(spec.paths['/users/{id}']).toBeDefined();
      expect(spec.paths['/users/{id}'].get).toBeDefined();
    });
  });

  describe('middleware integration', () => {
    it('should work with route documentation', async () => {
      // Manually add a route to test documentation
      swaggerInstance.addRoute({
        method: 'post',
        path: '/users',
        parameters: [],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          }
        },
        tags: ['Users'],
        summary: 'Create user'
      });

      // Test that the route is documented
      const spec = swaggerInstance.generateOpenAPISpec();
      expect(spec.paths['/users']).toBeDefined();
      expect(spec.paths['/users'].post).toBeDefined();
      expect(spec.paths['/users'].post.tags).toContain('Users');
    });
  });

  describe('OpenAPI spec generation', () => {
    it('should include all required OpenAPI fields', () => {
      const spec = swaggerInstance.generateOpenAPISpec();

      expect(spec.openapi).toBe('3.0.0');
      expect(spec.info).toBeDefined();
      expect(spec.info.title).toBe('Test API');
      expect(spec.info.version).toBe('1.0.0');
      expect(spec.paths).toBeDefined();
    });

    it('should handle custom info fields', () => {
      const customSwagger = swagger(app, {
        title: 'Custom API',
        version: '2.0.0',
        description: 'A custom API description',
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

      const spec = customSwagger.generateOpenAPISpec();

      expect(spec.info.title).toBe('Custom API');
      expect(spec.info.version).toBe('2.0.0');
      expect(spec.info.description).toBe('A custom API description');
      expect(spec.info.contact).toBeDefined();
      expect(spec.info.license).toBeDefined();
    });
  });
});