import fs from 'fs';
import path from 'path';
import type { LLMConfig, LLMProvider, SupportedProviders } from '../types/index.js';

interface BookmarkletConfig {
  autoGenerate: boolean;
  defaultQuestion: string;
  themes: string[];
  defaultTheme: string;
}

interface FeaturesConfig {
  enableHistory: boolean;
  maxHistoryLength: number;
  enableLogging: boolean;
  enableMetrics: boolean;
}

interface DefaultConfig extends LLMConfig {
  bookmarklet: BookmarkletConfig;
}

interface ProviderStatus {
  model: string;
  temperature: number;
  hasApiKey: boolean;
  status: 'local' | 'configured' | 'needs-key';
}

interface ProviderStatusResponse {
  active: string;
  available: string[];
  providers: Record<string, ProviderStatus>;
}

export class ConfigManager {
  private configPath: string;
  private defaultConfig: DefaultConfig;
  public config!: DefaultConfig;

  constructor(configPath = './config/llm-config.json') {
    this.configPath = configPath;
    this.defaultConfig = {
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
      bookmarklet: {
        autoGenerate: true,
        defaultQuestion: "Give me answers to the multiple choice questions above. Don't include any other text.",
        themes: ['dark', 'light', 'blue'],
        defaultTheme: 'dark',
      },
    };
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      // Ensure config directory exists
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      if (fs.existsSync(this.configPath)) {
        const configData = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        this.config = { ...this.defaultConfig, ...configData };
      } else {
        this.config = { ...this.defaultConfig };
        this.saveConfig();
      }
    } catch (error) {
      console.error('⚠️  Error loading config, using defaults:', (error as Error).message);
      this.config = { ...this.defaultConfig };
    }
  }

  private saveConfig(): void {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('⚠️  Error saving config:', (error as Error).message);
    }
  }

  public getActiveProvider(): LLMProvider {
    return this.config.providers[this.config.activeProvider];
  }

  public setActiveProvider(provider: string): boolean {
    if (this.config.providers[provider as SupportedProviders]) {
      this.config.activeProvider = provider as SupportedProviders;
      this.saveConfig();
      return true;
    }
    return false;
  }

  public updateProvider(provider: string, settings: Partial<LLMProvider>): boolean {
    if (this.config.providers[provider as SupportedProviders]) {
      this.config.providers[provider as SupportedProviders] = {
        ...this.config.providers[provider as SupportedProviders],
        ...settings,
      };
      this.saveConfig();
      return true;
    }
    return false;
  }

  public resetToDefaults(): void {
    this.config = { ...this.defaultConfig };
    this.saveConfig();
  }

  // Get sanitized config (hide API keys)
  public getSafeConfig(): LLMConfig {
    const safeConfig = { ...this.config };
    Object.keys(safeConfig.providers).forEach((provider) => {
      if (safeConfig.providers[provider as SupportedProviders].apiKey) {
        safeConfig.providers[provider as SupportedProviders].apiKey = safeConfig.providers[provider as SupportedProviders].apiKey ? '***' : '';
      }
    });
    return safeConfig;
  }

  public getProviderStatus(): ProviderStatusResponse {
    const providers: Record<string, ProviderStatus> = {};
    for (const [name, config] of Object.entries(this.config.providers)) {
      providers[name] = {
        model: config.model,
        temperature: config.temperature || 0.1,
        hasApiKey: !!config.apiKey,
        status: name === 'lmstudio' ? 'local' : config.apiKey ? 'configured' : 'needs-key',
      };
    }

    return {
      active: this.config.activeProvider,
      available: Object.keys(this.config.providers),
      providers,
    };
  }
} 