# Build and Release Process

This project uses GitHub Actions to automate the build and release process for the Tauri application.

## Workflows

### Release Workflow (`.github/workflows/release.yml`)

Automatically triggered when a git tag starting with `v` is pushed (e.g., `v1.0.3`).

#### What it does:
1. **Multi-platform Build**: Builds the Tauri application for:
   - macOS (Apple Silicon - aarch64)
   - macOS (Intel - x86_64) 
   - Linux (x86_64)
   - Windows (x86_64)

2. **Auto-Updater Support**: Generates `updater.json` file containing:
   - Version information
   - Release notes
   - Download URLs for each platform
   - Cryptographic signatures for security

3. **Release Management**: 
   - Creates a draft release
   - Uploads all build artifacts
   - Adds the updater.json file
   - Publishes the release

#### To create a new release:
```bash
git tag v1.0.3
git push origin v1.0.3
```

### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push to `main` and on pull requests to ensure code quality.

#### What it does:
1. **Frontend Testing**: 
   - Lints the code
   - Builds the frontend

2. **Tauri Build Test**:
   - Tests the Tauri build process (without bundling)
   - Ensures all dependencies are correctly configured

## Auto-Updater Configuration

The application is configured with Tauri's auto-updater plugin:

- **Endpoint**: `https://github.com/syntaxfm/production-assistant/releases/latest/download/updater.json`
- **Dialog**: Enabled (shows update prompts to users)
- **Signature Verification**: Automatic (handled by tauri-action)

## Dependencies

The workflows automatically handle:
- Node.js and pnpm setup
- Rust toolchain installation
- Platform-specific system dependencies
- Tauri CLI tools

## Security

- All releases are signed using Tauri's built-in signing process
- Signatures are verified during the update process
- Only releases created through the GitHub workflow are trusted