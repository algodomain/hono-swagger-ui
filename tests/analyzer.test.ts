import { HonoSwaggerAnalyzer } from '../src/analyzer';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

describe('HonoSwaggerAnalyzer', () => {
  describe('zodToOpenAPI', () => {
    it('should convert ZodString to OpenAPI string schema', () => {
      const schema = z.string();
      const result = HonoSwaggerAnalyzer.zodToOpenAPI(schema);
      
      expect(result).toEqual({ type: 'string' });
    });

    it('should convert ZodString with email validation', () => {
      const schema = z.string().email();
      const result = HonoSwaggerAnalyzer.zodToOpenAPI(schema);
      
      expect(result).toEqual({ 
        type: 'string',
        format: 'email'
      });
    });

    it('should convert ZodString with URL validation', () => {
      const schema = z.string().url();
      const result = HonoSwaggerAnalyzer.zodToOpenAPI(schema);
      
      expect(result).toEqual({ 
        type: 'string',
        format: 'uri'
      });
    });

    it('should convert ZodString with length constraints', () => {
      const schema = z.string().min(1).max(100);
      const result = HonoSwaggerAnalyzer.zodToOpenAPI(schema);
      
      expect(result).toEqual({ 
        type: 'string',
        minLength: 1,
        maxLength: 100
      });
    });

    it('should convert ZodNumber to OpenAPI number schema', () => {
      const schema = z.number();
      const result = HonoSwaggerAnalyzer.zodToOpenAPI(schema);
      
      expect(result).toEqual({ type: 'number' });
    });

    it('should convert ZodNumber with integer constraint', () => {
      const schema = z.number().int();
      const result = HonoSwaggerAnalyzer.zodToOpenAPI(schema);
      
      expect(result).toEqual({ type: 'integer' });
    });

    it('should convert ZodNumber with range constraints', () => {
      const schema = z.number().min(0).max(100);
      const result = HonoSwaggerAnalyzer.zodToOpenAPI(schema);
      
      expect(result).toEqual({ 
        type: 'number',
        minimum: 0,
        maximum: 100
      });
    });

    it('should convert ZodBoolean to OpenAPI boolean schema', () => {
      const schema = z.boolean();
      const result = HonoSwaggerAnalyzer.zodToOpenAPI(schema);
      
      expect(result).toEqual({ type: 'boolean' });
    });

    it('should convert ZodObject to OpenAPI object schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().int().min(0)
      });
      const result = HonoSwaggerAnalyzer.zodToOpenAPI(schema);
      
      expect(result).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer', minimum: 0 }
        },
        required: ['name', 'age']
      });
    });

    it('should convert ZodArray to OpenAPI array schema', () => {
      const schema = z.array(z.string());
      const result = HonoSwaggerAnalyzer.zodToOpenAPI(schema);
      
      expect(result).toEqual({
        type: 'array',
        items: { type: 'string' }
      });
    });

    it('should handle optional fields in objects', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().int().min(0).optional()
      });
      const result = HonoSwaggerAnalyzer.zodToOpenAPI(schema);
      
      expect(result).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer', minimum: 0 }
        },
        required: ['name']
      });
    });

    it('should handle union types', () => {
      const schema = z.union([z.string(), z.number()]);
      const result = HonoSwaggerAnalyzer.zodToOpenAPI(schema);
      
      expect(result).toEqual({
        oneOf: [
          { type: 'string' },
          { type: 'number' }
        ]
      });
    });

    it('should handle enum types', () => {
      const schema = z.enum(['red', 'green', 'blue']);
      const result = HonoSwaggerAnalyzer.zodToOpenAPI(schema);
      
      expect(result).toEqual({
        type: 'string',
        enum: ['red', 'green', 'blue']
      });
    });

    it('should return default object schema for null/undefined', () => {
      const result = HonoSwaggerAnalyzer.zodToOpenAPI(null as any);
      expect(result).toEqual({ type: 'object' });
    });
  });

  describe('analyzeZodValidator', () => {
    it('should analyze zValidator function', () => {
      // Mock zValidator function that matches the expected pattern
      const validatorFn = function(param: any) { 
        return zValidator('param', z.object({ id: z.string() })); 
      };
      // Override toString to return the expected pattern
      validatorFn.toString = () => "function(param) { return zValidator('param', schema); }";
      const result = HonoSwaggerAnalyzer.analyzeZodValidator(validatorFn);
      
      expect(result).toBeDefined();
      expect(result?.type).toBe('param');
    });

    it('should return null for non-function input', () => {
      const result = HonoSwaggerAnalyzer.analyzeZodValidator('not a function');
      expect(result).toBeNull();
    });
  });

  describe('extractRequestBodySchema', () => {
    it('should extract schema from request body', async () => {
      const mockContext = {
        req: {
          header: () => 'application/json',
          json: async () => ({ name: 'John', age: 30 })
        }
      } as any;

      const result = await HonoSwaggerAnalyzer.extractRequestBodySchema(mockContext);
      
      expect(result).toBeDefined();
      expect(result.type).toBe('object');
      expect(result.properties).toBeDefined();
    });
  });

  describe('analyzeResponse', () => {
    it('should analyze response object', () => {
      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });

      const result = HonoSwaggerAnalyzer.analyzeResponse(mockResponse);
      
      expect(result).toBeDefined();
      expect(result.description).toBe('OK');
      expect(result.content).toBeDefined();
      expect(result.content['application/json']).toBeDefined();
    });

    it('should handle different status codes', () => {
      const mockResponse = new Response('Not Found', { status: 404 });
      const result = HonoSwaggerAnalyzer.analyzeResponse(mockResponse);
      
      expect(result.description).toBe('Not Found');
      expect(result.content).toBeDefined();
    });
  });
}); 