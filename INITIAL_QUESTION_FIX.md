# Initial Question Configuration Fix Summary

This document explains the fixes made to resolve the disconnect between system prompt, initial question, and default question in the bookmarklet.

## Understanding the Flow

The bookmarklet works as follows:

1. **User clicks bookmarklet** on any webpage
2. **Bookmarklet loads configuration** from browser's localStorage
3. **Bookmarklet extracts page content** (title, URL, and text content)
4. **If autoStart is enabled**, it automatically:
   - Takes the `initialQuestion` from localStorage
   - Sends it to the chat input
   - Triggers the send message function
5. **The message is sent to the server** with:
   - Page title, URL, and content
   - The question (initial question or user's typed question)
   - Conversation history (if any)
6. **Server combines everything** into a single prompt:
   ```
   Current page: "Page Title" (https://example.com)
   
   [Page content here]
   
   Question: [Initial question or user's question]
   ```
7. **This combined prompt is sent to the LLM provider**

## Configuration Settings Explained

### In the Bookmarklet Settings (config-ui.html)

- **Theme**: Visual theme for the bookmarklet UI
- **Server URL**: Where the local server is running (default: http://localhost:4000)
- **Initial Question**: The question that will be automatically sent when the bookmarklet is clicked (if autoStart is enabled)
- **Auto-start on page load**: Whether to automatically send the initial question when the bookmarklet is clicked

### In the Provider Settings (config-ui.html)

- **System Prompt**: Instructions for how the AI model should behave (e.g., "You are a helpful assistant")
- **Model**: Which specific AI model to use
- **Temperature**: Controls randomness of responses
- **Max Tokens**: Maximum length of response

## What Was Fixed

1. **Removed non-existent `/generate-bookmarklet` endpoint**
   - The config-ui was trying to POST to an endpoint that didn't exist
   - Changed to simply save settings to localStorage

2. **Fixed initial question loading**
   - The bookmarklet now properly loads `initialQuestion` from localStorage
   - The config-ui now properly saves and loads the initial question

3. **Clarified UI labels**
   - "Initial Question" now says "(sent automatically with page content)"
   - "System Prompt" now says "(instructions for the AI model)"
   - Button changed from "Generate Bookmarklet" to "Save Bookmarklet Settings"

4. **Fixed configuration flow**
   - Settings are saved to localStorage when changed
   - Bookmarklet reads from localStorage on each click
   - No need to "regenerate" the bookmarklet - settings take effect immediately

## How to Use

1. **Configure your settings** in the config-ui page:
   - Set your preferred initial question
   - Enable/disable auto-start
   - Choose your theme and server URL

2. **Save the settings** by clicking "Save Bookmarklet Settings"

3. **Copy the bookmarklet code** and create a bookmark with it

4. **Click the bookmarklet on any page**:
   - If auto-start is enabled, it will automatically send your initial question with the page content
   - If auto-start is disabled, you can type your own question

## Example Use Case

If you frequently need to analyze multiple choice questions on web pages:

1. Set initial question to: "Give me answers to the multiple choice questions above. Do not include any other text."
2. Enable auto-start
3. Click the bookmarklet on any page with multiple choice questions
4. The AI will automatically analyze the page and provide answers

The page content and your initial question are combined and sent to the AI provider in a single request, giving the AI full context to answer your question.