import { watch, FSWatcher } from 'fs';
import { join, extname } from 'path';
import { RouterScanner, RouterInfo } from './routerScanner';

export interface FileWatcherOptions {
  srcPath?: string;
  fileExtensions?: string[];
  debounceMs?: number;
  onRoutersChanged?: (routers: RouterInfo[]) => void;
  onError?: (error: Error) => void;
}

export class FileWatcher {
  private watcher: FSWatcher | null = null;
  private options: FileWatcherOptions;
  private routerScanner: RouterScanner;
  private debounceTimer: NodeJS.Timeout | null = null;
  private lastScanTime: number = 0;

  constructor(options: FileWatcherOptions = {}) {
    this.options = {
      srcPath: './src',
      fileExtensions: ['.ts', '.js', '.tsx', '.jsx'],
      debounceMs: 1000,
      ...options
    };

    this.routerScanner = new RouterScanner(
      this.options.srcPath,
      this.options.fileExtensions
    );
  }

  /**
   * Start watching the src directory for changes
   */
  public async startWatching(): Promise<void> {
    if (this.watcher) {
      console.log('File watcher is already running');
      return;
    }

    try {
      console.log(`Starting file watcher for ${this.options.srcPath}`);
      
      this.watcher = watch(this.options.srcPath!, {
        recursive: true,
        persistent: true
      });

      this.watcher.on('change', (eventType, filename) => {
        this.handleFileChange(eventType, filename?.toString() || '');
      });

      this.watcher.on('error', (error) => {
        console.error('File watcher error:', error);
        this.options.onError?.(error);
      });

      // Initial scan
      await this.scanRouters();
    } catch (error) {
      console.error('Error starting file watcher:', error);
      this.options.onError?.(error as Error);
    }
  }

  /**
   * Stop watching the src directory
   */
  public stopWatching(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log('File watcher stopped');
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Handle file change events
   */
  private handleFileChange(eventType: string, filename: string): void {
    // Only process relevant file types
    if (!this.options.fileExtensions!.includes(extname(filename))) {
      return;
    }

    console.log(`File change detected: ${eventType} - ${filename}`);

    // Debounce the scan to avoid multiple rapid scans
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(async () => {
      await this.scanRouters();
    }, this.options.debounceMs);
  }

  /**
   * Scan for routers and notify listeners
   */
  private async scanRouters(): Promise<void> {
    const now = Date.now();
    if (now - this.lastScanTime < 1000) {
      // Prevent too frequent scans
      return;
    }
    this.lastScanTime = now;

    try {
      console.log('Scanning for routers...');
      const routers = await this.routerScanner.scanForRouters();
      
      console.log(`Found ${routers.length} routers:`);
      routers.forEach(router => {
        console.log(`  - ${router.routerName} (${router.filePath}) with ${router.routes.length} routes`);
      });

      this.options.onRoutersChanged?.(routers);
    } catch (error) {
      console.error('Error scanning routers:', error);
      this.options.onError?.(error as Error);
    }
  }

  /**
   * Get the router scanner instance
   */
  public getRouterScanner(): RouterScanner {
    return this.routerScanner;
  }

  /**
   * Manually trigger a scan
   */
  public async manualScan(): Promise<RouterInfo[]> {
    return await this.routerScanner.scanForRouters();
  }
} 