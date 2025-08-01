import { Context, Hono, MiddlewareHandler } from 'hono';
import { HonoSwaggerAnalyzer } from './analyzer';
import { swaggerUITemplate } from './templates';
import { RouterScanner, RouterInfo } from './routerScanner';
import { FileWatcher } from './fileWatcher';

export interface SwaggerOptions {
  title?: string;
  version?: string;
  description?: string;
  route?: string;
  excludePaths?: string[];
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

export interface RouteInfo {
  method: string;
  path: string;
  parameters: any[];
  responses: any;
  tags: string[];
  summary?: string;
  description?: string;
  zodSchema?: any;
  requestBody?: any;
}

export class HonoSwagger {
  private routes: RouteInfo[] = [];
  private options: SwaggerOptions;
  private app: Hono;
  private originalMethods: Map<string, Function> = new Map();
  private originalRouteMethod: Function | null = null;
  private routerScanner: RouterScanner;
  private fileWatcher: FileWatcher | null = null;
  private autoScanEnabled: boolean = false;

  constructor(app: Hono, options: SwaggerOptions = {}) {
    this.app = app;
    this.options = {
      route: '/swagger-ui',
      title: 'API Documentation',
      version: '1.0.0',
      description: 'Auto-generated API documentation',
      excludePaths: [],
      ...options
    };
    
    // Initialize router scanner
    this.routerScanner = new RouterScanner('./src');
    
    // Hook into Hono's route methods for auto-registration
    this.hookIntoRouteMethods();
    this.hookIntoRouteMethod();
  }

  /**
   * Middleware to automatically document routes
   */
  public documentRoute(options?: {
    tags?: string[];
    summary?: string;
    description?: string;
    deprecated?: boolean;
    requestBody?: any;
  }): MiddlewareHandler {
    // Create a middleware that attaches options to the next handler
    const middleware = async (c: Context, next: any) => {
      // Attach swagger options to the next handler
      if (next && typeof next === 'function') {
        (next as any).__swaggerRouteOptions = options;
      }
      await next();
    };
    
    // Mark this middleware as having swagger options
    (middleware as any).__swaggerOptions = options;
    
    return middleware;
  }

  /**
   * Hook into Hono's route methods to automatically capture routes
   */
  private hookIntoRouteMethods(): void {
    const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];
    
    methods.forEach(method => {
      const originalMethod = this.app[method as keyof typeof this.app] as Function;
      if (originalMethod && typeof originalMethod === 'function') {
        this.originalMethods.set(method, originalMethod);
        
        // Override the method to capture route information
        (this.app as any)[method] = (...args: any[]) => {
          const path = args[0];
          const handlers = args.slice(1);
          
          // Extract route information from handlers
          let routeOptions: any = {};
          for (const handler of handlers) {
            if (handler && typeof handler === 'function') {
              // Check if this is a documentRoute middleware
              if ((handler as any).__swaggerOptions) {
                routeOptions = { ...routeOptions, ...(handler as any).__swaggerOptions };
              }
              // Check if the handler itself has swagger options
              if ((handler as any).__swaggerRouteOptions) {
                routeOptions = { ...routeOptions, ...(handler as any).__swaggerRouteOptions };
              }
            }
          }
          
          // Auto-register the route
          this.autoRegisterRoute(method, path, routeOptions);
          
          // Call the original method
          return originalMethod.apply(this.app, args);
        };
      }
    });
  }

  /**
   * Hook into Hono's route method to capture sub-applications
   */
  private hookIntoRouteMethod(): void {
    const originalRouteMethod = (this.app as any).route;
    if (originalRouteMethod && typeof originalRouteMethod === 'function') {
      this.originalRouteMethod = originalRouteMethod;
      
      // Override the route method to capture sub-application routes
      (this.app as any).route = (path: string, subApp: Hono) => {
        // Register all routes from the sub-application
        this.registerSubAppRoutes(path, subApp);
        
        // Call the original method
        return originalRouteMethod.call(this.app, path, subApp);
      };
    }
  }

  /**
   * Register all routes from a sub-application
   */
  private registerSubAppRoutes(basePath: string, subApp: Hono): void {
    // Hook into the sub-application's route methods
    this.hookIntoSubAppRoutes(basePath, subApp);
  }

