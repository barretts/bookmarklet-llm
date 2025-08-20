// Advanced TypeScript types for the LLM Bookmarklet
// Using modern TypeScript features for maximum type safety

// Branded types for better type safety
export type Brand<T, B> = T & { __brand: B };
export type ApiKey = Brand<string, 'ApiKey'>;
export type ServerUrl = string;
export type ThemeName = 'dark' | 'light' | 'blue';
export type PositionName = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

// Provider types with strict typing
export type SupportedProviders = 'lmstudio' | 'openai' | 'anthropic' | 'gemini';

export interface LLMProvider {
  readonly name: SupportedProviders;
  readonly baseUrl?: ServerUrl;
  readonly apiKey?: ApiKey;
  readonly model: string;
  readonly systemPrompt: string;
  readonly maxTokens?: number;
  readonly temperature?: number;
  readonly enabled: boolean;
}

// Configuration types with readonly properties where appropriate
export interface LLMConfig {
  readonly activeProvider: SupportedProviders;
  readonly providers: Readonly<Record<SupportedProviders, LLMProvider>>;
  readonly features: {
    readonly enableHistory: boolean;
    readonly maxHistoryLength: number;
    readonly enableThemes: boolean;
    readonly defaultTheme: ThemeName;
  };
}

// Message types with strict role typing
export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  readonly role: MessageRole;
  readonly content: string;
  readonly timestamp?: number;
}

export interface ChatHistoryItem {
  readonly type: Extract<MessageRole, 'user' | 'assistant'>;
  readonly content: string;
  readonly timestamp: number;
}

// Request/Response types with proper typing
export interface ChatRequest {
  readonly title: string;
  readonly url: string;
  readonly text: string;
  readonly question: string;
  readonly history?: readonly ChatHistoryItem[];
  readonly provider?: SupportedProviders;
}

export interface ChatResponse {
  readonly token?: string;
  readonly error?: string;
  readonly done?: boolean;
}

// Health and status types
export type HealthStatus = 'ok' | 'error';
export type ProviderStatusType = 'healthy' | 'configured' | 'needs-key' | 'unreachable' | 'unknown' | 'error';

export interface ServerHealth {
  readonly status: HealthStatus;
  readonly timestamp: string;
  readonly activeProvider: SupportedProviders;
  readonly providerStatus: ProviderStatusType;
  readonly version: string;
}

export interface ProviderStatus {
  readonly name: SupportedProviders;
  readonly enabled: boolean;
  readonly configured: boolean;
  readonly status: ProviderStatusType;
}

// UI Configuration types
export interface Theme {
  readonly bg: string;
  readonly headerBg: string;
  readonly text: string;
  readonly border: string;
  readonly inputBg: string;
  readonly buttonBg: string;
}

export interface Position {
  readonly top?: string;
  readonly right?: string;
  readonly bottom?: string;
  readonly left?: string;
}

export interface BookmarkletConfig {
  fontSize: string;
  theme: ThemeName;
  serverUrl: ServerUrl;
  autoStart: boolean;
  position: PositionName;
  initialQuestion: string;
  bookmarklet: {
    autoGenerate: boolean;
    defaultQuestion: string;
    themes: ThemeName[];
    defaultTheme: ThemeName;
  };
}

// Utility types for better type safety
export type PartialConfig = Partial<BookmarkletConfig>;
export type ThemeConfig = Readonly<Record<ThemeName, Theme>>;
export type PositionConfig = Readonly<Record<PositionName, Position>>;

// Error types for better error handling
export class BookmarkletError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: unknown
  ) {
    super(message);
    this.name = 'BookmarkletError';
  }
}

export class NetworkError extends BookmarkletError {
  constructor(message: string, public readonly status?: number) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class ConfigurationError extends BookmarkletError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
}

// Event types for better event handling
export interface BookmarkletEvents {
  message: CustomEvent<{ content: string; role: MessageRole }>;
  error: CustomEvent<{ error: BookmarkletError }>;
  configChange: CustomEvent<{ config: BookmarkletConfig }>;
}

// API Response types
export interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
}

export interface ProviderInfo {
  readonly active: SupportedProviders;
  readonly available: readonly SupportedProviders[];
  readonly providers: Readonly<Record<SupportedProviders, {
    readonly model: string;
    readonly temperature: number;
    readonly hasApiKey: boolean;
    readonly status: ProviderStatusType;
  }>>;
}

// Build configuration
export interface BuildConfig {
  readonly version: string;
  readonly buildDate: string;
  readonly nodeVersion: string;
  readonly environment: 'development' | 'production';
}

// Type guards for runtime type checking
export const isSupportedProvider = (provider: string): provider is SupportedProviders => {
  return ['lmstudio', 'openai', 'anthropic', 'gemini'].includes(provider);
};

export const isMessageRole = (role: string): role is MessageRole => {
  return ['user', 'assistant', 'system'].includes(role);
};

export const isHealthStatus = (status: string): status is HealthStatus => {
  return ['ok', 'error'].includes(status);
};

// Utility type for creating branded types
export const createBrandedType = <T, B extends string>(
  value: T,
  brand: B
): Brand<T, B> => value as Brand<T, B>;

// Type-safe localStorage helpers
export const createStorageHelpers = <T extends Record<string, unknown>>(
  prefix: string
) => ({
  get: <K extends keyof T>(key: K): T[K] | null => {
    try {
      const item = localStorage.getItem(`${prefix}-${String(key)}`);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: <K extends keyof T>(key: K, value: T[K]): void => {
    try {
      localStorage.setItem(`${prefix}-${String(key)}`, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },
  remove: <K extends keyof T>(key: K): void => {
    localStorage.removeItem(`${prefix}-${String(key)}`);
  },
  clear: (): void => {
    Object.keys(localStorage)
      .filter(key => key.startsWith(prefix))
      .forEach(key => localStorage.removeItem(key));
  }
}); 