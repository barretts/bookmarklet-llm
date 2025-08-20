# Bookmarklet-LLM Development Guide

This document provides guidance for developing and extending the bookmarklet-LLM project.

## Development Workflow

The bookmarklet-LLM project consists of two main components:
1. A Node.js server that handles API requests and serves the bookmarklet
2. The bookmarklet itself, which is injected into web pages

We've set up an integrated development environment that supports hot-reloading for both components.

### Quick Start

For the best development experience, use:

```bash
npm run dev:all
```

This command:
- Starts the server with hot-reloading using `tsx watch`
- Watches for changes to the bookmarklet source and rebuilds automatically
- Integrates the two processes with unified logging
- Sets `NODE_ENV=development` to enable instant bookmarklet updates

When you make changes to either the server code or the bookmarklet code, the appropriate component will automatically rebuild and reload.

### How Hot-Reloading Works

1. Server-side hot-reloading:
   - `tsx watch` monitors server TypeScript files and restarts the server when changes are detected

2. Bookmarklet hot-reloading:
   - The bookmarklet source is rebuilt whenever changes are detected
   - The server's `/bookmarklet.min.js` endpoint always serves the latest version
   - The config UI page polls for new versions every 5 seconds

### Accessing the Development Environment

- Server runs at: http://localhost:4000
- Configuration UI: http://localhost:4000/config-ui
- Latest bookmarklet: http://localhost:4000/bookmarklet.min.js

### Alternative Development Commands

If you prefer to run the server and bookmarklet builder separately:

```bash
# Start the server with hot-reloading
npm run dev

# In another terminal, watch and rebuild the bookmarklet on changes
npm run build:watch
```

## Building for Production

When you're ready to build for production:

```bash
npm run build
```

This creates:
- Compiled server code in `dist/server/`
- Compiled bookmarklet in `dist/bookmarklet.min.js`

## Troubleshooting

If hot-reloading isn't working as expected:

1. Check that you're accessing the bookmarklet via the config UI at http://localhost:4000/config-ui
2. Make sure your browser isn't caching the bookmarklet (the config UI adds cache-busting parameters)
3. Try restarting the development server with `npm run dev:all`
4. Look for any error messages in the console output