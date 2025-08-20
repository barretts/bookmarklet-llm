# Bookmarklet Settings Architecture

## How Bookmarklet Settings Work

The bookmarklet-llm project uses a unique approach to handling settings:

1. The bookmarklet code itself **never changes** - it's a small, minified JavaScript snippet that gets added as a bookmark in your browser
2. All user preferences are stored in your browser's **localStorage**
3. When you click the bookmarklet, it reads the settings from localStorage and applies them

This architecture has several advantages:
- You only need to install the bookmarklet once
- You can easily update your preferences without reinstalling the bookmarklet
- Settings are persisted between sessions

## Settings Flow

1. **Configuration UI**:
   - User visits http://localhost:4000/config-ui
   - User configures settings (theme, server URL, initial question, auto-start)
   - Settings are saved to localStorage with the prefix `llm-`

2. **Bookmarklet Execution**:
   - User clicks bookmarklet on any webpage
   - Bookmarklet code loads
   - Settings are read from localStorage
   - UI is created with the saved theme and position
   - Page content is extracted
   - If auto-start is enabled, the initial question is automatically sent with the page content

3. **Server Processing**:
   - Server receives the request with page content and question
   - Server combines them into a single contextual prompt:
   ```
   Current page: "Page Title" (https://example.com)
   
   [Page content here]
   
   Question: [Initial question or user's question]
   ```
   - This combined prompt is sent to the LLM provider

## Key Settings Explained

### Bookmarklet Settings (User Preferences)

These settings are stored in localStorage and read by the bookmarklet:

- **Theme**: Visual appearance of the bookmarklet UI (dark, light, blue)
- **Server URL**: Where the bookmarklet should send requests (typically http://localhost:4000)
- **Initial Question**: The question that gets automatically sent with the page content when auto-start is enabled
- **Auto-Start**: Whether to automatically send the initial question when the bookmarklet is clicked

### Provider Settings (Server Configuration)

These settings are stored on the server and affect how the LLM responds:

- **Model**: Which specific model to use (e.g., GPT-4, Claude 3 Opus)
- **Temperature**: Controls randomness in responses
- **Max Tokens**: Maximum response length
- **System Prompt**: Instructions for how the AI should behave (e.g., "You are a helpful assistant")

## Testing Your Settings

The config-ui now includes a "Test Your Settings" section that shows exactly what values are stored in localStorage. This helps verify that your settings are being saved correctly.

When you change any setting:
1. The value is immediately saved to localStorage
2. The settings display is automatically refreshed
3. You get a confirmation message showing what changed

## Important Notes

- **Settings are browser-specific**: If you use the bookmarklet in a different browser, you'll need to configure the settings again
- **Settings are domain-specific**: localStorage is tied to the domain (e.g., localhost:4000), so if the server URL changes, your settings won't transfer
- **Clearing browser data**: If you clear your browser's localStorage, your settings will be reset to defaults

## Troubleshooting

If your settings aren't being applied:

1. **Check the "Test Your Settings" section** to verify what's stored in localStorage
2. **Make sure you're using the same browser** where you configured the settings
3. **Verify the server URL matches** where you configured the settings
4. **Try saving the settings again** using the "Save Bookmarklet Settings" button
5. **Check browser console** for any JavaScript errors

## Technical Details

For developers, here's how settings are accessed in the code:

```javascript
// How the bookmarklet loads settings from localStorage
const config = loadConfig();

// Inside loadConfig()
const storedConfig = {
  fontSize: storage.get('fontSize'),
  theme: storage.get('theme'),
  serverUrl: storage.get('serverUrl'),
  autoStart: storage.get('autoStart'),
  position: storage.get('position'),
  initialQuestion: storage.get('initialQuestion'),
};

// How auto-start uses the initialQuestion
if (config.autoStart) {
  const initialQuestion = config.initialQuestion;
  uiElements.input.value = initialQuestion;
  await sendMessage(); // This sends the initial question with the page content
}
```

The settings flow ensures that your configuration is applied consistently each time you use the bookmarklet.