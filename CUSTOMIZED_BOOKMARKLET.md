# Customized Bookmarklet Architecture

## The Problem We Solved

We identified a critical issue with the previous implementation:

**Browser security restrictions prevent a bookmarklet running on one domain from accessing localStorage of another domain.**

This means a bookmarklet running on `example.com` cannot access localStorage data from `localhost:4000` where the configuration is stored.

## The Solution: Embedded Settings

Instead of relying on localStorage, the new implementation embeds settings directly into the bookmarklet code:

1. **User configures settings** in the config-ui
2. **Server generates a unique bookmarklet** with those settings hardcoded
3. **User copies and installs the bookmarklet** in their browser
4. When clicked, the bookmarklet uses its embedded settings (no cross-domain issues)

## How It Works

### 1. Server-Side Generation

When a user clicks "Generate Customized Bookmarklet":

1. The UI collects settings from the form
2. It sends them to `/generate-bookmarklet` endpoint
3. Server calls `BookmarkletBuilder.generateCustomBookmarklet(settings)`
4. The builder:
   - Takes the regular bookmarklet code as a base
   - Wraps it in a function that injects custom settings
   - Minifies the resulting code
   - Returns it to the client

### 2. Client-Side Usage

When the user clicks the bookmarklet on any webpage:

1. It creates `window.__BOOKMARKLET_SETTINGS` with the embedded settings
2. The main bookmarklet code runs and checks for these settings
3. If found, it uses them instead of loading from localStorage
4. This ensures the bookmarklet works properly across domains

## Benefits of This Approach

1. **Works across domains**: No more cross-domain security issues
2. **Self-contained**: Each bookmarklet has everything it needs
3. **Customizable**: Each user can have their own configuration
4. **No persistence needed**: Settings are built into the code

## Important User Instructions

Users must be aware:

1. **Settings are fixed** once the bookmarklet is generated
2. To update settings, they must:
   - Return to the config-ui
   - Change settings
   - Generate a new bookmarklet
   - Update their browser bookmark

## Technical Implementation

1. **New Server Endpoint**: `/generate-bookmarklet`
2. **New Builder Method**: `generateCustomBookmarklet(settings)`
3. **Modified Main Code**: Checks for `window.__BOOKMARKLET_SETTINGS`
4. **Updated UI**: Clear explanation of how settings are embedded

## Testing Approach

To test this implementation:

1. Visit the config-ui and configure settings
2. Generate a bookmarklet with custom settings
3. Create a bookmark with the generated code
4. Visit a different website and click the bookmark
5. Verify the settings are applied correctly
6. Change settings and generate a new bookmarklet
7. Verify the new settings are applied

## Future Improvements

- Add version number to embedded settings
- Add settings validation on both client and server
- Allow export/import of settings configurations
- Add a dark/light mode toggle for the config-ui itself