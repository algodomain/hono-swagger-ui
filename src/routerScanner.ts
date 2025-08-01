import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { Hono } from 'hono';

export interface RouterInfo {
  filePath: string;
  routerName: string;
  routes: RouteInfo[];
  exportType: 'default' | 'named' | 'both';
}

export interface RouteInfo {
  method: string;
  path: string;
  lineNumber: number;
}

export class RouterScanner {
  private srcPath: string;
  private fileExtensions: string[];

  constructor(srcPath: string = './src', fileExtensions: string[] = ['.ts', '.js', '.tsx', '.jsx']) {
    this.srcPath = srcPath;
    this.fileExtensions = fileExtensions;
  }

  /**
   * Scan the entire src directory for Hono routers
   */
  public async scanForRouters(): Promise<RouterInfo[]> {
    const routers: RouterInfo[] = [];
    
    if (!existsSync(this.srcPath)) {
      console.log(`Source path ${this.srcPath} does not exist`);
      return routers;
    }

    const files = this.getAllFiles(this.srcPath);
    
    for (const file of files) {
      if (this.fileExtensions.includes(extname(file))) {
        const routerInfo = this.extractRouterFromFile(file);
        if (routerInfo) {
          routers.push(routerInfo);
        }
      }
    }

    return routers;
  }

  /**
   * Get all files recursively from a directory
   */
  private getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
    const files = readdirSync(dirPath);

    files.forEach(file => {
      const fullPath = join(dirPath, file);
      if (statSync(fullPath).isDirectory()) {
        arrayOfFiles = this.getAllFiles(fullPath, arrayOfFiles);
      } else {
        arrayOfFiles.push(fullPath);
      }
    });

    return arrayOfFiles;
  }

  /**
   * Extract router information from a single file
   */
  private extractRouterFromFile(filePath: string): RouterInfo | null {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      // Look for Hono router creation patterns
      const routerPatterns = [
        /const\s+(\w+)\s*=\s*new\s+Hono\(\)/g,
        /let\s+(\w+)\s*=\s*new\s+Hono\(\)/g,
        /export\s+const\s+(\w+)\s*=\s*new\s+Hono\(\)/g,
        /export\s+default\s+new\s+Hono\(\)/g,
        /const\s+(\w+)\s*=\s*new\s+Hono\(\)/g
      ];

      let routerName: string | null = null;
      let exportType: 'default' | 'named' | 'both' = 'named';

      // Check for router creation
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        for (const pattern of routerPatterns) {
          const match = pattern.exec(line);
          if (match) {
            routerName = match[1] || 'default';
            if (line.includes('export default')) {
              exportType = 'default';
            } else if (line.includes('export')) {
              exportType = 'named';
            }
            break;
          }
        }
        
        if (routerName) break;
      }

      if (!routerName) {
        return null;
      }

      // Extract routes from the file
      const routes = this.extractRoutesFromContent(content, routerName);

      return {
        filePath,
        routerName,
        routes,
        exportType
      };
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Extract routes from file content
   */
  private extractRoutesFromContent(content: string, routerName: string): RouteInfo[] {
    const routes: RouteInfo[] = [];
    const lines = content.split('\n');

    // Route patterns to match
    const routePatterns = [
      new RegExp(`${routerName}\\.(get|post|put|delete|patch|options|head)\\s*\\(\\s*['"]([^'"]+)['"]`, 'g'),
      new RegExp(`${routerName}\\.(get|post|put|delete|patch|options|head)\\s*\\(\\s*\`([^\`]+)\``, 'g')
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const pattern of routePatterns) {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          routes.push({
            method: match[1].toLowerCase(),
            path: match[2],
            lineNumber: i + 1
          });
        }
      }
    }

    return routes;
  }

  /**
   * Get router instance from file (for dynamic loading)
   */
  public async getRouterInstance(filePath: string): Promise<Hono | null> {
    try {
      // Dynamic import the file
      const module = await import(filePath);
      
      // Check for default export
      if (module.default && module.default instanceof Hono) {
        return module.default;
      }
      
      // Check for named exports
      for (const key in module) {
        if (module[key] instanceof Hono) {
          return module[key];
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error loading router from ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Generate route documentation from router info
   */
  public generateRouteDocumentation(routerInfo: RouterInfo, basePath: string = ''): any[] {
    return routerInfo.routes.map(route => ({
      method: route.method,
      path: basePath + route.path,
      file: routerInfo.filePath,
      line: route.lineNumber,
      routerName: routerInfo.routerName
    }));
  }
} 