import type { BookmarkletConfig } from '@/types';
import { loadConfig, getCurrentTheme } from './modules/config';
import { createUI } from './modules/ui';
import { createEventHandlers } from './modules/eventHandlers';
import { apiUtils } from './modules/apiClient';

// Build information (will be replaced during build)
const BUILD_INFO = {
  version: '2.0.0',
  buildNumber: '40',
  buildDate: '2025-07-17'
};

// TEST_HOT_RELOAD_NOW_1234567890_ABCDEF

// Main bookmarklet function with proper error handling
// HOT_RELOAD_TEST_STRING_123456789
(function() {
  try {
    // Check if the bookmarklet is already loaded
    if (document.getElementById('llm-chatbox')) {
      console.warn('LLM Bookmarklet already loaded');
      return;
    }

    // Ensure apiUtils is available (prevents tree-shaking)
    if (typeof apiUtils !== 'object') {
      throw new Error('apiUtils not available');
    }
    
    // Add window extensions
    interface ExtendedWindow extends Window {
      __BOOKMARKLET_SETTINGS?: any;
      showBookmarkletSettings?: (settings: any) => void;
    }
    
    // Check for embedded settings from customized bookmarklet
    const extWindow = window as ExtendedWindow;
    const embeddedSettings = extWindow.__BOOKMARKLET_SETTINGS;
    
    // Load configuration with validation (use embedded settings if available)
    let config;
    
    if (embeddedSettings) {
      console.log('Using embedded settings:', embeddedSettings);
      // Start with default config but override with embedded settings
      const baseConfig = loadConfig();
      config = { ...baseConfig, ...embeddedSettings };
      
      // Report settings to test page if available
      if (typeof window.showBookmarkletSettings === 'function') {
        window.showBookmarkletSettings(embeddedSettings);
      } else {
        // Try to send a message to the parent window in case it's listening
        try {
          window.postMessage({
            type: 'bookmarkletSettings',
            settings: embeddedSettings
          }, '*');
        } catch (e) {
          console.log('Could not post settings message:', e);
        }
      }
    } else {
      config = loadConfig();
    }
    console.log('LLM Bookmarklet loaded with config:', config, embeddedSettings ? '(using embedded settings)' : '');

    // Get current theme
    const currentTheme = getCurrentTheme(config);

    // Create UI elements
    const uiElements = createUI(config, currentTheme);

    // Add build info to the header
    const buildInfoSpan = document.createElement('span');
    buildInfoSpan.id = 'llm-build-info';
    buildInfoSpan.textContent = `v${BUILD_INFO.version}.#${BUILD_INFO.buildNumber}`;
    Object.assign(buildInfoSpan.style, {
      fontSize: '10px',
      padding: '2px 6px',
      background: 'rgba(255,255,255,0.1)',
      borderRadius: '8px',
      opacity: '0.7',
      marginLeft: '8px',
    });
    
    // Add build info to the header (after the provider span)
    const headerLeft = uiElements.headerBar.querySelector('div');
    if (headerLeft) {
      headerLeft.appendChild(buildInfoSpan);
    }

    // Add the bookmarklet UI to the body
    document.body.appendChild(uiElements.box);

    // Create event handlers
    const eventHandlers = createEventHandlers(
      uiElements,
      config,
      (newConfig: BookmarkletConfig) => {
        // Handle configuration changes
        console.log('Configuration updated:', newConfig);
        
        // Update localStorage
        try {
          // This would typically update the config in localStorage
          // For now, we'll just log the change
          console.log('New configuration saved');
        } catch (error) {
          console.error('Failed to save configuration:', error);
        }
      }
    );

    // Initialize event handlers
    eventHandlers.initialize();

    console.log('LLM Bookmarklet initialized successfully');

  } catch (error) {
    console.error('Failed to initialize LLM Bookmarklet:', error);
    
    // Show user-friendly error message
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 12px;
      border-radius: 8px;
      z-index: 1000000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
    `;
    errorDiv.textContent = 'Failed to load LLM Bookmarklet. Please check the console for details.';
    
    document.body.appendChild(errorDiv);
    
    // Remove error message after 5 seconds
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
})(); 