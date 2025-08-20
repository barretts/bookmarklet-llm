import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

interface BookmarkletSettings {
  theme?: string;
  serverUrl?: string;
  initialQuestion?: string;
  autoStart?: boolean;
  position?: string;
  fontSize?: string;
}

export class BookmarkletBuilder {
  private static cachedBookmarklet: string | null = null;
  private static lastBuildTime: number = 0;
  private static isBuilding: boolean = false;
  private static readonly defaultSettings: BookmarkletSettings = {
    theme: 'dark',
    serverUrl: 'http://localhost:4000',
    initialQuestion: 'Give me answers to the multiple choice questions above. Do not include any other text.',
    autoStart: true,
    position: 'bottom-right',
    fontSize: '14px'
  };

  static async buildBookmarklet(): Promise<string> {
    if (this.isBuilding) {
      while (this.isBuilding) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.cachedBookmarklet || '';
    }

    this.isBuilding = true;

    try {
      const distDir = path.join(projectRoot, 'dist');
      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
      }

      const version = process.env.npm_package_version || '2.0.0';
      const buildDate = new Date().toISOString().split('T')[0];
      
      const buildNumberFile = path.join(projectRoot, '.build-number');
      let buildNumber = 1;
      if (fs.existsSync(buildNumberFile)) {
        buildNumber = parseInt(fs.readFileSync(buildNumberFile, 'utf8')) + 1;
      }
      fs.writeFileSync(buildNumberFile, buildNumber.toString());

      console.log(`🔧 Building LLM Bookmarklet v${version} (build #${buildNumber})...`);

      const mainTsPath = path.join(projectRoot, 'src', 'bookmarklet', 'main.ts');
      let mainTsContent = fs.readFileSync(mainTsPath, 'utf8');
      mainTsContent = mainTsContent.replace(
        /const BUILD_INFO = \{[^}]*\};/,
        `const BUILD_INFO = {
  version: '${version}',
  buildNumber: '${buildNumber}',
  buildDate: '${buildDate}'
};`
      );
      fs.writeFileSync(mainTsPath, mainTsContent);

      console.log('📦 Bundling bookmarklet...');

      const bundleCommand = `npx esbuild src/bookmarklet/main.ts --bundle --format=iife --outfile=dist/bookmarklet.bundle.js --minify=false`;
      execSync(bundleCommand, { stdio: 'inherit' });

      const bundleFile = path.join(distDir, 'bookmarklet.bundle.js');
      if (!fs.existsSync(bundleFile)) {
        throw new Error(`Bundle file not found: ${bundleFile}`);
      }

      console.log('📦 Injecting build information...');
      let bundleContent = fs.readFileSync(bundleFile, 'utf8');
      bundleContent = bundleContent.replace(
        /const BUILD_INFO = \{[^}]*\};/,
        `const BUILD_INFO = {
  version: '${version}',
  buildNumber: '${buildNumber}',
  buildDate: '${buildDate}'
};`
      );
      fs.writeFileSync(bundleFile, bundleContent);

      console.log('📦 Minifying JavaScript...');
      const minified = execSync(`npx terser "${bundleFile}" -c -m --comments false`, { encoding: 'utf8' });

      const bookmarklet = 'javascript:' + minified
        .replace(/\n/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      this.cachedBookmarklet = bookmarklet;
      this.lastBuildTime = Date.now();

      const minFile = path.join(distDir, 'bookmarklet.min.js');
      fs.writeFileSync(minFile, bookmarklet);

      console.log('✅ Bookmarklet built successfully!');
      return bookmarklet;
    } catch (error) {
      console.error('❌ Failed to build bookmarklet:', error);
      throw error;
    } finally {
      this.isBuilding = false;
    }
  }

  static async getBookmarklet(): Promise<string> {
    // In development mode, always rebuild on each request
    if (process.env.NODE_ENV === 'development') {
      console.log('🔥 Development mode: Rebuilding bookmarklet on request');
      return await this.buildBookmarklet();
    }

    // In production, use cache
    const now = Date.now();
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes

    if (this.cachedBookmarklet && (now - this.lastBuildTime) < cacheExpiry) {
      return this.cachedBookmarklet;
    }

    const distPath = path.join(projectRoot, 'dist', 'bookmarklet.min.js');
    if (fs.existsSync(distPath)) {
      const bookmarklet = fs.readFileSync(distPath, 'utf8');
      this.cachedBookmarklet = bookmarklet;
      this.lastBuildTime = now;
      return bookmarklet;
    }

    return await this.buildBookmarklet();
  }
  
  /**
   * Generate a customized bookmarklet with embedded settings
   * @param customSettings User-provided settings to embed in the bookmarklet
   */
  static async generateCustomBookmarklet(customSettings: BookmarkletSettings): Promise<string> {
    console.log('Generating custom bookmarklet with settings:', customSettings);
    
    // Merge default settings with custom settings
    const settings = {
      ...this.defaultSettings,
      ...customSettings
    };
    
    try {
      // Build the standard bookmarklet as a starting point
      let baseBookmarklet = await this.buildBookmarklet();
      
      // Strip the 'javascript:' prefix if present
      if (baseBookmarklet.startsWith('javascript:')) {
        baseBookmarklet = baseBookmarklet.substring(11);
      }
      
      // Create a wrapper function that injects custom settings
      const customBookmarklet = `javascript:(function(){
// User's custom settings
var USER_SETTINGS = ${JSON.stringify(settings)};

// Inject settings before executing the bookmarklet
window.__BOOKMARKLET_SETTINGS = USER_SETTINGS;

// Execute the original bookmarklet code
${baseBookmarklet}
})();`;
      
      // Create a temporary file for the custom bookmarklet
      const tempFile = path.join(projectRoot, 'dist', 'custom-bookmarklet.js');
      fs.writeFileSync(tempFile, customBookmarklet);
      
      // Use terser to minify (same as used in buildBookmarklet)
      const minified = execSync(
        `npx terser "${tempFile}" -c -m --comments false`, 
        { encoding: 'utf8' }
      );
      
      // Clean up temp file
      fs.unlinkSync(tempFile);
      
      // Format for bookmarklet use
      return minified
        .replace(/\n/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    } catch (error) {
      console.error('Failed to generate custom bookmarklet:', error);
      throw error;
    }
  }
}