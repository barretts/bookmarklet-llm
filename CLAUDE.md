# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development & Server

```bash
# Install dependencies and build the bookmarklet
npm run setup

# Start the server
npm start

# Start the server with auto-reloading (development)
npm run dev

# Start both server and bookmarklet builder with hot-reloading
npm run dev:all

# Check server health
npm run server:health

# Type checking
npm run type-check
```

### Building

```bash
# Build the bookmarklet
npm run build

# Build with file watching
npm run build:watch

# Clean build artifacts
npm run clean
```

### Linting and Formatting

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Configuration

```bash
# Interactive configuration menu
npm run config

# View active configuration status
npm run config:status

# Set active provider (e.g., openai, anthropic, gemini, lmstudio)
npm run config:set openai

# Test the active provider
npm run config:test

# Open web configuration UI (server must be running)
npm run config:ui
```

## Development Features

- Hot-reloading for both server and bookmarklet with `npm run dev:all`
- Auto-refreshing configuration UI that always loads the latest bookmarklet
- Dynamic bookmarklet building with the minify package
- Detailed development guide available in `DEVELOPMENT.md`

## Architecture Overview

The bookmarklet-LLM is structured as a client-server application with the following key components:

### 1. Bookmarklet Client (`src/bookmarklet/bookmarklet.ts`)

- Injects a floating chat interface into any web page
- Extracts page content intelligently
- Manages conversation history
- Supports theme switching and UI customization
- Communicates with the local server via fetch API
- Uses Server-Sent Events (SSE) for streaming responses

### 2. Server (`src/server/server.ts`)

- Express.js server handling API requests
- Proxies requests to various LLM providers
- Manages configuration through ConfigManager
- Streams responses from LLM providers to the client
- Provides configuration API and health monitoring endpoints
- Serves static files (configuration UI)

### 3. Configuration System (`src/config/config-manager.ts`)

- Manages LLM provider settings
- Stores API keys securely
- Provides configuration defaults
- Supports environment variables for API keys
- Handles persistence to config files

### 4. LLM Providers (`src/server/llm-providers.ts`)

- Adapters for multiple LLM services:
  - LM Studio (local models)
  - OpenAI (GPT-4, GPT-3.5)
  - Anthropic Claude (Claude 3 models)
  - Google Gemini (Gemini 1.5 models)
- Handles provider-specific API calls
- Manages streaming response formatting

### 5. Build System (`scripts/build.ts`)

- TypeScript compilation with SWC
- Bundles the bookmarklet code with ESBuild
- Minifies using Terser
- Creates production and debug versions
- Generates documentation
- Wraps code in the `javascript:` protocol for bookmarklet use

### 6. Configuration Tools

- CLI tool (`scripts/config-cli.ts`) for command-line configuration
- Web UI (`public/config-ui.html`) for browser-based configuration

## Development Workflow

1. Make changes to `src/bookmarklet/main.ts` or server components
2. Run `npm run build` to generate the updated bookmarklet
3. Start the server with `npm start` or `npm run dev`
4. Test the bookmarklet by clicking on it in your browser
5. Use `npm run config:test` to verify provider connections

## Important Notes

- The server runs on port 4000 by default (can be changed via PORT env var)
- API keys are stored in environment variables (OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY)
- The bookmarklet connects to the local server at http://localhost:4000 by default
- Configuration is persisted to `config/llm-config.json`
- For LM Studio, ensure the local server is running at http://localhost:1234
- The project uses TypeScript, with compiled JavaScript output in the dist directory
- The build process creates three main bookmarklet files:
  - `dist/bookmarklet.bundle.js` - Bundled but not minified
  - `dist/bookmarklet.min.js` - Minified production version
  - `dist/bookmarklet.debug.js` - Debug version with comments