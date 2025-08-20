import type { 
  BookmarkletConfig, 
  Theme, 
  ThemeName, 
  Position, 
  PositionName, 
  ServerUrl
} from '@/types';
import { 
  createBrandedType,
  createStorageHelpers,
  ConfigurationError
} from '@/types';

// Type-safe configuration storage
const storage = createStorageHelpers<Record<string, unknown>>('llm');

// Theme configurations with readonly properties
export const themes = {
  dark: {
    bg: '#1e1e1e',
    headerBg: '#333',
    text: '#fff',
    border: '#444',
    inputBg: '#111',
    buttonBg: '#444',
  },
  light: {
    bg: '#ffffff',
    headerBg: '#f0f0f0',
    text: '#333',
    border: '#ddd',
    inputBg: '#fff',
    buttonBg: '#e0e0e0',
  },
  blue: {
    bg: '#0f1419',
    headerBg: '#1e3a8a',
    text: '#e2e8f0',
    border: '#3b82f6',
    inputBg: '#1e293b',
    buttonBg: '#3b82f6',
  },
} as const satisfies Record<ThemeName, Theme>;

// Position configurations
export const positions = {
  'bottom-right': { bottom: '20px', right: '20px' },
  'bottom-left': { bottom: '20px', left: '20px' },
  'top-right': { top: '20px', right: '20px' },
  'top-left': { top: '20px', left: '20px' },
} as const satisfies Record<PositionName, Position>;

// Default configuration
const defaultConfig: BookmarkletConfig = {
  fontSize: '14px',
  theme: 'dark' as ThemeName,
  serverUrl: 'http://localhost:4000' as ServerUrl,
  autoStart: true,
  position: 'bottom-right' as PositionName,
  initialQuestion: 'Give me answers to the multiple choice questions above. Do not include any other text.',
  bookmarklet: {
    autoGenerate: true,
    defaultQuestion: 'Give me answers to the multiple choice questions above. Do not include any other text.',
    themes: ['dark', 'light', 'blue'],
    defaultTheme: 'dark',
  },
} as const;

// Configuration validation
export const validateConfig = (config: Partial<BookmarkletConfig>): BookmarkletConfig => {
  const validated: BookmarkletConfig = { ...defaultConfig };

  // Validate and set theme
  if (config.theme && Object.keys(themes).includes(config.theme)) {
    validated.theme = config.theme;
  }

  // Validate and set position
  if (config.position && Object.keys(positions).includes(config.position)) {
    validated.position = config.position;
  }

  // Validate and set server URL
  if (config.serverUrl) {
    try {
      new URL(config.serverUrl);
      validated.serverUrl = config.serverUrl;
    } catch {
      throw new ConfigurationError(`Invalid server URL: ${config.serverUrl}`);
    }
  }

  // Validate and set font size
  if (config.fontSize && /^\d+px$/.test(config.fontSize)) {
    validated.fontSize = config.fontSize;
  }

  // Set autoStart
  if (typeof config.autoStart === 'boolean') {
    validated.autoStart = config.autoStart;
  }

  // Set initialQuestion
  if (config.initialQuestion && typeof config.initialQuestion === 'string') {
    validated.initialQuestion = config.initialQuestion;
  }

  // Set bookmarklet config
  if (config.bookmarklet) {
    if (typeof config.bookmarklet.autoGenerate === 'boolean') {
      validated.bookmarklet.autoGenerate = config.bookmarklet.autoGenerate;
    }
    if (typeof config.bookmarklet.defaultQuestion === 'string') {
      validated.bookmarklet.defaultQuestion = config.bookmarklet.defaultQuestion;
    }
    if (Array.isArray(config.bookmarklet.themes)) {
      validated.bookmarklet.themes = config.bookmarklet.themes.filter(theme => 
        Object.keys(themes).includes(theme)
      );
    }
    if (config.bookmarklet.defaultTheme && Object.keys(themes).includes(config.bookmarklet.defaultTheme)) {
      validated.bookmarklet.defaultTheme = config.bookmarklet.defaultTheme;
    }
  }

  return validated;
};

// Load configuration from localStorage with validation
export const loadConfig = (): BookmarkletConfig => {
  try {
    const storedConfig = {
      fontSize: storage.get('fontSize'),
      theme: storage.get('theme'),
      serverUrl: storage.get('serverUrl'),
      autoStart: storage.get('autoStart'),
      position: storage.get('position'),
      initialQuestion: storage.get('initialQuestion'),
    };

    // Filter out null values and validate
    const validConfig = Object.fromEntries(
      Object.entries(storedConfig).filter(([, value]) => value !== null)
    );

    return validateConfig(validConfig);
  } catch (error) {
    console.warn('Failed to load configuration, using defaults:', error);
    return { ...defaultConfig };
  }
};

// Save configuration to localStorage
export const saveConfig = (config: Partial<BookmarkletConfig>): void => {
  try {
    const validatedConfig = validateConfig(config);
    
    Object.entries(validatedConfig).forEach(([key, value]) => {
      storage.set(key as keyof BookmarkletConfig, value);
    });
  } catch (error) {
    console.error('Failed to save configuration:', error);
    throw new ConfigurationError(`Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get current theme
export const getCurrentTheme = (config: BookmarkletConfig): Theme => {
  return themes[config.theme];
};

// Get current position
export const getCurrentPosition = (config: BookmarkletConfig): Position => {
  return positions[config.position];
};

// Configuration change event
export const createConfigChangeEvent = (config: BookmarkletConfig): CustomEvent<{ config: BookmarkletConfig }> => {
  return new CustomEvent('llm-config-change', {
    detail: { config },
    bubbles: true,
  });
};

// Export configuration utilities
export const configUtils = {
  themes,
  positions,
  defaultConfig,
  validateConfig,
  loadConfig,
  saveConfig,
  getCurrentTheme,
  getCurrentPosition,
  createConfigChangeEvent,
} as const; 