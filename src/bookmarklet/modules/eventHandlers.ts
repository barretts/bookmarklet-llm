import type { 
  BookmarkletConfig, 
  ChatHistoryItem, 
  SupportedProviders,
  ServerUrl
} from '@/types';
import { createApiClient, apiUtils } from './apiClient';
import { displayText, safeSetInnerHTML, type UIElements } from './ui';
import { loadConfig, saveConfig, getCurrentTheme, createConfigChangeEvent } from './config';

// Event handler state
interface EventHandlerState {
  isMinimized: boolean;
  isSettingsOpen: boolean;
  isDragging: boolean;
  lastPageContent: string;
  conversationHistory: ChatHistoryItem[];
  currentResponse: string;
  isStreaming: boolean;
}

// Create event handlers with proper typing
export const createEventHandlers = (
  uiElements: UIElements,
  config: BookmarkletConfig,
  onConfigChange: (newConfig: BookmarkletConfig) => void
) => {
  const state: EventHandlerState = {
    isMinimized: false,
    isSettingsOpen: false,
    isDragging: false,
    lastPageContent: '',
    conversationHistory: [],
    currentResponse: '',
    isStreaming: false,
  };

  const apiClient = createApiClient(config.serverUrl);

  // Drag functionality
  let dragStartX = 0;
  let dragStartY = 0;
  let originalLeft = 0;
  let originalTop = 0;

  const startDrag = (e: MouseEvent): void => {
    e.preventDefault();
    state.isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    
    const rect = uiElements.box.getBoundingClientRect();
    originalLeft = rect.left;
    originalTop = rect.top;
    
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  const handleDrag = (e: MouseEvent): void => {
    if (!state.isDragging) return;
    
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    
    const newLeft = originalLeft + deltaX;
    const newTop = originalTop + deltaY;
    
    uiElements.box.style.left = `${newLeft}px`;
    uiElements.box.style.top = `${newTop}px`;
    uiElements.box.style.right = 'auto';
    uiElements.box.style.bottom = 'auto';
  };

  const stopDrag = (): void => {
    state.isDragging = false;
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', stopDrag);
  };

  // Minimize functionality
  const toggleMinimize = (): void => {
    state.isMinimized = !state.isMinimized;
    
    if (state.isMinimized) {
      uiElements.output.style.display = 'none';
      uiElements.input.parentElement!.style.display = 'none';
      uiElements.box.style.height = 'auto';
    } else {
      uiElements.output.style.display = 'block';
      uiElements.input.parentElement!.style.display = 'block';
      uiElements.box.style.height = '';
    }
  };

  // Settings functionality
  const toggleSettings = (): void => {
    state.isSettingsOpen = !state.isSettingsOpen;
    const settingsPanel = document.getElementById('llm-settings-panel') as HTMLDivElement;
    
    if (settingsPanel) {
      settingsPanel.style.display = state.isSettingsOpen ? 'block' : 'none';
    }
  };

  // Close functionality
  const closeBookmarklet = (): void => {
    uiElements.box.remove();
  };

  // Send message functionality
  const sendMessage = async (): Promise<void> => {
    const question = uiElements.input.value.trim();
    if (!question || state.isStreaming) return;

    // Add user message to history
    const userMessage: ChatHistoryItem = {
      type: 'user',
      content: question,
      timestamp: Date.now(),
    };
    state.conversationHistory.push(userMessage);

    // Display user message
    displayText(`**You:** ${question}`, uiElements.output);
    uiElements.output.appendChild(document.createElement('br'));

    // Clear input
    uiElements.input.value = '';
    state.isStreaming = true;
    state.currentResponse = '';

    try {
      // Create chat request
      const request = apiUtils.createChatRequest(question, state.conversationHistory);

      // Send request with streaming
      await apiClient.sendChatRequest(
        request,
        (token: string) => {
          state.currentResponse += token;
          displayText(`**Assistant:** ${state.currentResponse}`, uiElements.output);
        },
        (error: string) => {
          displayText(`**Error:** ${error}`, uiElements.output);
          uiElements.output.appendChild(document.createElement('br'));
        },
        () => {
          // Add assistant message to history
          if (state.currentResponse) {
            const assistantMessage: ChatHistoryItem = {
              type: 'assistant',
              content: state.currentResponse,
              timestamp: Date.now(),
            };
            state.conversationHistory.push(assistantMessage);
          }
          
          state.isStreaming = false;
          state.currentResponse = '';
          uiElements.output.appendChild(document.createElement('br'));
        }
      );
    } catch (error) {
      displayText(`**Error:** ${apiUtils.formatError(error)}`, uiElements.output);
      uiElements.output.appendChild(document.createElement('br'));
      state.isStreaming = false;
    }
  };

  // Clear functionality
  const clearChat = (): void => {
    state.conversationHistory = [];
    state.currentResponse = '';
    uiElements.output.innerHTML = '';
  };

  // Copy functionality
  const copyChat = (): void => {
    const chatText = uiElements.output.textContent || '';
    if (chatText) {
      navigator.clipboard.writeText(chatText).catch(console.error);
    }
  };

  // Summarize functionality
  const summarizePage = async (): Promise<void> => {
    const question = 'Please provide a brief summary of this page.';
    uiElements.input.value = question;
    await sendMessage();
  };

  // Copy content functionality
  const copyPageContent = (): void => {
    const content = apiUtils.getPageContent();
    navigator.clipboard.writeText(content).catch(console.error);
  };

  // Settings save functionality
  const saveSettings = async (): Promise<void> => {
    try {
      const newConfig: Partial<BookmarkletConfig> = {
        theme: uiElements.themeSelect.value as any,
        serverUrl: uiElements.serverInput.value as ServerUrl,
        autoStart: uiElements.autoStartCheckbox.checked,
        initialQuestion: uiElements.initialQuestionInput.value,
      };

      const validatedConfig = { ...config, ...newConfig };
      saveConfig(validatedConfig);
      onConfigChange(validatedConfig);

      // Update UI theme
      const newTheme = getCurrentTheme(validatedConfig);
      updateUITheme(newTheme);

      toggleSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  // Update UI theme
  const updateUITheme = (theme: any): void => {
    Object.assign(uiElements.box.style, {
      background: theme.bg,
      color: theme.text,
      border: `1px solid ${theme.border}`,
    });

    Object.assign(uiElements.headerBar.style, {
      background: theme.headerBg,
    });

    Object.assign(uiElements.output.style, {
      background: theme.bg,
    });

    const inputArea = uiElements.input.parentElement;
    if (inputArea) {
      Object.assign(inputArea.style, {
        background: theme.bg,
        borderTop: `1px solid ${theme.border}`,
      });
    }

    Object.assign(uiElements.input.style, {
      background: theme.inputBg,
      color: theme.text,
      border: `1px solid ${theme.border}`,
    });
  };

  // Open config UI
  const openConfigUI = (): void => {
    const configUrl = `${config.serverUrl}/config-ui`;
    window.open(configUrl, '_blank');
  };

  // Keyboard shortcuts
  const handleKeyPress = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-start functionality
  const handleAutoStart = async (): Promise<void> => {
    if (!config.autoStart) return;

    try {
      const health = await apiClient.getServerHealth();
      if (health.status === 'ok') {
        // Use the initialQuestion from config (which comes from localStorage)
        const initialQuestion = config.initialQuestion || 'Give me answers to the multiple choice questions above. Do not include any other text.';
        uiElements.input.value = initialQuestion;
        await sendMessage();
      }
    } catch (error) {
      console.warn('Auto-start failed:', error);
    }
  };

  // Update provider display
  const updateProviderDisplay = async (): Promise<void> => {
    try {
      const providerInfo = await apiClient.getProviderInfo();
      uiElements.providerSpan.textContent = providerInfo.active;
    } catch (error) {
      console.warn('Failed to update provider display:', error);
    }
  };

  // Attach event listeners
  const attachEventListeners = (): void => {
    // Header events
    uiElements.headerBar.addEventListener('mousedown', startDrag);
    uiElements.settingsBtn.addEventListener('click', toggleSettings);
    uiElements.minimizeBtn.addEventListener('click', toggleMinimize);
    uiElements.closeBtn.addEventListener('click', closeBookmarklet);

    // Input events
    uiElements.input.addEventListener('keypress', handleKeyPress);
    uiElements.sendBtn.addEventListener('click', sendMessage);

    // Button events
    uiElements.clearBtn.addEventListener('click', clearChat);
    uiElements.copyBtn.addEventListener('click', copyChat);
    uiElements.summarizeBtn.addEventListener('click', summarizePage);
    uiElements.copyContentBtn.addEventListener('click', copyPageContent);

    // Settings events
    uiElements.saveBtn.addEventListener('click', saveSettings);
    uiElements.configUiBtn.addEventListener('click', openConfigUI);

    // Auto-start
    if (config.autoStart) {
      setTimeout(handleAutoStart, 1000);
    }

    // Update provider display
    updateProviderDisplay();
  };

  // Initialize
  const initialize = (): void => {
    attachEventListeners();
    
    // Set initial page content
    state.lastPageContent = apiUtils.getPageContent();
  };

  return {
    initialize,
    sendMessage,
    clearChat,
    copyChat,
    summarizePage,
    copyPageContent,
    toggleSettings,
    toggleMinimize,
    closeBookmarklet,
    updateProviderDisplay,
  };
};

// Export event handler utilities
export const eventHandlerUtils = {
  createEventHandlers,
} as const; 