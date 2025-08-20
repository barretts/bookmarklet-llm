import type { BookmarkletConfig, Theme, Position, MessageRole } from '@/types';
import { themes, positions } from './config';

// UI element types for better type safety
export interface UIElements {
  readonly box: HTMLDivElement;
  readonly headerBar: HTMLDivElement;
  readonly output: HTMLDivElement;
  readonly input: HTMLTextAreaElement;
  readonly sendBtn: HTMLButtonElement;
  readonly clearBtn: HTMLButtonElement;
  readonly copyBtn: HTMLButtonElement;
  readonly summarizeBtn: HTMLButtonElement;
  readonly copyContentBtn: HTMLButtonElement;
  readonly settingsBtn: HTMLButtonElement;
  readonly minimizeBtn: HTMLButtonElement;
  readonly closeBtn: HTMLButtonElement;
  readonly themeSelect: HTMLSelectElement;
  readonly serverInput: HTMLInputElement;
  readonly autoStartCheckbox: HTMLInputElement;
  readonly initialQuestionInput: HTMLInputElement;
  readonly configUiBtn: HTMLButtonElement;
  readonly saveBtn: HTMLButtonElement;
  readonly providerSpan: HTMLSpanElement;
}

// UI state management
export interface UIState {
  readonly isMinimized: boolean;
  readonly isSettingsOpen: boolean;
  readonly isDragging: boolean;
  readonly lastPageContent: string;
}

