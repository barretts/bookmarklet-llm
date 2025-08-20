#!/usr/bin/env node

import { transform } from '@swc/core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Ensure dist directory exists
const distDir = path.join(projectRoot, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const version = process.env.npm_package_version || '2.0.0';
const buildDate = new Date().toISOString().split('T')[0];

// Generate build number
const buildNumberFile = path.join(projectRoot, '.build-number');
let buildNumber = 1;
if (fs.existsSync(buildNumberFile)) {
  buildNumber = parseInt(fs.readFileSync(buildNumberFile, 'utf8')) + 1;
}
fs.writeFileSync(buildNumberFile, buildNumber.toString());

console.log(`🔧 Building LLM Bookmarklet v${version} (build #${buildNumber})...`);

// Update build info in source file
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

async function buildTypeScriptFiles(): Promise<void> {
  console.log('📦 Compiling TypeScript files...');
  
  const srcDir = path.join(projectRoot, 'src');
  const destDir = path.join(projectRoot, 'dist');
  
  await buildDirectory(srcDir, destDir);
  console.log('✅ TypeScript compilation complete!');
}

async function buildFile(srcPath: string, destPath: string): Promise<void> {
  try {
    const source = fs.readFileSync(srcPath, 'utf8');
    
    const result = await transform(source, {
      filename: srcPath,
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: false,
          decorators: true,
          dynamicImport: true,
        },
        target: 'es2022',
        loose: false,
        externalHelpers: false,
        keepClassNames: true,
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
      module: {
        type: 'es6',
        strict: true,
        strictMode: true,
        lazy: false,
        noInterop: false,
      },
      minify: false,
      isModule: true,
    });

    // Ensure destination directory exists
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    fs.writeFileSync(destPath, result.code);
    console.log(`✅ Built: ${srcPath} → ${destPath}`);
  } catch (error) {
    console.error(`❌ Error building ${srcPath}:`, error);
  }
}

async function buildDirectory(srcDir: string, destDir: string): Promise<void> {
  if (!fs.existsSync(srcDir)) {
    console.log(`⚠️  Source directory doesn't exist: ${srcDir}`);
    return;
  }

  const files = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const file of files) {
    const srcPath = path.join(srcDir, file.name);
    const relativePath = path.relative(path.join(projectRoot, 'src'), srcPath);
    const destPath = path.join(destDir, relativePath.replace(/\.ts$/, '.js'));

    if (file.isDirectory()) {
      await buildDirectory(srcPath, destDir);
    } else if (file.name.endsWith('.ts')) {
      await buildFile(srcPath, destPath);
    }
  }
}

