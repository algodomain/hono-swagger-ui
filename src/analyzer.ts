import { Context } from 'hono';
import { z } from 'zod';

export interface ZodSchemaInfo {
  type: 'param' | 'query' | 'json' | 'form';
  schema: any;
  openApiSchema?: any;
}

export class HonoSwaggerAnalyzer {
  /**
   * Analyze zValidator middleware to extract schema information
   */
  static analyzeZodValidator(validatorFn: any): ZodSchemaInfo | null {
    try {
      // This is a simplified approach - in a real implementation,
      // you might need to hook into the validator more deeply
      if (typeof validatorFn === 'function') {
        // Try to extract information from the validator function
        const fnString = validatorFn.toString();
        
        // Look for zValidator patterns
        const validatorMatch = fnString.match(/zValidator\s*\(\s*['"](\w+)['"],?\s*([^)]+)\)/);
        if (validatorMatch) {
          const type = validatorMatch[1] as ZodSchemaInfo['type'];
          return {
            type,
            schema: null, // Would need more sophisticated analysis
            openApiSchema: this.generateDefaultSchemaForType(type)
          };
        }
      }
    } catch (error) {
      console.warn('Failed to analyze zod validator:', error);
    }
    
    return null;
  }

  /**
   * Convert Zod schema to OpenAPI schema
   */
  static zodToOpenAPI(schema: z.ZodType): any {
    if (!schema) return { type: 'object' };

    try {
      // Handle different Zod types
      if (schema instanceof z.ZodString) {
        const stringSchema: any = { type: 'string' };
        
        // Handle string constraints
        if (schema._def.checks) {
          for (const check of schema._def.checks) {
            switch (check.kind) {
              case 'email':
                stringSchema.format = 'email';
                break;
              case 'url':
                stringSchema.format = 'uri';
                break;
              case 'min':
                stringSchema.minLength = check.value;
                break;
              case 'max':
                stringSchema.maxLength = check.value;
                break;
              case 'regex':
                stringSchema.pattern = check.regex.source;
                break;
            }
          }
        }
        
        return stringSchema;
      }

      if (schema instanceof z.ZodNumber) {
        const numberSchema: any = { type: 'number' };
        
        if (schema._def.checks) {
          for (const check of schema._def.checks) {
            switch (check.kind) {
              case 'min':
                numberSchema.minimum = check.value;
                break;
              case 'max':
                numberSchema.maximum = check.value;
                break;
              case 'int':
                numberSchema.type = 'integer';
                break;
            }
          }
        }
        
        return numberSchema;
      }

      if (schema instanceof z.ZodBoolean) {
        return { type: 'boolean' };
      }

      if (schema instanceof z.ZodObject) {
        const properties: Record<string, any> = {};
        const required: string[] = [];
        
        const shape = schema._def.shape();
        
        for (const [key, value] of Object.entries(shape)) {
          properties[key] = this.zodToOpenAPI(value as z.ZodType);
          
          // Check if field is required
          if (!(value instanceof z.ZodOptional) && !(value instanceof z.ZodDefault)) {
            required.push(key);
          }
        }
        
        const objectSchema: any = {
          type: 'object',
          properties
        };
        
        if (required.length > 0) {
          objectSchema.required = required;
        }
        
        return objectSchema;
      }

      if (schema instanceof z.ZodArray) {
        return {
          type: 'array',
          items: this.zodToOpenAPI(schema._def.type)
        };
      }

      if (schema instanceof z.ZodOptional) {
        return this.zodToOpenAPI(schema._def.innerType);
      }

      if (schema instanceof z.ZodDefault) {
        const innerSchema = this.zodToOpenAPI(schema._def.innerType);
        innerSchema.default = schema._def.defaultValue();
        return innerSchema;
      }

      if (schema instanceof z.ZodEnum) {
        return {
          type: 'string',
          enum: schema._def.values
        };
      }

      if (schema instanceof z.ZodUnion) {
        return {
          oneOf: schema._def.options.map((option: z.ZodType) => this.zodToOpenAPI(option))
        };
      }

      if (schema instanceof z.ZodLiteral) {
        return {
          type: typeof schema._def.value,
          enum: [schema._def.value]
        };
      }

    } catch (error) {
      console.warn('Failed to convert Zod schema to OpenAPI:', error);
    }

    // Fallback for unsupported types
    return { type: 'object' };
  }

  /**
   * Generate default schema for validator type
   */
  private static generateDefaultSchemaForType(type: ZodSchemaInfo['type']): any {
    switch (type) {
      case 'param':
        return {
          type: 'object',
          properties: {
            id: { type: 'string' }
          }
        };
      case 'query':
        return {
          type: 'object',
          properties: {
            q: { type: 'string' }
          }
        };
      case 'json':
        return {
          type: 'object'
        };
      case 'form':
        return {
          type: 'object'
        };
      default:
        return { type: 'object' };
    }
  }

  /**
   * Extract request body schema from context
   */
  static async extractRequestBodySchema(c: Context): Promise<any> {
    try {
      const contentType = c.req.header('content-type') || '';
      
      if (contentType.includes('application/json')) {
        // Try to parse JSON body to infer schema
        const body = await c.req.json().catch(() => null);
        if (body) {
          return this.inferSchemaFromValue(body);
        }
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        // Try to parse form data
        const formData = await c.req.formData().catch(() => null);
        if (formData) {
          const obj: Record<string, any> = {};
          formData.forEach((value, key) => {
            obj[key] = value;
          });
          return this.inferSchemaFromValue(obj);
        }
      }
    } catch (error) {
      // Ignore errors and return default schema
    }

    return { type: 'object' };
  }

  /**
   * Infer OpenAPI schema from a JavaScript value
   */
  private static inferSchemaFromValue(value: any): any {
    if (value === null || value === undefined) {
      return { type: 'null' };
    }

    if (typeof value === 'string') {
      return { type: 'string', example: value };
    }

    if (typeof value === 'number') {
      return Number.isInteger(value) 
        ? { type: 'integer', example: value }
        : { type: 'number', example: value };
    }

    if (typeof value === 'boolean') {
      return { type: 'boolean', example: value };
    }

    if (Array.isArray(value)) {
      const items = value.length > 0 
        ? this.inferSchemaFromValue(value[0])
        : { type: 'string' };
      
      return {
        type: 'array',
        items,
        example: value
      };
    }

    if (typeof value === 'object') {
      const properties: Record<string, any> = {};
      const required: string[] = [];

      for (const [key, val] of Object.entries(value)) {
        properties[key] = this.inferSchemaFromValue(val);
        if (val !== null && val !== undefined) {
          required.push(key);
        }
      }

      const schema: any = {
        type: 'object',
        properties,
        example: value
      };

      if (required.length > 0) {
        schema.required = required;
      }

      return schema;
    }

    return { type: 'string' };
  }

  /**
   * Analyze response to generate response schema
   */
  static analyzeResponse(response: Response): any {
    const contentType = response.headers.get('content-type') || '';
    const status = response.status;

    const responseSchema: any = {
      description: this.getStatusDescription(status),
      content: {}
    };

    if (contentType.includes('application/json')) {
      responseSchema.content['application/json'] = {
        schema: { type: 'object' }
      };
    } else if (contentType.includes('text/')) {
      responseSchema.content[contentType] = {
        schema: { type: 'string' }
      };
    } else {
      responseSchema.content['application/json'] = {
        schema: { type: 'object' }
      };
    }

    return responseSchema;
  }

  /**
   * Get status code description
   */
  private static getStatusDescription(status: number): string {
    const descriptions: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      202: 'Accepted',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable'
    };

    return descriptions[status] || (status >= 200 && status < 300 ? 'Success' : 'Error');
  }
}