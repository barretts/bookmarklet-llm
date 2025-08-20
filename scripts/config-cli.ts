#!/usr/bin/env node

import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';
import type { LLMConfig, LLMProvider, SupportedProviders } from '../src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Import ConfigManager (we'll use a simple version here to avoid complex imports)
const CONFIG_FILE = path.join(projectRoot, 'config', 'llm-config.json');

interface DefaultConfig extends LLMConfig {
  providers: Record<SupportedProviders, LLMProvider>;
}

const DEFAULT_CONFIG: DefaultConfig = {
  activeProvider: 'lmstudio',
  providers: {
    lmstudio: {
      name: 'LM Studio',
      baseUrl: 'http://localhost:1234/v1',
      model: 'auto',
      temperature: 0.1,
      maxTokens: 1000,
      systemPrompt: 'You are a helpful AI assistant analyzing web content. Be concise but thorough. Format your responses with markdown when appropriate.',
      enabled: true,
    },
    openai: {
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-4o-mini',
      temperature: 0.1,
      maxTokens: 1000,
      systemPrompt: 'You are a helpful AI assistant analyzing web content. Be concise but thorough. Format your responses with markdown when appropriate.',
      enabled: true,
    },
    anthropic: {
      name: 'Anthropic Claude',
      baseUrl: 'https://api.anthropic.com/v1',
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: 'claude-3-haiku-20240307',
      temperature: 0.1,
      maxTokens: 1000,
      systemPrompt: 'You are a helpful AI assistant analyzing web content. Be concise but thorough. Format your responses with markdown when appropriate.',
      enabled: true,
    },
    gemini: {
      name: 'Google Gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      apiKey: process.env.GEMINI_API_KEY || '',
      model: 'gemini-1.5-flash',
      temperature: 0.1,
      maxTokens: 1000,
      systemPrompt: 'You are a helpful AI assistant analyzing web content. Be concise but thorough. Format your responses with markdown when appropriate.',
      enabled: true,
    },
  },
  features: {
    enableHistory: true,
    maxHistoryLength: 6,
    enableThemes: true,
    defaultTheme: 'dark',
  },
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function loadConfig(): DefaultConfig {
  try {
    // Ensure config directory exists
    const configDir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (error) {
    console.log('⚠️  Error loading config, using defaults');
  }
  return DEFAULT_CONFIG;
}

function saveConfig(config: DefaultConfig): void {
  try {
    // Ensure config directory exists
    const configDir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log('✅ Configuration saved successfully!');
  } catch (error) {
    console.error('❌ Error saving config:', (error as Error).message);
  }
}

function showStatus(config: DefaultConfig): void {
  console.log('\n🤖 LLM Bookmarklet Configuration Status');
  console.log('==========================================');
  console.log(`Active Provider: ${config.activeProvider}`);
  console.log(`Available Providers: ${Object.keys(config.providers).join(', ')}`);
  console.log(`Configuration File: ${path.relative(projectRoot, CONFIG_FILE)}`);
  console.log('\nProvider Details:');

  for (const [name, provider] of Object.entries(config.providers)) {
    const isActive = name === config.activeProvider;
    const hasApiKey = provider.apiKey && provider.apiKey.length > 0;
    const status = name === 'lmstudio' ? 'local' : hasApiKey ? 'configured' : 'needs-key';

    console.log(`  ${isActive ? '→' : ' '} ${name}: ${provider.model} (${status})`);
    if (isActive) {
      console.log(`    Temperature: ${provider.temperature}`);
      console.log(`    Max Tokens: ${provider.maxTokens}`);
      console.log(`    Base URL: ${provider.baseUrl}`);
    }
  }
  console.log('');
}

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setActiveProvider(config: DefaultConfig): Promise<void> {
  console.log('\nAvailable providers:');
  Object.keys(config.providers).forEach((name, index) => {
    const isActive = name === config.activeProvider;
    const provider = config.providers[name as SupportedProviders];
    const hasApiKey = provider.apiKey && provider.apiKey.length > 0;
    const status = name === 'lmstudio' ? 'local' : hasApiKey ? 'configured' : 'needs-key';

    console.log(`  ${index + 1}. ${name} (${status})${isActive ? ' ← current' : ''}`);
  });

  const choice = await question('\nSelect provider (number): ');
  const providers = Object.keys(config.providers);
  const selectedProvider = providers[parseInt(choice) - 1];

  if (selectedProvider) {
    config.activeProvider = selectedProvider as SupportedProviders;
    console.log(`✅ Active provider set to: ${selectedProvider}`);
  } else {
    console.log('❌ Invalid selection');
  }
}

async function configureProvider(config: DefaultConfig): Promise<void> {
  console.log('\nAvailable providers:');
  Object.keys(config.providers).forEach((name, index) => {
    const provider = config.providers[name as SupportedProviders];
    const hasApiKey = provider.apiKey && provider.apiKey.length > 0;
    const status = name === 'lmstudio' ? 'local' : hasApiKey ? 'configured' : 'needs-key';

    console.log(`  ${index + 1}. ${name} (${status})`);
  });

  const choice = await question('\nSelect provider to configure (number): ');
  const providers = Object.keys(config.providers);
  const selectedProvider = providers[parseInt(choice) - 1];

  if (!selectedProvider) {
    console.log('❌ Invalid selection');
    return;
  }

  const provider = config.providers[selectedProvider as SupportedProviders];
  console.log(`\nConfiguring ${selectedProvider}:`);
  console.log(`Current settings:`);
  console.log(`  Model: ${provider.model}`);
  console.log(`  Temperature: ${provider.temperature}`);
  console.log(`  Max Tokens: ${provider.maxTokens}`);
  if (provider.apiKey !== undefined) {
    console.log(`  API Key: ${provider.apiKey ? '***' : 'not set'}`);
  }
  console.log(`  Base URL: ${provider.baseUrl}`);
  console.log('');

  const model = await question(`Model (${provider.model}): `);
  if (model.trim()) provider.model = model.trim();

  const temperature = await question(`Temperature (${provider.temperature}): `);
  if (temperature.trim()) provider.temperature = parseFloat(temperature);

  const maxTokens = await question(`Max Tokens (${provider.maxTokens}): `);
  if (maxTokens.trim()) provider.maxTokens = parseInt(maxTokens);

  if (provider.apiKey !== undefined) {
    const apiKey = await question(`API Key (${provider.apiKey ? '***' : 'not set'}): `);
    if (apiKey.trim()) provider.apiKey = apiKey.trim();
  }

  const baseUrl = await question(`Base URL (${provider.baseUrl}): `);
  if (baseUrl.trim()) provider.baseUrl = baseUrl.trim();

  const customPrompt = await question('Custom system prompt? (y/N): ');
  if (customPrompt.toLowerCase() === 'y') {
    console.log('\nCurrent system prompt:');
    console.log(`"${provider.systemPrompt}"`);
    console.log('\nEnter new system prompt (press Enter twice to finish):');
    let prompt = '';
    let emptyLines = 0;

    while (emptyLines < 2) {
      const line = await question('');
      if (line === '') {
        emptyLines++;
      } else {
        emptyLines = 0;
        prompt += line + '\n';
      }
    }
    if (prompt.trim()) {
      provider.systemPrompt = prompt.trim();
    }
  }

  console.log(`✅ ${selectedProvider} configuration updated!`);
}

async function testProvider(config: DefaultConfig): Promise<void> {
  const activeProvider = config.providers[config.activeProvider];
  console.log(`\n🧪 Testing ${config.activeProvider} provider...`);
  console.log(`Model: ${activeProvider.model}`);
  console.log(`Base URL: ${activeProvider.baseUrl}`);

  try {
    const testMessage = 'Hello, this is a test message. Please respond with "Test successful!"';
    const messages = [{ role: 'user' as const, content: testMessage }];

    // Simple test - just check if we can make a request
    const response = await fetch(`${activeProvider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(activeProvider.apiKey && { 'Authorization': `Bearer ${activeProvider.apiKey}` }),
      },
      body: JSON.stringify({
        model: activeProvider.model,
        messages,
        max_tokens: 50,
        temperature: 0.1,
      }),
    });

    if (response.ok) {
      console.log('✅ Provider test successful!');
    } else {
      console.log(`❌ Provider test failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Provider test failed: ${(error as Error).message}`);
  }
}

async function showMenu(config: DefaultConfig): Promise<void> {
  console.log('\n🔧 LLM Bookmarklet Configuration');
  console.log('==================================');
  console.log('1. Show status');
  console.log('2. Set active provider');
  console.log('3. Configure provider');
  console.log('4. Test provider');
  console.log('5. Save and exit');
  console.log('6. Exit without saving');

  const choice = await question('\nSelect option (1-6): ');

  switch (choice) {
    case '1':
      showStatus(config);
      await showMenu(config);
      break;
    case '2':
      await setActiveProvider(config);
      await showMenu(config);
      break;
    case '3':
      await configureProvider(config);
      await showMenu(config);
      break;
    case '4':
      await testProvider(config);
      await showMenu(config);
      break;
    case '5':
      saveConfig(config);
      rl.close();
      break;
    case '6':
      console.log('👋 Exiting without saving changes');
      rl.close();
      break;
    default:
      console.log('❌ Invalid option');
      await showMenu(config);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  const config = loadConfig();

  if (command === 'status') {
    showStatus(config);
  } else if (command === 'set') {
    await setActiveProvider(config);
    saveConfig(config);
  } else if (command === 'test') {
    await testProvider(config);
  } else {
    await showMenu(config);
  }
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
}); 