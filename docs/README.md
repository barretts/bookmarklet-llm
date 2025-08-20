# 🤖 Multi-Provider LLM Bookmarklet v2.0.0

## Quick Installation

1. **Copy the bookmarklet code**: Open `dist/bookmarklet.min.js` and copy the entire contents
2. **Create a new bookmark**: In your browser, create a new bookmark
3. **Paste as URL**: Instead of a normal URL, paste the bookmarklet code
4. **Name it**: Give it a name like "LLM Chat"
5. **Start the server**: Run `npm start` to start the local server
6. **Use it**: Visit any webpage and click your bookmark!

## Configuration

### Quick Start
```bash
# Install and build everything
npm run setup

# Configure your providers
npm run config

# Start the server
npm start
```

### Web Configuration Interface
Open [http://localhost:4000/config-ui](http://localhost:4000/config-ui) when the server is running.

### CLI Configuration
```bash
# Interactive configuration menu
npm run config

# Quick commands
npm run config:status
npm run config:set openai
npm run config:test
```

## Supported Providers

### 🏠 LM Studio (Default)
- Local AI models
- No API key required
- Privacy-focused
- Configurable models

### 🤖 OpenAI
- GPT-4, GPT-3.5 models
- Requires API key: `OPENAI_API_KEY`
- Fast and reliable
- High-quality responses

### 🧠 Anthropic Claude
- Claude 3 models (Haiku, Sonnet, Opus)
- Requires API key: `ANTHROPIC_API_KEY`
- Excellent for analysis
- Safety-focused

### 🌟 Google Gemini
- Gemini 1.5 models (Flash, Pro)
- Requires API key: `GEMINI_API_KEY`
- Multimodal capabilities
- Fast processing

## Features

✨ **Smart Content Extraction** - Works on any website  
🎨 **Multiple Themes** - Dark, Light, and Blue themes  
⚙️ **Multi-Provider Support** - Switch between AI providers instantly  
💬 **Conversation History** - Maintains context across questions  
⌨️ **Keyboard Shortcuts** - Ctrl+Enter to send messages  
📋 **Quick Actions** - Copy, Clear, and Summarize buttons  
🔧 **Draggable Interface** - Move the chat window anywhere  
📱 **Responsive Design** - Works on different screen sizes  
🏥 **Health Monitoring** - Real-time provider status  
🛠️ **Configuration Management** - Web UI and CLI tools  

## Project Structure

```
bookmarklet-llm/
├── src/
│   ├── server/          # Server-side code
│   ├── bookmarklet/     # Bookmarklet source
│   └── config/          # Configuration management
├── public/              # Static web files
├── scripts/             # Build and utility scripts
├── config/              # Configuration files
├── dist/                # Built artifacts
└── docs/                # Documentation
```

## Troubleshooting

### Server Issues
- **Port 4000 in use**: Change PORT environment variable
- **Server won't start**: Check Node.js version (>=16.0.0 required)
- **Provider errors**: Verify API keys and network connectivity

### Bookmarklet Issues
- **Not appearing**: Check browser console for errors
- **Connection failed**: Ensure server is running
- **Wrong provider**: Check provider indicator in bookmarklet header
- **Content not extracted**: Try refreshing the page

### Configuration Issues
- **Settings not saving**: Check file permissions in config/ directory
- **Provider not working**: Test with `npm run config:test`
- **API key errors**: Verify key format and permissions

## Development

### Build Commands
```bash
npm run build              # Build bookmarklet
npm run build:watch        # Build with file watching
npm run dev                # Development server with auto-reload
npm run clean              # Clean build artifacts
```

### Adding New Providers
1. Add provider configuration to `src/config/config-manager.ts`
2. Implement provider adapter in `src/server/llm-providers.ts`
3. Update streaming handler for provider-specific format
4. Test with `npm run config:test`

## Security & Privacy

- **API Keys**: Store in environment variables, never commit to code
- **Local Storage**: Bookmarklet settings stored locally in browser
- **CORS**: Configured for development (adjust for production)
- **HTTPS**: Use HTTPS endpoints for production deployments

---

**Built on:** 2025-07-10  
**Version:** 2.0.0  
**Node Version:** v24.0.2  

🚀 **Ready to enhance your web browsing with AI?**

For more details, see the main [README.md](../README.md) file.
