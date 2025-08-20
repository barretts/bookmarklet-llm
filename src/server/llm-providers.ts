import type { LLMProvider, ChatMessage, SupportedProviders } from '../types/index.js';

interface StreamResponse {
  token?: string;
  error?: string;
  done?: boolean;
}

interface OpenAIResponse {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
}

interface AnthropicResponse {
  type?: string;
  delta?: {
    text?: string;
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export class LLMProviders {
  static async callLMStudio(config: LLMProvider, messages: ChatMessage[]): Promise<Response> {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: true,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
    });
    return response;
  }

  static async callOpenAI(config: LLMProvider, messages: ChatMessage[]): Promise<Response> {
    if (!config.apiKey) throw new Error('OpenAI API key not configured');

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: true,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
    });
    return response;
  }

  static async callAnthropic(config: LLMProvider, messages: ChatMessage[]): Promise<Response> {
    if (!config.apiKey) throw new Error('Anthropic API key not configured');

    // Convert messages for Claude format
    const systemMessage = messages.find((m) => m.role === 'system');
    const conversationMessages = messages.filter((m) => m.role !== 'system');

    const response = await fetch(`${config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        messages: conversationMessages,
        system: systemMessage?.content || config.systemPrompt,
        stream: true,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
    });
    return response;
  }

  static async callGemini(config: LLMProvider, messages: ChatMessage[]): Promise<Response> {
    if (!config.apiKey) throw new Error('Gemini API key not configured');

    // Convert messages for Gemini format
    const parts = messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const response = await fetch(
      `${config.baseUrl}/models/${config.model}:streamGenerateContent?key=${config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: parts,
          generationConfig: {
            temperature: config.temperature,
            maxOutputTokens: config.maxTokens,
          },
        }),
      },
    );
    return response;
  }

  static async callProvider(
    providerName: SupportedProviders,
    config: LLMProvider,
    messages: ChatMessage[],
  ): Promise<Response> {
    switch (providerName) {
      case 'lmstudio':
        return await this.callLMStudio(config, messages);
      case 'openai':
        return await this.callOpenAI(config, messages);
      case 'anthropic':
        return await this.callAnthropic(config, messages);
      case 'gemini':
        return await this.callGemini(config, messages);
      default:
        throw new Error(`Unsupported provider: ${providerName}`);
    }
  }

  static async streamResponse(response: Response, res: any, provider: SupportedProviders): Promise<void> {
    const reader = (response as any).body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let tokenCount = 0;

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          let token = '';

          if (provider === 'anthropic') {
            // Handle Claude's streaming format
            if (event.startsWith('data: ')) {
              const data = event.slice(6);
              if (data === '[DONE]') {
                console.log(`✅ Response complete (${tokenCount} tokens)`);
                res.write('data: [DONE]\n\n');
                res.end();
                return;
              }
              try {
                const parsed: AnthropicResponse = JSON.parse(data);
                if (parsed.type === 'content_block_delta') {
                  token = parsed.delta?.text || '';
                }
              } catch {
                // Ignore parsing errors
              }
            }
          } else if (provider === 'gemini') {
            // Handle Gemini's streaming format
            if (event.startsWith('data: ')) {
              const data = event.slice(6);
              try {
                const parsed: GeminiResponse = JSON.parse(data);
                token = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
              } catch {
                // Ignore parsing errors
              }
            }
          } else {
            // Handle OpenAI/LMStudio format
            if (event.startsWith('data: ')) {
              const data = event.slice(6);
              if (data === '[DONE]') {
                console.log(`✅ Response complete (${tokenCount} tokens)`);
                res.write('data: [DONE]\n\n');
                res.end();
                return;
              }
              try {
                const parsed: OpenAIResponse = JSON.parse(data);
                token = parsed.choices?.[0]?.delta?.content || '';
              } catch {
                // Ignore parsing errors
              }
            }
          }

          if (token) {
            tokenCount++;
            res.write(`data: ${JSON.stringify({ token })}\n\n`);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    console.log(`✅ Response complete (${tokenCount} tokens)`);
    res.end();
  }
} 