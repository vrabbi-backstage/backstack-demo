# GitHub Codespaces Configuration

This directory contains the configuration for running the Backstack Demo in GitHub Codespaces.

## What's Included

The devcontainer is configured with:

- **Node.js 20**: The required Node.js version for Backstage
- **kubectl**: Kubernetes command-line tool
- **helm**: Kubernetes package manager
- **kind**: Kubernetes in Docker (for local cluster creation)
- **Docker-in-Docker**: Required for kind and container operations
- **Yarn 4**: Package manager (enabled via corepack)

## Pre-installed Extensions

The following VS Code extensions are automatically installed:
- ESLint
- Prettier
- Kubernetes Tools
- YAML support

## Environment Setup

The devcontainer automatically:
1. Enables yarn via corepack
2. Installs Backstage dependencies
3. Configures Node.js environment variables (including `NODE_TLS_REJECT_UNAUTHORIZED=0` for self-signed certificate support as required by Backstage)
4. Forwards ports 3000 (frontend) and 7007 (backend)

## Getting Started

After the Codespace starts:

1. **Set up GitHub credentials** (required for Backstage):
   ```bash
   export GITHUB_TOKEN="your_github_token"
   export GITHUB_CLIENT_ID="your_oauth_app_client_id"
   export GITHUB_CLIENT_SECRET="your_oauth_app_client_secret"
   export GITHUB_OWNER="your_github_username"
   export GITHUB_REPO="your_repo_name"
   ```

2. **Follow the setup instructions** in the main [README.md](../README.md) starting from "Create Kind Cluster"

3. **Start Backstage**:
   ```bash
   cd backstage
   yarn start
   ```

## Notes

- The environment includes Docker-in-Docker support, allowing you to run kind clusters within the Codespace
- All prerequisites mentioned in the main README are pre-installed
- The workspace is configured with recommended VS Code settings for the project
