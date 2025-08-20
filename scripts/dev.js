#!/usr/bin/env node

/**
 * Development script for bookmarklet-llm
 * 
 * This script combines server startup and bookmarklet building with hot-reload
 * so you can develop the bookmarklet and have it automatically update
 * in the browser whenever you make changes.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk'; // We might need to install this dependency

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Set environment variables
process.env.NODE_ENV = 'development';

console.log(chalk?.blue('🚀 Starting development environment for bookmarklet-llm') || '🚀 Starting development environment for bookmarklet-llm');
console.log('📝 Hot-reloading enabled for both server and bookmarklet');
console.log('🌐 Server will be available at http://localhost:4000');
console.log('🔧 Configuration UI at http://localhost:4000/config-ui');
console.log('');

// Start the server with hot-reloading
const server = spawn('npm', ['run', 'dev'], {
  cwd: projectRoot,
  env: { ...process.env, NODE_ENV: 'development' },
  stdio: 'pipe',
  shell: true
});

// Forward server output to console
server.stdout.on('data', (data) => {
  process.stdout.write(`${chalk?.green('[SERVER]') || '[SERVER]'} ${data}`);
});

server.stderr.on('data', (data) => {
  process.stderr.write(`${chalk?.red('[SERVER ERROR]') || '[SERVER ERROR]'} ${data}`);
});

// Start watching for bookmarklet changes
const builder = spawn('npm', ['run', 'build:watch'], {
  cwd: projectRoot,
  env: process.env,
  stdio: 'pipe',
  shell: true
});

// Forward builder output to console
builder.stdout.on('data', (data) => {
  process.stdout.write(`${chalk?.blue('[BOOKMARKLET]') || '[BOOKMARKLET]'} ${data}`);
});

builder.stderr.on('data', (data) => {
  process.stderr.write(`${chalk?.red('[BOOKMARKLET ERROR]') || '[BOOKMARKLET ERROR]'} ${data}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development environment...');
  server.kill('SIGINT');
  builder.kill('SIGINT');
  process.exit(0);
});

// Log when either process exits
server.on('close', (code) => {
  console.log(`${chalk?.green('[SERVER]') || '[SERVER]'} Process exited with code ${code}`);
  builder.kill('SIGINT');
  process.exit(code);
});

builder.on('close', (code) => {
  console.log(`${chalk?.blue('[BOOKMARKLET]') || '[BOOKMARKLET]'} Process exited with code ${code}`);
  if (code !== 0 && server.exitCode === null) {
    console.log(`${chalk?.red('[BUILDER ERROR]') || '[BUILDER ERROR]'} Builder process crashed, but server is still running.`);
  }
});