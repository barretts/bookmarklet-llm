import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { ConfigManager } from '../config/config-manager.js';
import { LLMProviders } from './llm-providers.js';
import type { ChatRequest, ChatResponse, ServerHealth, LLMProvider, ChatHistoryItem, SupportedProviders } from '../types/index.js';
import fs from 'fs';
import { BookmarkletBuilder } from './bookmarklet-builder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

const app = express();
app.use(cors());
app.use(express.json({ limit: '6mb' }));

// Initialize configuration
const configManager = new ConfigManager();

/**
 * POST /chat-stream
 * Expects: {title, url, text, question, history?, provider?}
 * Streams back Server-Sent Events: data: {"token": "..."}
 */
app.post('/chat-stream', async (req: Request<{}, {}, ChatRequest>, res: Response) => {
  try {
    const { title, url, text, question, history = [], provider } = req.body;

    // Validate required fields
    if (!title || !url || !text || !question) {
      res.status(400).json({ error: 'Missing required fields: title, url, text, question' });
      return;
    }

    // Use specified provider or default
    const activeProvider = (provider || configManager.config.activeProvider) as SupportedProviders;
    const providerConfig = configManager.config.providers[activeProvider];

    if (!providerConfig) {
      res.status(400).json({ error: `Unknown provider: ${activeProvider}` });
      return;
    }

    console.log(`🤖 Provider: ${activeProvider} (${providerConfig.model})`);
    console.log(`📝 Question: ${question.substring(0, 50)}...`);
    console.log(`📄 Page: ${title}`);
    console.log(`💬 History: ${history.length} messages`);

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Build messages array
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: providerConfig.systemPrompt },
    ];

    console.log('\n=== Message Construction ===');
    console.log('1. System prompt:', messages[0]);

    // Combine page content with question
    const contextualQuestion = `Current page: "${title}" (${url})\n\n${text}\n\nQuestion: ${question}`;
    messages.push({ role: 'user', content: contextualQuestion });
    console.log('2. Added page content and question together');
    
    console.log('\n=== Final Messages ===');
    messages.forEach((msg, i) => {
      console.log(`${i + 1}. [${msg.role}]:`, msg.content.substring(0, 50) + '...');
    });

    // Call the appropriate provider
    const response = await LLMProviders.callProvider(activeProvider, providerConfig, messages);

    if (!response.ok) {
      console.error(`❌ ${activeProvider} error: ${response.status} ${response.statusText}`);
      res.write(`data: ${JSON.stringify({ error: `${activeProvider} server error: ${response.status}` })}\n\n`);
      res.end();
      return;
    }

    console.log(`🚀 Streaming response from ${activeProvider}...`);

    // Stream processing (different for each provider)
    await LLMProviders.streamResponse(response, res, activeProvider);
  } catch (error) {
    console.error('❌ Server error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.write(`data: ${JSON.stringify({ error: (error as Error).message })}\n\n`);
      res.end();
    }
  }
});

// Configuration endpoints
app.get('/config', (_req: Request, res: Response) => {
  res.json(configManager.getSafeConfig());
});

