import type { 
  ChatRequest, 
  ChatResponse, 
  ChatHistoryItem, 
  SupportedProviders,
  ServerUrl,
  ApiResponse,
  ProviderInfo
} from '@/types';
import { NetworkError } from '@/types';

// API client configuration
export interface ApiClientConfig {
  readonly serverUrl: ServerUrl;
  readonly timeout: number;
  readonly retryAttempts: number;
  readonly retryDelay: number;
}

// Default API client configuration
const defaultApiConfig: ApiClientConfig = {
  serverUrl: 'http://localhost:4000' as ServerUrl,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
} as const;

// API client class with proper error handling
export class ApiClient {
  private readonly config: ApiClientConfig;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = { ...defaultApiConfig, ...config };
  }

  // Type-safe fetch wrapper with timeout
  private async fetchWithTimeout(
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError('Request timeout', 408);
      }
      throw error;
    }
  }

  // Retry wrapper for network requests
  private async withRetry<T>(
    operation: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retryCount < this.config.retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (retryCount + 1)));
        return this.withRetry(operation, retryCount + 1);
      }
      throw error;
    }
  }

  // Send chat request with streaming
  async sendChatRequest(
    request: ChatRequest,
    onToken: (token: string) => void,
    onError: (error: string) => void,
    onComplete: () => void
  ): Promise<void> {
    try {
      const response = await this.withRetry(() =>
        this.fetchWithTimeout(`${this.config.serverUrl}/chat-stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })
      );

      if (!response.ok) {
        throw new NetworkError(
          `Server error: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      if (!response.body) {
        throw new NetworkError('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            onComplete();
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6)) as ChatResponse;
                
                if (data.error) {
                  onError(data.error);
                  return;
                }
                
                if (data.token) {
                  onToken(data.token);
                }
                
                if (data.done) {
                  onComplete();
                  return;
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError(errorMessage);
    }
  }

  // Get provider information
  async getProviderInfo(): Promise<ProviderInfo> {
    try {
      const response = await this.withRetry(() =>
        this.fetchWithTimeout(`${this.config.serverUrl}/providers`)
      );

      if (!response.ok) {
        throw new NetworkError(
          `Failed to get provider info: ${response.status}`,
          response.status
        );
      }

      const data = await response.json() as ProviderInfo;
      return data;
    } catch (error) {
      console.error('Failed to get provider info:', error);
      throw error;
    }
  }

  // Get server health
  async getServerHealth(): Promise<{ status: 'ok' | 'error'; providerStatus: string }> {
    try {
      const response = await this.withRetry(() =>
        this.fetchWithTimeout(`${this.config.serverUrl}/health`)
      );

      if (!response.ok) {
        throw new NetworkError(
          `Health check failed: ${response.status}`,
          response.status
        );
      }

      const data = await response.json() as { status: 'ok' | 'error'; providerStatus: string };
      return data;
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'error', providerStatus: 'unreachable' };
    }
  }

  // Test server connection
  async testConnection(): Promise<boolean> {
    try {
      const health = await this.getServerHealth();
      return health.status === 'ok';
    } catch {
      return false;
    }
  }

  // Update configuration
  async updateConfig(updates: Record<string, unknown>): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() =>
        this.fetchWithTimeout(`${this.config.serverUrl}/config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        })
      );

      if (!response.ok) {
        throw new NetworkError(
          `Config update failed: ${response.status}`,
          response.status
        );
      }

      const data = await response.json() as ApiResponse;
      return data;
    } catch (error) {
      console.error('Config update failed:', error);
      throw error;
    }
  }

  // Get current configuration
  async getConfig(): Promise<Record<string, unknown>> {
    try {
      const response = await this.withRetry(() =>
        this.fetchWithTimeout(`${this.config.serverUrl}/config`)
      );

      if (!response.ok) {
        throw new NetworkError(
          `Failed to get config: ${response.status}`,
          response.status
        );
      }

      const data = await response.json() as Record<string, unknown>;
      return data;
    } catch (error) {
      console.error('Failed to get config:', error);
      throw error;
    }
  }

  // Get system prompt from current provider
  async getSystemPrompt(): Promise<string> {
    try {
      const config = await this.getConfig();
      const activeProvider = config.activeProvider as string;
      const providers = config.providers as Record<string, any>;
      
      if (activeProvider && providers && providers[activeProvider]) {
        return providers[activeProvider].systemPrompt || 'Give me answers to the multiple choice questions above. Do not include any other text.';
      }
      
      return 'Give me answers to the multiple choice questions above. Do not include any other text.';
    } catch (error) {
      console.error('Failed to get system prompt:', error);
      return 'Give me answers to the multiple choice questions above. Do not include any other text.';
    }
  }
}

// Create API client instance
export const createApiClient = (serverUrl: ServerUrl): ApiClient => {
  return new ApiClient({ serverUrl });
};

// Utility functions for common API operations
export const apiUtils = {
  // Create a chat request from user input
  createChatRequest: (
    question: string,
    history: readonly ChatHistoryItem[] = [],
    provider?: SupportedProviders
  ): ChatRequest => {
    const title = document.title;
    const url = window.location.href;
    const text = getPageContent();

    return {
      title,
      url,
      text,
      question,
      history: history.length > 0 ? [...history] : undefined,
      provider,
    };
  },

  // Extract page content
  getPageContent: (): string => {
    // Get main content areas
    const selectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.main',
      '#content',
      '#main',
    ];

    let content = '';

    // Try to find main content
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        content = element.textContent || '';
        if (content.length > 100) break;
      }
    }

    // Fallback to body content
    if (!content || content.length < 100) {
      content = document.body.textContent || '';
    }

    // Clean up content
    return content
      .replace(/\s+/g, ' ')
      .trim(); // No length limit
  },

  // Format error messages
  formatError: (error: unknown): string => {
    if (error instanceof NetworkError) {
      return `Network error: ${error.message}`;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  },
} as const;

// Helper function to get page content (exported for use in other modules)
export const getPageContent = apiUtils.getPageContent; 