// Create main container with proper typing
export const createMainContainer = (config: BookmarkletConfig, theme: Theme): HTMLDivElement => {
  const box = document.createElement('div');
  box.id = 'llm-chatbox';
  
  const position = positions[config.position];
  
  Object.assign(box.style, {
    position: 'fixed',
    ...position,
    width: '420px',
    maxHeight: '70vh',
    zIndex: '999999',
    background: theme.bg,
    color: theme.text,
    font: `${config.fontSize}/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
    border: `1px solid ${theme.border}`,
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,.3)',
    display: 'flex',
    flexDirection: 'column',
    backdropFilter: 'blur(10px)',
  });
  
  return box;
};

// Create header bar with provider display
export const createHeaderBar = (config: BookmarkletConfig, theme: Theme): {
  headerBar: HTMLDivElement;
  providerSpan: HTMLSpanElement;
  settingsBtn: HTMLButtonElement;
  minimizeBtn: HTMLButtonElement;
  closeBtn: HTMLButtonElement;
} => {
  const headerBar = document.createElement('div');
  headerBar.id = 'llm-bar';
  
  Object.assign(headerBar.style, {
    padding: '8px 12px',
    cursor: 'move',
    background: theme.headerBg,
    borderRadius: '12px 12px 0 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  });
  
  // Left side with title and provider
  const headerLeft = document.createElement('div');
  Object.assign(headerLeft.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  });
  
  const title = document.createElement('strong');
  title.textContent = '🤖 LLM Chat';
  headerLeft.appendChild(title);
  
  const providerSpan = document.createElement('span');
  providerSpan.id = 'llm-provider';
  Object.assign(providerSpan.style, {
    fontSize: '11px',
    padding: '2px 6px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '8px',
    opacity: '0.8',
  });
  headerLeft.appendChild(providerSpan);
  
  // Right side with buttons
  const headerRight = document.createElement('div');
  
  const settingsBtn = document.createElement('button');
  settingsBtn.id = 'llm-settings';
  settingsBtn.textContent = '⚙️';
  settingsBtn.title = 'Settings';
  Object.assign(settingsBtn.style, {
    background: 'none',
    border: 'none',
    color: theme.text,
    font: config.fontSize,
    marginRight: '8px',
    cursor: 'pointer',
  });
  
  const minimizeBtn = document.createElement('button');
  minimizeBtn.id = 'llm-minimize';
  minimizeBtn.textContent = '−';
  minimizeBtn.title = 'Minimize';
  Object.assign(minimizeBtn.style, {
    background: 'none',
    border: 'none',
    color: theme.text,
    font: config.fontSize,
    marginRight: '8px',
    cursor: 'pointer',
  });
  
  const closeBtn = document.createElement('button');
  closeBtn.id = 'llm-x';
  closeBtn.textContent = '✕';
  closeBtn.title = 'Close';
  Object.assign(closeBtn.style, {
    background: 'none',
    border: 'none',
    color: theme.text,
    font: config.fontSize,
    cursor: 'pointer',
  });
  
  headerRight.appendChild(settingsBtn);
  headerRight.appendChild(minimizeBtn);
  headerRight.appendChild(closeBtn);
  
  headerBar.appendChild(headerLeft);
  headerBar.appendChild(headerRight);
  
  return {
    headerBar,
    providerSpan,
    settingsBtn,
    minimizeBtn,
    closeBtn,
  };
};

// Create settings panel
export const createSettingsPanel = (config: BookmarkletConfig, theme: Theme): {
  settingsPanel: HTMLDivElement;
  themeSelect: HTMLSelectElement;
  serverInput: HTMLInputElement;
  autoStartCheckbox: HTMLInputElement;
  initialQuestionInput: HTMLInputElement;
  configUiBtn: HTMLButtonElement;
  saveBtn: HTMLButtonElement;
} => {
  const settingsPanel = document.createElement('div');
  settingsPanel.id = 'llm-settings-panel';
  Object.assign(settingsPanel.style, {
    display: 'none',
    padding: '12px',
    background: theme.bg,
    borderBottom: `1px solid ${theme.border}`,
  });
  
  // Theme selector
  const themeDiv = document.createElement('div');
  Object.assign(themeDiv.style, { marginBottom: '8px' });
  
  const themeLabel = document.createElement('label');
  themeLabel.textContent = 'Theme:';
  Object.assign(themeLabel.style, { display: 'block', marginBottom: '4px' });
  
  const themeSelect = document.createElement('select');
  themeSelect.id = 'llm-theme-select';
  Object.assign(themeSelect.style, {
    width: '100%',
    padding: '4px',
    borderRadius: '4px',
    border: `1px solid ${theme.border}`,
    background: theme.inputBg,
    color: theme.text,
    font: config.fontSize,
  });
  
  // Add theme options
  Object.entries(themes).forEach(([key, themeConfig]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = key.charAt(0).toUpperCase() + key.slice(1);
    themeSelect.appendChild(option);
  });
  
  themeSelect.value = config.theme;
  
  themeDiv.appendChild(themeLabel);
  themeDiv.appendChild(themeSelect);
  settingsPanel.appendChild(themeDiv);
  
  // Server URL input
  const serverDiv = document.createElement('div');
  Object.assign(serverDiv.style, { marginBottom: '8px' });
  
  const serverLabel = document.createElement('label');
  serverLabel.textContent = 'Server URL:';
  Object.assign(serverLabel.style, { display: 'block', marginBottom: '4px' });
  
  const serverInput = document.createElement('input');
  serverInput.id = 'llm-server-url';
  serverInput.type = 'text';
  serverInput.value = config.serverUrl;
  Object.assign(serverInput.style, {
    width: '100%',
    padding: '4px',
    borderRadius: '4px',
    border: `1px solid ${theme.border}`,
    background: theme.inputBg,
    color: theme.text,
    font: config.fontSize,
  });
  
  serverDiv.appendChild(serverLabel);
  serverDiv.appendChild(serverInput);
  settingsPanel.appendChild(serverDiv);
  
  // Initial question input
  const initialQuestionDiv = document.createElement('div');
  Object.assign(initialQuestionDiv.style, { marginBottom: '8px' });
  
  const initialQuestionLabel = document.createElement('label');
  initialQuestionLabel.textContent = 'Initial Question:';
  Object.assign(initialQuestionLabel.style, { display: 'block', marginBottom: '4px' });
  
  const initialQuestionInput = document.createElement('input');
  initialQuestionInput.id = 'llm-initial-question';
  initialQuestionInput.type = 'text';
  initialQuestionInput.value = config.initialQuestion;
  Object.assign(initialQuestionInput.style, {
    width: '100%',
    padding: '4px',
    borderRadius: '4px',
    border: `1px solid ${theme.border}`,
    background: theme.inputBg,
    color: theme.text,
    font: config.fontSize,
  });
  
  initialQuestionDiv.appendChild(initialQuestionLabel);
  initialQuestionDiv.appendChild(initialQuestionInput);
  settingsPanel.appendChild(initialQuestionDiv);
  
  // Auto-start checkbox
  const autoStartDiv = document.createElement('div');
  Object.assign(autoStartDiv.style, { marginBottom: '8px' });
  
  const autoStartCheckbox = document.createElement('input');
  autoStartCheckbox.id = 'llm-auto-start';
  autoStartCheckbox.type = 'checkbox';
  autoStartCheckbox.checked = config.autoStart;
  
  const autoStartLabel = document.createElement('label');
  autoStartLabel.textContent = 'Auto-start on page load';
  autoStartLabel.htmlFor = 'llm-auto-start';
  Object.assign(autoStartLabel.style, { marginLeft: '4px' });
  
  autoStartDiv.appendChild(autoStartCheckbox);
  autoStartDiv.appendChild(autoStartLabel);
  settingsPanel.appendChild(autoStartDiv);
  
  // Config UI button
  const configUiBtn = document.createElement('button');
  configUiBtn.id = 'llm-config-ui';
  configUiBtn.textContent = 'Open Config UI';
  Object.assign(configUiBtn.style, {
    width: '100%',
    padding: '6px',
    marginBottom: '8px',
    borderRadius: '4px',
    border: 'none',
    background: theme.buttonBg,
    color: theme.text,
    font: config.fontSize,
    cursor: 'pointer',
  });
  
  settingsPanel.appendChild(configUiBtn);
  
  // Save button
  const saveBtn = document.createElement('button');
  saveBtn.id = 'llm-save-settings';
  saveBtn.textContent = 'Save Settings';
  Object.assign(saveBtn.style, {
    width: '100%',
    padding: '6px',
    borderRadius: '4px',
    border: 'none',
    background: theme.buttonBg,
    color: theme.text,
    font: config.fontSize,
    cursor: 'pointer',
  });
  
  settingsPanel.appendChild(saveBtn);
  
  return {
    settingsPanel,
    themeSelect,
    serverInput,
    autoStartCheckbox,
    initialQuestionInput,
    configUiBtn,
    saveBtn,
  };
};

// Create output area
export const createOutputArea = (theme: Theme): HTMLDivElement => {
  const output = document.createElement('div');
  output.id = 'llm-out';
  Object.assign(output.style, {
    flex: '1',
    overflow: 'auto',
    padding: '12px',
    background: theme.bg,
    maxHeight: '400px',
  });
  return output;
};

// Create input area with buttons
export const createInputArea = (theme: Theme, fontSize: string): {
  inputArea: HTMLDivElement;
  input: HTMLTextAreaElement;
  sendBtn: HTMLButtonElement;
  clearBtn: HTMLButtonElement;
  copyBtn: HTMLButtonElement;
  summarizeBtn: HTMLButtonElement;
  copyContentBtn: HTMLButtonElement;
} => {
  const inputArea = document.createElement('div');
  Object.assign(inputArea.style, {
    padding: '12px',
    background: theme.bg,
    borderTop: `1px solid ${theme.border}`,
  });
  
  // Input textarea
  const input = document.createElement('textarea');
  input.id = 'llm-input';
  input.placeholder = 'Ask about this page...';
  Object.assign(input.style, {
    width: '100%',
    minHeight: '60px',
    padding: '8px',
    marginBottom: '8px',
    borderRadius: '4px',
    border: `1px solid ${theme.border}`,
    background: theme.inputBg,
    color: theme.text,
    font: fontSize,
    resize: 'vertical',
  });
  
  // Button row
  const buttonRow = document.createElement('div');
  Object.assign(buttonRow.style, {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  });
  
  // Send button
  const sendBtn = document.createElement('button');
  sendBtn.id = 'llm-send';
  sendBtn.textContent = 'Send';
  Object.assign(sendBtn.style, {
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    background: theme.buttonBg,
    color: theme.text,
    font: fontSize,
    cursor: 'pointer',
    flex: '1',
  });
  
  // Clear button
  const clearBtn = document.createElement('button');
  clearBtn.id = 'llm-clear';
  clearBtn.textContent = 'Clear';
  Object.assign(clearBtn.style, {
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    background: theme.buttonBg,
    color: theme.text,
    font: fontSize,
    cursor: 'pointer',
  });
  
  // Copy button
  const copyBtn = document.createElement('button');
  copyBtn.id = 'llm-copy';
  copyBtn.textContent = 'Copy';
  Object.assign(copyBtn.style, {
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    background: theme.buttonBg,
    color: theme.text,
    font: fontSize,
    cursor: 'pointer',
  });
  
  // Summarize button
  const summarizeBtn = document.createElement('button');
  summarizeBtn.id = 'llm-summarize';
  summarizeBtn.textContent = 'Summarize';
  Object.assign(summarizeBtn.style, {
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    background: theme.buttonBg,
    color: theme.text,
    font: fontSize,
    cursor: 'pointer',
  });
  
  // Copy content button
  const copyContentBtn = document.createElement('button');
  copyContentBtn.id = 'llm-copy-content';
  copyContentBtn.textContent = 'Copy Content';
  Object.assign(copyContentBtn.style, {
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    background: theme.buttonBg,
    color: theme.text,
    font: fontSize,
    cursor: 'pointer',
  });
  
  buttonRow.appendChild(sendBtn);
  buttonRow.appendChild(clearBtn);
  buttonRow.appendChild(copyBtn);
  buttonRow.appendChild(summarizeBtn);
  buttonRow.appendChild(copyContentBtn);
  
  inputArea.appendChild(input);
  inputArea.appendChild(buttonRow);
  
  return {
    inputArea,
    input,
    sendBtn,
    clearBtn,
    copyBtn,
    summarizeBtn,
    copyContentBtn,
  };
};

// Create complete UI
export const createUI = (config: BookmarkletConfig, theme: Theme): UIElements => {
  // Create main container
  const box = createMainContainer(config, theme);
  
  // Create header
  const { headerBar, providerSpan, settingsBtn, minimizeBtn, closeBtn } = createHeaderBar(config, theme);
  box.appendChild(headerBar);
  
  // Create settings panel
  const { settingsPanel, themeSelect, serverInput, autoStartCheckbox, initialQuestionInput, configUiBtn, saveBtn } = createSettingsPanel(config, theme);
  box.appendChild(settingsPanel);
  
  // Create output area
  const output = createOutputArea(theme);
  box.appendChild(output);
  
  // Create input area
  const { inputArea, input, sendBtn, clearBtn, copyBtn, summarizeBtn, copyContentBtn } = createInputArea(theme, config.fontSize);
  box.appendChild(inputArea);
  
  return {
    box,
    headerBar,
    output,
    input,
    sendBtn,
    clearBtn,
    copyBtn,
    summarizeBtn,
    copyContentBtn,
    settingsBtn,
    minimizeBtn,
    closeBtn,
    themeSelect,
    serverInput,
    autoStartCheckbox,
    initialQuestionInput,
    configUiBtn,
    saveBtn,
    providerSpan,
  };
};

// Update provider display
export const updateProviderDisplay = (providerInfo: { active: string }, providerSpan: HTMLSpanElement): void => {
  providerSpan.textContent = providerInfo.active;
};

// Safe innerHTML setting
export const safeSetInnerHTML = (element: HTMLElement, html: string): void => {
  try {
    element.innerHTML = html;
  } catch (error) {
    console.warn('Failed to set innerHTML:', error);
    element.textContent = html;
  }
};

// Display text with proper formatting
export const displayText = (text: string, output: HTMLDivElement): void => {
  const formattedText = text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>');
  
  safeSetInnerHTML(output, formattedText);
}; 