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
- **crossplane**: CLI for interacting with crossplane
- **kyverno**: CLI for interacting with Kyverno
- **argocd**: CLI for interacting with ArgoCD

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
3. Configures Node.js environment
4. Forwards ports 3000 (frontend) and 7007 (backend)
5. Creates a Kind Cluster
6. Installs Kyverno, ArgoCD, and Crossplane
7. Configures Crossplane and Kyverno
8. Setups RBAC for Backstage in the Kubernetes Cluster

## Getting Started

### While the Codespace starts:

1. [Create Github PAT](https://github.com/settings/tokens/new)
2. [Create Github Oauth App](https://github.com/settings/applications/new)
    * Application Name: Backstage
    * Homepage URL: http://localhost:3000
    * Authorization Callback URL: http://localhost:7007/api/auth/github
3. Copy the Client ID
4. Create a Client Secret and copy it
5. Update first User Manifests Username from vrabbi to your Github Username in [the relevant file](./backstage/examples/org.yaml)

### After the Codespace starts
1. **Set up GitHub credentials** (required for Backstage):
   ```bash
   export GITHUB_TOKEN="your_github_token"
   export GITHUB_CLIENT_ID="your_oauth_app_client_id"
   export GITHUB_CLIENT_SECRET="your_oauth_app_client_secret"
   export GITHUB_OWNER="your_github_username"
   export GITHUB_REPO="your_repo_name"
   ```
2. **Configure Argo AppSet**:
   ```bash
   envsubst <argo/app-set-template.yaml > argo/app-set-rendered.yaml
   kubectl apply -f argo/app-set-rendered.yaml
   ```
3. **Export Kubernetes Cluster Details**:
   ```bash
   export KUBERNETES_URL=`kubectl config view --raw --minify -o jsonpath='{.clusters[0].cluster.server}'`
   export KUBERNETES_SERVICE_ACCOUNT_TOKEN=`kubectl get secret -n backstage-system backstage-token -o jsonpath='{.data.token}' | base64 --decode`
   ```
3. **Start Backstage**:
   ```bash
   cd backstage
   export NODE_OPTIONS="--max_old_space_size=8192 --no-node-snapshot"
   export NODE_TLS_REJECT_UNAUTHORIZED=0
   yarn start
   ```

## Notes

- The environment includes Docker-in-Docker support, allowing you to run kind clusters within the Codespace
- All prerequisites mentioned in the main README are pre-installed
- The workspace is configured with recommended VS Code settings for the project
