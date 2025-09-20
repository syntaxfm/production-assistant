# Syntax Production Assistant

A handy helper, to help with Syntax's production.

## Built With

- Svelte(5) Kit
- Tauri
- FFMPEG

## Features

### Auto-Updater

The application includes an automatic update system that allows users to check for and install updates seamlessly.

**Usage:**
- Click the "Check for Updates" button in the main application interface
- If an update is available, you'll be prompted to install it
- The updater will download and install the update automatically
- Restart the application to complete the update process

**Configuration:**
The updater is configured to check GitHub releases for updates. To set up releases for automatic updates:

1. Create a GitHub release with the appropriate assets
2. Ensure the release includes a `latest.json` file with update metadata
3. The updater will automatically detect and offer to install new versions

For production use, make sure to configure a proper signing key in `src-tauri/tauri.conf.json`.