app.post('/config', (req: Request, res: Response) => {
  try {
    const { provider, activeProvider, ...settings } = req.body;

    if (activeProvider) {
      const success = configManager.setActiveProvider(activeProvider);
      if (!success) {
        return res.status(400).json({ error: 'Invalid provider' });
      }
    }

    if (provider && settings) {
      const success = configManager.updateProvider(provider, settings);
      if (!success) {
        return res.status(400).json({ error: 'Invalid provider' });
      }
    }

    res.json({ success: true, activeProvider: configManager.config.activeProvider });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Provider list endpoint
app.get('/providers', (_req: Request, res: Response) => {
  res.json(configManager.getProviderStatus());
});

// Serve static files from public and dist directories
app.use(express.static(path.join(projectRoot, 'public')));
app.use(express.static(path.join(projectRoot, 'dist')));

// Serve the configuration interface
app.get('/config-ui', (_req: Request, res: Response) => {
  res.sendFile(path.join(projectRoot, 'public', 'config-ui.html'));
});

// Serve the dynamically built bookmarklet
app.get('/bookmarklet.min.js', async (_req: Request, res: Response) => {
  try {
    const bookmarklet = await BookmarkletBuilder.getBookmarklet();
    res.set('Content-Type', 'text/javascript');
    res.send(bookmarklet);
  } catch (error) {
    console.error('Error serving bookmarklet:', error);
    res.status(500).send('Error building bookmarklet');
  }
});

// Generate a customized bookmarklet with embedded settings
app.post('/generate-bookmarklet', async (req: Request, res: Response) => {
  try {
    const settings = req.body;
    console.log('Generating bookmarklet with custom settings:', settings);
    
    // Validate required settings
    if (!settings.theme || !settings.serverUrl) {
      return res.status(400).json({ error: 'Missing required settings: theme, serverUrl' });
    }
    
    // Generate a bookmarklet with embedded settings
    const bookmarklet = await BookmarkletBuilder.generateCustomBookmarklet(settings);
    
    res.json({
      success: true,
      bookmarklet: bookmarklet,
      settings: settings // Return the settings for confirmation
    });
  } catch (error) {
    console.error('Error generating custom bookmarklet:', error);
    res.status(500).json({ error: 'Failed to generate bookmarklet: ' + (error as Error).message });
  }
});

// Test endpoint for bookmarklet generation
app.get('/test-bookmarklet', (_req: Request, res: Response) => {
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bookmarklet Test Page</title>
    <style>
      body { font-family: -apple-system, system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
      .test-card { border: 1px solid #ccc; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
      h2 { margin-top: 0; }
      pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
      .success { color: green; }
      .error { color: red; }
    </style>
  </head>
  <body>
    <h1>Bookmarklet Test Page</h1>
    <p>This page helps you test if your bookmarklet is working correctly with embedded settings.</p>
    
    <div class="test-card">
      <h2>Test Instructions</h2>
      <ol>
        <li>Configure your bookmarklet on the <a href="/config-ui">config UI page</a></li>
        <li>Click "Generate Customized Bookmarklet"</li>
        <li>Create a bookmark with the generated code</li>
        <li>Click the bookmark while on this page</li>
        <li>Check the results below</li>
      </ol>
    </div>
    
    <div class="test-card">
      <h2>Detected Settings</h2>
      <div id="settings-result">Click your bookmarklet to see detected settings...</div>
    </div>
    
    <script>
      // This will be populated by the bookmarklet
      window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'bookmarkletSettings') {
          const settingsDiv = document.getElementById('settings-result');
          settingsDiv.innerHTML = '<pre>' + JSON.stringify(event.data.settings, null, 2) + '</pre>';
          settingsDiv.innerHTML += '<p class="success">✅ Bookmarklet loaded successfully with embedded settings!</p>';
        }
      });
      
      // Helper function to display bookmarklet settings
      window.showBookmarkletSettings = function(settings) {
        const settingsDiv = document.getElementById('settings-result');
        if (settings) {
          settingsDiv.innerHTML = '<pre>' + JSON.stringify(settings, null, 2) + '</pre>';
          settingsDiv.innerHTML += '<p class="success">✅ Bookmarklet loaded successfully with embedded settings!</p>';
        } else {
          settingsDiv.innerHTML = '<p class="error">❌ No settings found in bookmarklet!</p>';
        }
      };
    </script>
  </body>
  </html>
  `;
  
  res.send(htmlContent);
});

// Reset configuration endpoint
app.post('/config/reset', (_req: Request, res: Response) => {
  try {
    configManager.resetToDefaults();
    res.json({ success: true, message: 'Configuration reset to defaults' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  const activeProvider = configManager.getActiveProvider();
  let providerStatus: ServerHealth['providerStatus'] = 'unknown';

  try {
    if (configManager.config.activeProvider === 'lmstudio') {
      const testResponse = await fetch(`${activeProvider.baseUrl}/models`);
      providerStatus = testResponse.ok ? 'healthy' : 'error';
    } else {
      providerStatus = activeProvider.apiKey ? 'configured' : 'needs-key';
    }
  } catch {
    providerStatus = 'unreachable';
  }

  const health: ServerHealth = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeProvider: configManager.config.activeProvider,
    providerStatus,
    version: '2.0.0',
  };

  res.json(health);
});

// Root endpoint with API info
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Configurable LLM Bookmarklet Proxy',
    version: '2.0.0',
    activeProvider: configManager.config.activeProvider,
    endpoints: {
      'POST /chat-stream': 'Main chat endpoint',
      'GET /config': 'Get current configuration',
      'POST /config': 'Update configuration',
      'POST /config/reset': 'Reset configuration to defaults',
      'GET /providers': 'List available providers',
      'GET /config-ui': 'Configuration web interface',
      'GET /health': 'Health check',
      'GET /': 'This info',
    },
    supportedProviders: ['lmstudio', 'openai', 'anthropic', 'gemini'],
    configurationUI: `http://localhost:${process.env.PORT || 4000}/config-ui`,
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('🔗 Configurable LLM Bookmarklet Proxy Server');
  console.log(`🚀 Running on http://localhost:${PORT}`);
  console.log(`🤖 Active Provider: ${configManager.config.activeProvider}`);
  console.log(`📋 Available Providers: ${Object.keys(configManager.config.providers).join(', ')}`);
  console.log('💡 Configure providers via POST /config or edit config/llm-config.json');
  console.log(`🌐 Configuration UI: http://localhost:${PORT}/config-ui`);
  console.log('📚 Ready to assist with multi-provider web content analysis!');
}); 