async function buildBookmarklet(): Promise<void> {
  console.log('📦 Building bookmarklet...');
  
  // Use esbuild to bundle the modular TypeScript into a single file
  const bundleCommand = `npx esbuild src/bookmarklet/main.ts --bundle --format=iife --outfile=dist/bookmarklet.bundle.js --minify=false`;
  
  try {
    execSync(bundleCommand, { stdio: 'inherit' });
    console.log('✅ Bookmarklet bundled successfully');
  } catch (error) {
    console.error('❌ Failed to bundle bookmarklet:', error);
    throw error;
  }
  
  const bundleFile = path.join(distDir, 'bookmarklet.bundle.js');
  const minFile = path.join(distDir, 'bookmarklet.min.js');
  const debugFile = path.join(distDir, 'bookmarklet.debug.js');

  // Ensure bundle file exists
  if (!fs.existsSync(bundleFile)) {
    throw new Error(`Bundle file not found: ${bundleFile}`);
  }

  // Replace BUILD_INFO with actual build information
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

  // Minify the JavaScript using terser
  console.log('📦 Minifying JavaScript...');
  const minified = execSync(`npx terser "${bundleFile}" -c -m --comments false`, { encoding: 'utf8' });

  // Create the bookmarklet by wrapping in javascript: and removing newlines/extra spaces
  const bookmarklet = 'javascript:' + minified
    .replace(/\n/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Write to dist/bookmarklet.min.js
  fs.writeFileSync(minFile, bookmarklet);

  // Create a formatted version for debugging
  const debugBookmarklet = `// LLM Bookmarklet v${version} (build #${buildNumber}) - Built on ${buildDate}
// Debug version (not minified)
// Source: src/bookmarklet/main.ts (modular TypeScript)
javascript:${fs.readFileSync(bundleFile, 'utf8')}`;

  fs.writeFileSync(debugFile, debugBookmarklet);

  // Create enhanced documentation
  const instructions = `# 🤖 Multi-Provider LLM Bookmarklet v${version}

## Quick Installation

1. **Copy the bookmarklet code**: Open \`dist/bookmarklet.min.js\` and copy the entire contents
2. **Create a new bookmark**: In your browser, create a new bookmark
3. **Paste as URL**: Instead of a normal URL, paste the bookmarklet code
4. **Name it**: Give it a name like "LLM Chat"
5. **Start the server**: Run \`npm start\` to start the local server
6. **Use it**: Visit any webpage and click your bookmark!

## Configuration

### Quick Start
\`\`\`bash
# Install and build everything
npm run setup

# Configure your providers
npm run config

# Start the server
npm start
\`\`\`

### Web Configuration Interface
Open [http://localhost:4000/config-ui](http://localhost:4000/config-ui) when the server is running.

### CLI Configuration
\`\`\`bash
# Interactive configuration menu
npm run config

# Quick commands
npm run config:status
npm run config:set openai
npm run config:test
\`\`\`

## Supported Providers

### 🏠 LM Studio (Default)
- Local AI models
- No API key required
- Privacy-focused
- Configurable models

### 🤖 OpenAI
- GPT-4, GPT-3.5 models
- Requires API key: \`OPENAI_API_KEY\`
- Fast and reliable
- High-quality responses

### 🧠 Anthropic Claude
- Claude 3 models (Haiku, Sonnet, Opus)
- Requires API key: \`ANTHROPIC_API_KEY\`
- Excellent for analysis
- Safety-focused

### 🌟 Google Gemini
- Gemini 1.5 models (Flash, Pro)
- Requires API key: \`GEMINI_API_KEY\`
- Multimodal capabilities
- Fast processing

## Features

✨ **Smart Content Extraction** - Works on any website  
🎨 **Multiple Themes** - Dark, Light, and Blue themes  
⚙️ **Multi-Provider Support** - Switch between AI providers instantly  
💬 **Conversation History** - Maintains context across questions  
⌨️ **Keyboard Shortcuts** - Ctrl+Enter to send messages  
📋 **Quick Actions** - Copy, Clear, and Summarize buttons  
🔧 **Draggable Interface** - Move the chat window anywhere  
📱 **Responsive Design** - Works on different screen sizes  
🏥 **Health Monitoring** - Real-time provider status  
🛠️ **Configuration Management** - Web UI and CLI tools  

## Project Structure

\`\`\`
bookmarklet-llm/
├── src/
│   ├── server/          # Server-side code
│   ├── bookmarklet/     # Bookmarklet source
│   └── config/          # Configuration management
├── public/              # Static web files
├── scripts/             # Build and utility scripts
├── config/              # Configuration files
├── dist/                # Built artifacts
└── docs/                # Documentation
\`\`\`

## Troubleshooting

### Server Issues
- **Port 4000 in use**: Change PORT environment variable
- **Server won't start**: Check Node.js version (>=16.0.0 required)
- **Provider errors**: Verify API keys and network connectivity

### Bookmarklet Issues
- **Not appearing**: Check browser console for errors
- **Connection failed**: Ensure server is running
- **Wrong provider**: Check provider indicator in bookmarklet header
- **Content not extracted**: Try refreshing the page

### Configuration Issues
- **Settings not saving**: Check file permissions in config/ directory
- **Provider not working**: Test with \`npm run config:test\`
- **API key errors**: Verify key format and permissions

## Development

### Build Commands
\`\`\`bash
npm run build              # Build bookmarklet
npm run build:watch        # Build with file watching
npm run dev                # Development server with auto-reload
npm run clean              # Clean build artifacts
\`\`\`

### Adding New Providers
1. Add provider configuration to \`src/config/config-manager.ts\`
2. Implement provider adapter in \`src/server/llm-providers.ts\`
3. Update streaming handler for provider-specific format
4. Test with \`npm run config:test\`

## Security & Privacy

- **API Keys**: Store in environment variables, never commit to code
- **Local Storage**: Bookmarklet settings stored locally in browser
- **CORS**: Configured for development (adjust for production)
- **HTTPS**: Use HTTPS endpoints for production deployments

---

**Built on:** ${buildDate}  
**Version:** ${version}  
**Node Version:** ${process.version}  

🚀 **Ready to enhance your web browsing with AI?**

For more details, see the main [README.md](../README.md) file.
`;

  // Analysis
  const originalSize = fs.statSync(bundleFile).size;
  const minifiedSize = bookmarklet.length;
  const compressionRatio = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);

  console.log('✅ Bookmarklet build completed successfully!');
  console.log('');
  console.log('📊 Build Analysis:');
  console.log(`   Source file:      ${path.relative(projectRoot, bundleFile)}`);
  console.log(`   Original size:    ${originalSize.toLocaleString()} bytes`);
  console.log(`   Minified size:    ${minifiedSize.toLocaleString()} bytes`);
  console.log(`   Compression:      ${compressionRatio}% smaller`);
  console.log(`   Version:          ${version}`);
  console.log(`   Build number:     ${buildNumber}`);
  console.log(`   Build date:       ${buildDate}`);
  console.log('');
  console.log('📁 Files created:');
  console.log(`   📝 ${path.relative(projectRoot, minFile)}     - Production bookmarklet`);
  console.log(`   🐛 ${path.relative(projectRoot, debugFile)}   - Debug version`);
  console.log('');
  console.log('🚀 Next steps:');
  console.log('   1. Copy contents of dist/bookmarklet.min.js');
  console.log('   2. Create a new bookmark in your browser');
  console.log('   3. Paste the bookmarklet code as the URL');
  console.log('   4. Start the server with: npm start');
  console.log('   5. Configure providers: npm run config');
  console.log('🎉 Complete build finished successfully!');
}

async function main(): Promise<void> {
  try {
    // Step 1: Build TypeScript files
    await buildTypeScriptFiles();
    
    // Step 2: Build bookmarklet
    await buildBookmarklet();
    
    console.log('🎉 Complete build finished successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

main(); 