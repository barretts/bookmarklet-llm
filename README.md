# 🤖 Multi-Provider LLM Bookmarklet

A modern, configurable bookmarklet that brings AI assistance to any webpage. Switch between multiple LLM providers (OpenAI, Anthropic, Google Gemini, LM Studio) with intelligent content extraction and conversation history.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-green)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Key Features

- 🔌 **Multi-Provider Support** - OpenAI, Anthropic Claude, Google Gemini, LM Studio
- ⚙️ **Smart Configuration** - Web UI, CLI, and API-based configuration
- 🎨 **Modern Architecture** - Clean folder structure, modular components
- 💬 **Conversation History** - Context-aware AI interactions
- 🌐 **Universal Content Extraction** - Works on any website
- 🎨 **Customizable Themes** - Dark, Light, and Blue themes
- 🔧 **Developer-Friendly** - Hot reloading, health monitoring, comprehensive logging

## 🚀 Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd bookmarklet-llm

# Install dependencies and build
npm run setup

# Configure your AI providers
npm run config

# Start the server
npm start
```

Then copy `dist/bookmarklet.min.js` to a browser bookmark and use it on any webpage!

## 📁 Project Structure

```
bookmarklet-llm/
├── src/
│   ├── server/              # Server-side components
│   │   ├── server.js        # Main Express server
│   │   └── llm-providers.js # AI provider adapters
│   ├── bookmarklet/         # Client-side bookmarklet
│   │   └── bookmarklet.js   # Main bookmarklet source
│   └── config/              # Configuration management
│       └── config-manager.js # ConfigManager class
├── public/                  # Static web assets
│   └── config-ui.html       # Web configuration interface
├── scripts/                 # Build and utility scripts
│   ├── build.js            # Build system
│   └── config-cli.js       # CLI configuration tool
├── config/                  # Configuration files (auto-generated)
│   └── llm-config.json     # Provider settings
├── dist/                    # Built artifacts
│   ├── bookmarklet.min.js  # Production bookmarklet
│   └── bookmarklet.debug.js # Debug version
└── docs/                    # Documentation
    └── README.md           # Detailed usage guide
```

## 🔧 Configuration

### Web Interface
```bash
npm start
# Open http://localhost:4000/config-ui
```

### Command Line
```bash
# Interactive configuration
npm run config

# Quick commands
npm run config:status
npm run config:set openai
npm run config:test
```

### API Endpoints
```bash
# Get current configuration
curl http://localhost:4000/config

# Switch provider
curl -X POST http://localhost:4000/config \
  -H "Content-Type: application/json" \
  -d '{"activeProvider": "openai"}'
```

## 🤖 Supported Providers

| Provider | Type | API Key Required | Models |
|----------|------|------------------|--------|
| **LM Studio** | Local | No | Any local model |
| **OpenAI** | Cloud | Yes | GPT-4, GPT-3.5 |
| **Anthropic** | Cloud | Yes | Claude 3 (Haiku, Sonnet, Opus) |
| **Google Gemini** | Cloud | Yes | Gemini 1.5 (Flash, Pro) |

### Setting Up API Keys

```bash
# Environment variables (recommended)
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GEMINI_API_KEY="..."

# Or configure via web UI or CLI
npm run config
```

## 📖 Usage Examples

### Basic Usage
1. **Build**: `npm run build`
2. **Install**: Copy `dist/bookmarklet.min.js` to a browser bookmark
3. **Use**: Click the bookmark on any webpage

### Advanced Usage
```javascript
// Custom provider for specific request
fetch('http://localhost:4000/chat-stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Page Title',
    url: 'https://example.com',
    text: 'Page content...',
    question: 'What is this about?',
    provider: 'anthropic' // Override default
  })
});
```

## 🛠 Development

### Available Scripts

```bash
# Development
npm run dev                 # Start with auto-reload
npm run build:watch         # Build with file watching

# Configuration
npm run config              # Interactive CLI menu
npm run config:status       # Show current status
npm run config:ui           # Open web interface

# Maintenance
npm run clean               # Remove build artifacts
npm run server:health       # Check server status
```

### Adding New Providers

1. **Update ConfigManager** (`src/config/config-manager.js`)
   ```javascript
   providers: {
     newProvider: {
       baseUrl: 'https://api.example.com',
       apiKey: process.env.NEW_PROVIDER_API_KEY || '',
       model: 'default-model',
       // ... other config
     }
   }
   ```

2. **Implement Provider Adapter** (`src/server/llm-providers.js`)
   ```javascript
   static async callNewProvider(config, messages) {
     // Implementation for new provider
   }
   ```

3. **Update Switch Statement**
   ```javascript
   case 'newProvider':
     return await this.callNewProvider(config, messages);
   ```

## 🔍 Architecture Highlights

### Modular Design
- **ConfigManager**: Centralized configuration management
- **LLMProviders**: Provider-specific adapters with unified interface
- **Server**: Clean Express.js server with middleware pattern
- **Build System**: Modern ES modules with path resolution

### Modern JavaScript
- ES6+ modules with proper imports/exports
- Path resolution using `fileURLToPath` and `__dirname`
- Async/await throughout
- Proper error handling and logging

### Configuration Management
- File-based persistence with automatic directory creation
- Environment variable integration
- Safe configuration exposure (API keys hidden)
- Multiple configuration interfaces (Web, CLI, API)

## 🚨 Troubleshooting

### Common Issues

**Server won't start**
```bash
# Check Node.js version
node --version  # Should be >= 16.0.0

# Check port availability
lsof -i :4000
```

**Build fails**
```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

**Provider errors**
```bash
# Test specific provider
npm run config:test

# Check configuration
npm run config:status
```

### Debug Mode

```bash
# Run server with debug logging
DEBUG=* npm start

# Use debug bookmarklet
# Copy dist/bookmarklet.debug.js instead of .min.js
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following the existing code style
4. Test with multiple providers: `npm run config:test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

- Use ES6+ features and modern JavaScript
- Follow the existing folder structure
- Add proper error handling
- Update documentation for new features
- Test with all providers when possible

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Configuration Guide**: [docs/README.md](docs/README.md)
- **API Documentation**: Available at `http://localhost:4000/` when server is running
- **Web Interface**: `http://localhost:4000/config-ui`

---

**Built with ❤️ for the AI-powered web**

🚀 Transform your web browsing with intelligent AI assistance on every page!