  /**
   * Hook into a sub-application's route methods
   */
  private hookIntoSubAppRoutes(basePath: string, subApp: Hono): void {
    const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];
    
    methods.forEach(method => {
      const originalMethod = subApp[method as keyof typeof subApp] as Function;
      if (originalMethod && typeof originalMethod === 'function') {
        // Override the method to capture route information
        (subApp as any)[method] = (...args: any[]) => {
          const path = args[0];
          const handlers = args.slice(1);
          const fullPath = basePath + path;
          
          // Extract route information from handlers
          let routeOptions: any = {};
          for (const handler of handlers) {
            if (handler && typeof handler === 'function') {
              // Check if this is a documentRoute middleware
              if ((handler as any).__swaggerOptions) {
                routeOptions = { ...routeOptions, ...(handler as any).__swaggerOptions };
              }
              // Check if the handler itself has swagger options
              if ((handler as any).__swaggerRouteOptions) {
                routeOptions = { ...routeOptions, ...(handler as any).__swaggerRouteOptions };
              }
            }
          }
          
          // Auto-register the route with the full path
          this.autoRegisterRoute(method, fullPath, routeOptions);
          
          // Call the original method
          return originalMethod.apply(subApp, args);
        };
      }
    });
  }

  /**
   * Auto-register a route based on method, path, and options
   */
  private autoRegisterRoute(method: string, path: string, options?: any): void {
    if (this.shouldExcludePath(path)) {
      return;
    }

    // Convert path to OpenAPI format
    const openAPIPath = this.convertToOpenAPIPath(path, {} as Context);
    
    // Normalize path to avoid duplicates (remove trailing slash except for root)
    const normalizedPath = openAPIPath.endsWith('/') && openAPIPath !== '/' 
      ? openAPIPath.slice(0, -1) 
      : openAPIPath;
    
    // Check if route is already documented
    if (this.isRouteDocumented(method, normalizedPath)) {
      return;
    }

    const routeInfo: RouteInfo = {
      method: method.toLowerCase(),
      path: normalizedPath,
      parameters: this.extractParametersFromPath(normalizedPath),
      responses: this.generateDefaultResponses(),
      tags: options?.tags || [this.generateTagFromPath(path)],
      summary: options?.summary || `${method.toUpperCase()} ${path}`,
      description: options?.description,
      requestBody: this.generateRequestBodyFromMethod(method, options)
    };
    
    this.addRoute(routeInfo);
  }

  /**
   * Extract parameters from path (e.g., /users/:id -> [{name: 'id', in: 'path', required: true}])
   */
  private extractParametersFromPath(path: string): any[] {
    const parameters: any[] = [];
    const pathParams = path.match(/:\w+/g);
    
    if (pathParams) {
      pathParams.forEach(param => {
        const paramName = param.substring(1); // Remove the colon
        parameters.push({
          name: paramName,
          in: 'path',
          required: true,
          schema: { type: 'string' }
        });
      });
    }
    
    return parameters;
  }

  /**
   * Generate request body based on HTTP method
   */
  private generateRequestBodyFromMethod(method: string, options?: any): any {
    if (['post', 'put', 'patch'].includes(method.toLowerCase()) && options?.requestBody) {
      return options.requestBody;
    }
    
    if (['post', 'put', 'patch'].includes(method.toLowerCase())) {
      return {
        content: {
          'application/json': {
            schema: { type: 'object' }
          }
        }
      };
    }
    
    return undefined;
  }

  /**
   * Manually register a route for documentation (kept for backward compatibility)
   */
  public registerRoute(method: string, path: string, options?: {
    tags?: string[];
    summary?: string;
    description?: string;
    parameters?: any[];
    responses?: any;
    requestBody?: any;
  }): void {
    const routeInfo: RouteInfo = {
      method: method.toLowerCase(),
      path: this.convertToOpenAPIPath(path, {} as Context),
      parameters: options?.parameters || [],
      responses: options?.responses || this.generateDefaultResponses(),
      tags: options?.tags || [this.generateTagFromPath(path)],
      requestBody: options?.requestBody
    };
    
    this.addRoute(routeInfo);
  }

  /**
   * Register a sub-application for documentation
   * @deprecated Use enableAutoScan() instead for automatic router detection
   */
  public registerSubApp(basePath: string, subApp: Hono): void {
    console.warn('registerSubApp is deprecated. Use enableAutoScan() for automatic router detection.');
    
    // Hook into the sub-application's route methods immediately
    this.hookIntoSubAppRoutes(basePath, subApp);
    
    // Also try to extract existing routes if any
    this.extractAndRegisterExistingRoutes(basePath, subApp);
  }

  /**
   * Extract all routes from the main app and its sub-applications
   */
  public extractAllRoutes(): void {
    console.log('Extracting all routes from main app...');
    
    // Extract routes from main app
    const mainApp = this.app as any;
    if (mainApp.routes && Array.isArray(mainApp.routes)) {
      console.log(`Found ${mainApp.routes.length} routes in main app`);
      mainApp.routes.forEach((route: any) => {
        if (route.path && route.handler) {
          // Skip middleware routes and swagger routes
          if (route.path === '/*' || route.path.startsWith('/swagger-ui')) {
            return;
          }
          
          // Convert path to OpenAPI format
          const openAPIPath = this.convertToOpenAPIPath(route.path, {} as any);
          
          const routeOptions = {
            tags: [this.generateTagFromPath(route.path)],
            summary: `${(route.method || 'get').toUpperCase()} ${route.path}`,
            description: `Auto-generated from main application`,
            requestBody: this.generateRequestBodyFromMethod(route.method || 'get')
          };
          
          this.autoRegisterRoute(route.method || 'get', openAPIPath, routeOptions);
        }
      });
    }
  }

  /**
   * Enable auto-scanning of router files
   */
  public async enableAutoScan(srcPath: string = './src'): Promise<void> {
    this.autoScanEnabled = true;
    this.routerScanner = new RouterScanner(srcPath);
    
    console.log('Auto-scanning enabled for router files');
    await this.scanAndRegisterRouters();
  }

  /**
   * Enable file watching for automatic updates
   */
  public async enableFileWatching(srcPath: string = './src'): Promise<void> {
    if (this.fileWatcher) {
      console.log('File watcher is already enabled');
      return;
    }

    this.fileWatcher = new FileWatcher({
      srcPath,
      onRoutersChanged: async (routers: RouterInfo[]) => {
        console.log('Routers changed, updating documentation...');
        await this.scanAndRegisterRouters();
      },
      onError: (error: Error) => {
        console.error('File watcher error:', error);
      }
    });

    await this.fileWatcher.startWatching();
    console.log('File watching enabled');
  }

  /**
   * Disable file watching
   */
  public disableFileWatching(): void {
    if (this.fileWatcher) {
      this.fileWatcher.stopWatching();
      this.fileWatcher = null;
      console.log('File watching disabled');
    }
  }

  /**
   * Scan for routers and register their routes
   */
  public async scanAndRegisterRouters(): Promise<void> {
    if (!this.autoScanEnabled && !this.fileWatcher) {
      console.log('Auto-scanning not enabled');
      return;
    }

    try {
      console.log('Scanning for routers in source files...');
      const routers = await this.routerScanner.scanForRouters();
      
      for (const router of routers) {
        console.log(`Processing router: ${router.routerName} from ${router.filePath}`);
        
        // Generate base path from file path
        const basePath = this.generateBasePathFromFilePath(router.filePath);
        
        // Register routes from this router
        for (const route of router.routes) {
          const fullPath = basePath + route.path;
          const routeOptions = {
            tags: [this.generateTagFromPath(fullPath)],
            summary: `${route.method.toUpperCase()} ${fullPath}`,
            description: `Auto-generated from ${router.filePath}`,
            requestBody: this.generateRequestBodyFromMethod(route.method)
          };
          
          this.autoRegisterRoute(route.method, fullPath, routeOptions);
        }
      }
      
      console.log(`Registered routes from ${routers.length} routers`);
    } catch (error) {
      console.error('Error scanning and registering routers:', error);
    }
  }

  /**
   * Generate base path from file path
   */
  private generateBasePathFromFilePath(filePath: string): string {
    // Extract path from file structure
    // e.g., src/routes/users.ts -> /api/users
    const pathParts = filePath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const fileNameWithoutExt = fileName.replace(/\.(ts|js|tsx|jsx)$/, '');
    
    // If it's in a routes directory, add /api prefix
    if (pathParts.includes('routes')) {
      return `/api/${fileNameWithoutExt}`;
    }
    
    // Default to /api prefix
    return `/api/${fileNameWithoutExt}`;
  }



  /**
   * Extract and register existing routes from a sub-application
   */
  private extractAndRegisterExistingRoutes(basePath: string, subApp: Hono): void {
    // Try to access internal routes if available
    const internalApp = subApp as any;
    
    // Method 1: Use Hono's app.routes property (most reliable)
    if (internalApp.routes && Array.isArray(internalApp.routes)) {
      console.log(`Found ${internalApp.routes.length} routes in subApp.routes for ${basePath}`);
      internalApp.routes.forEach((route: any) => {
        if (route.path && route.handler) {
          const fullPath = basePath + route.path;
          // Convert path to OpenAPI format
          const openAPIPath = this.convertToOpenAPIPath(fullPath, {} as any);
          
          const routeOptions = {
            tags: [this.generateTagFromPath(fullPath)],
            summary: `${(route.method || 'get').toUpperCase()} ${fullPath}`,
            description: `Auto-generated from sub-application`,
            requestBody: this.generateRequestBodyFromMethod(route.method || 'get')
          };
          
          this.autoRegisterRoute(route.method || 'get', openAPIPath, routeOptions);
        }
      });
      return; // If we found routes this way, we're done
    }
    
    // Method 2: Try to access the internal router
    if (internalApp.router && internalApp.router.routes) {
      console.log(`Found ${internalApp.router.routes.length} routes in subApp.router.routes for ${basePath}`);
      internalApp.router.routes.forEach((route: any) => {
        if (route.path && route.handler) {
          const fullPath = basePath + route.path;
          const routeOptions = {
            tags: [this.generateTagFromPath(fullPath)],
            summary: `${(route.method || 'get').toUpperCase()} ${fullPath}`,
            description: `Auto-generated from sub-application`,
            requestBody: this.generateRequestBodyFromMethod(route.method || 'get')
          };
          
          this.autoRegisterRoute(route.method || 'get', fullPath, routeOptions);
        }
      });
      return;
    }
    
    // Method 3: Try to access the internal app structure
    if (internalApp._routes && Array.isArray(internalApp._routes)) {
      console.log(`Found ${internalApp._routes.length} routes in subApp._routes for ${basePath}`);
      internalApp._routes.forEach((route: any) => {
        if (route.path && route.handler) {
          const fullPath = basePath + route.path;
          const routeOptions = {
            tags: [this.generateTagFromPath(fullPath)],
            summary: `${(route.method || 'get').toUpperCase()} ${fullPath}`,
            description: `Auto-generated from sub-application`,
            requestBody: this.generateRequestBodyFromMethod(route.method || 'get')
          };
          
          this.autoRegisterRoute(route.method || 'get', fullPath, routeOptions);
        }
      });
      return;
    }
    
    // Method 4: Try to access the internal router structure (Hono v4+)
    if (internalApp.router && internalApp.router.node) {
      console.log(`Extracting routes from router.node for ${basePath}`);
      this.extractRoutesFromNode(internalApp.router.node, basePath);
      return;
    }
    
    console.log(`No routes found for subApp at ${basePath}`);
  }

  /**
   * Recursively extract routes from Hono's internal router node structure
   */
  private extractRoutesFromNode(node: any, basePath: string): void {
    if (!node) return;
    
    // Check if this node has a handler
    if (node.handler) {
      const method = node.method || 'get';
      const path = node.path || '';
      const fullPath = basePath + path;
      
      const routeOptions = {
        tags: [this.generateTagFromPath(fullPath)],
        summary: `${method.toUpperCase()} ${fullPath}`,
        description: `Auto-generated from sub-application`,
        requestBody: this.generateRequestBodyFromMethod(method)
      };
      
      this.autoRegisterRoute(method, fullPath, routeOptions);
    }
    
    // Recursively check children
    if (node.children) {
      node.children.forEach((child: any) => {
        this.extractRoutesFromNode(child, basePath);
      });
    }
    
    // Check dynamic routes
    if (node.dynamic) {
      this.extractRoutesFromNode(node.dynamic, basePath);
    }
    
    // Check wildcard routes
    if (node.wildcard) {
      this.extractRoutesFromNode(node.wildcard, basePath);
    }
  }

  /**
   * Initialize swagger middleware and routes
   */
  public init(): MiddlewareHandler {
    // Add swagger UI route immediately
    this.app.get(this.options.route!, (c) => {
      return c.html(swaggerUITemplate);
    });

    // Add OpenAPI spec endpoint immediately
    this.app.get(`${this.options.route}/openapi.json`, (c) => {
      return c.json(this.generateOpenAPISpec());
    });

    // Return middleware that captures route information
    return async (c: Context, next) => {
      await next();
      
      // After request processing, capture route info if not already documented
      const path = c.req.path;
      const method = c.req.method.toLowerCase();
      
      if (!this.isRouteDocumented(method, path) && !this.shouldExcludePath(path)) {
        const routeInfo = this.extractRouteInfoFromContext(c);
        if (routeInfo) {
          this.addRoute(routeInfo);
        }
      }
    };
  }

  /**
   * Manually add a route to documentation
   */
  public addRoute(route: RouteInfo): void {
    // Check if route already exists
    const existingIndex = this.routes.findIndex(
      r => r.method === route.method && r.path === route.path
    );
    
    if (existingIndex >= 0) {
      // Update existing route
      this.routes[existingIndex] = { ...this.routes[existingIndex], ...route };
    } else {
      // Add new route
      this.routes.push(route);
    }
  }

  /**
   * Extract route information from Hono context
   */
  private extractRouteInfo(c: Context, options?: any): RouteInfo | null {
    const path = c.req.path;
    const method = c.req.method.toLowerCase();

    if (this.shouldExcludePath(path)) {
      return null;
    }

    // Convert Hono route pattern to OpenAPI format
    const openAPIPath = this.convertToOpenAPIPath(path, c);

    return {
      method,
      path: openAPIPath,
      parameters: this.extractParameters(openAPIPath, c),
      responses: this.generateDefaultResponses(),
      tags: options?.tags || [this.generateTagFromPath(openAPIPath)],
      summary: options?.summary || `${method.toUpperCase()} ${openAPIPath}`,
      description: options?.description
    };
  }

  /**
   * Extract route info from context after request processing
   */
  private extractRouteInfoFromContext(c: Context): RouteInfo | null {
    try {
      const path = c.req.path;
      const method = c.req.method.toLowerCase();

      // Get route pattern from Hono's internal routing
      const routePattern = this.getRoutePattern(c) || path;
      const openAPIPath = this.convertToOpenAPIPath(routePattern, c);

      return {
        method,
        path: openAPIPath,
        parameters: this.extractParameters(openAPIPath, c),
        responses: this.generateResponsesFromContext(c),
        tags: [this.generateTagFromPath(openAPIPath)],
        summary: `${method.toUpperCase()} ${openAPIPath}`
      };
    } catch (error) {
      console.warn('Failed to extract route info:', error);
      return null;
    }
  }

  /**
   * Get route pattern from Hono context (if available)
   */
  private getRoutePattern(c: Context): string | null {
    try {
      // Try to access Hono's internal route information
      const req = c.req as any;
      if (req.routePath) {
        return req.routePath;
      }
      
      // Alternative: check if there are path parameters
      const url = new URL(c.req.url);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      
      // This is a simplified approach - in practice, you'd need more sophisticated route pattern detection
      return url.pathname;
    } catch {
      return null;
    }
  }

  /**
   * Convert Hono path to OpenAPI path format
   */
  private convertToOpenAPIPath(path: string, c: Context): string {
    // Convert :param to {param} format
    let openAPIPath = path.replace(/:(\w+)/g, '{$1}');
    
    // Try to detect parameters from actual request
    try {
      const pathParams = c.req.param();
      if (pathParams && Object.keys(pathParams).length > 0) {
        Object.keys(pathParams).forEach(param => {
          const paramValue = pathParams[param];
          // Replace the actual value with parameter placeholder
          openAPIPath = openAPIPath.replace(
            new RegExp(`/${paramValue}(?=/|$)`), 
            `/{${param}}`
          );
        });
      }
    } catch {
      // Ignore if param() is not available
    }

    return openAPIPath;
  }

  /**
   * Extract parameters from path and context
   */
  private extractParameters(path: string, c: Context): any[] {
    const parameters: any[] = [];

    // Extract path parameters
    const pathParams = path.match(/\{(\w+)\}/g);
    if (pathParams) {
      pathParams.forEach(param => {
        const paramName = param.replace(/[{}]/g, '');
        parameters.push({
          name: paramName,
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        });
      });
    }

    // Extract query parameters from current request
    try {
      const url = new URL(c.req.url);
      url.searchParams.forEach((value, key) => {
        if (!parameters.some(p => p.name === key)) {
          parameters.push({
            name: key,
            in: 'query',
            required: false,
            schema: {
              type: 'string'
            }
          });
        }
      });
    } catch {
      // Ignore URL parsing errors
    }

    return parameters;
  }

  /**
   * Generate default responses
   */
  private generateDefaultResponses(): any {
    return {
      '200': {
        description: 'Success',
        content: {
          'application/json': {
            schema: {
              type: 'object'
            }
          }
        }
      },
      '400': {
        description: 'Bad Request',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' }
              }
            }
          }
        }
      },
      '500': {
        description: 'Internal Server Error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' }
              }
            }
          }
        }
      }
    };
  }

  /**
   * Generate responses based on context (after response)
   */
  private generateResponsesFromContext(c: Context): any {
    const responses = this.generateDefaultResponses();
    
    try {
      // If response is available, try to infer content type and status
      const status = c.res?.status || 200;
      const contentType = c.res?.headers.get('content-type') || 'application/json';
      
      responses[status.toString()] = {
        description: this.getStatusDescription(status),
        content: {
          [contentType]: {
            schema: {
              type: contentType.includes('json') ? 'object' : 'string'
            }
          }
        }
      };
    } catch {
      // Use default responses if context analysis fails
    }

    return responses;
  }

  /**
   * Get status code description
   */
  private getStatusDescription(status: number): string {
    const descriptions: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error'
    };
    return descriptions[status] || 'Success';
  }

  /**
   * Generate tag from path
   */
  private generateTagFromPath(path: string): string {
    const segments = path.split('/').filter(s => s && !s.startsWith('{'));
    return segments.length > 0 ? segments[1] || segments[0] : 'default';
  }

  /**
   * Check if route is already documented
   */
  private isRouteDocumented(method: string, path: string): boolean {
    return this.routes.some(r => r.method === method && r.path === path);
  }

  /**
   * Check if path should be excluded from documentation
   */
  private shouldExcludePath(path: string): boolean {
    if (path.startsWith(this.options.route!)) {
      return true;
    }
    
    return this.options.excludePaths?.some(excludePath => 
      path.startsWith(excludePath)
    ) || false;
  }

  /**
   * Generate complete OpenAPI specification
   */
  public generateOpenAPISpec(): any {
    const paths: Record<string, any> = {};

    this.routes.forEach(route => {
      if (!paths[route.path]) {
        paths[route.path] = {};
      }

      const operation: any = {
        tags: route.tags,
        summary: route.summary,
        parameters: route.parameters,
        responses: route.responses
      };

      if (route.description) {
        operation.description = route.description;
      }

      // Add request body for methods that typically have one
      if (['post', 'put', 'patch'].includes(route.method)) {
        operation.requestBody = route.requestBody || {
          content: {
            'application/json': {
              schema: {
                type: 'object'
              }
            }
          }
        };
      }

      paths[route.path][route.method] = operation;
    });

    return {
      openapi: '3.0.0',
      info: {
        title: this.options.info?.title || this.options.title,
        version: this.options.info?.version || this.options.version,
        description: this.options.info?.description || this.options.description,
        ...(this.options.info?.contact && { contact: this.options.info.contact }),
        ...(this.options.info?.license && { license: this.options.info.license })
      },
      paths
    };
  }
}

// Convenience function to create middleware
export function swagger(app: Hono, options?: SwaggerOptions): HonoSwagger {
  return new HonoSwagger(app, options);
}

export default swagger;