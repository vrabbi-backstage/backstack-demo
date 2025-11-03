# GitHub Codespaces Configuration

This directory contains the configuration for running the Backstack Demo in GitHub Codespaces.

## Important Notes
* While it can work with the default 2 CPU Core instance of a codespace, it is highly recommended to use at minimum the 4 CPU Core instance type for better performance and speed
* When the browser opens up for backstage after starting it, if it opens up to http://127.0.0.1:3000 change this to http://localhost:3000 as otherwise the github authentication flow will fail

## Getting Started

### While the Codespace starts:

1. [Create Github PAT](https://github.com/settings/tokens/new)
2. [Create Github Oauth App](https://github.com/settings/applications/new)
    * Application Name: Backstage
    * Homepage URL: http://localhost:3000
    * Authorization Callback URL: http://localhost:7007/api/auth/github
3. Copy the Client ID
4. Create a Client Secret and copy it
5. Update first User Manifests Username from vrabbi to your Github Username in [the relevant file](../backstage/source/examples/org.yaml)

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
   export ARGOCD_ADMIN_PASSWORD=`kubectl get secret -n argocd argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 --decode`
   ```
3. **Start Backstage**:
   ```bash
   cd backstage/source
   yarn install
   export NODE_OPTIONS="--max_old_space_size=8192 --no-node-snapshot"
   export NODE_TLS_REJECT_UNAUTHORIZED=0
   yarn start
   ```

## Notes
- Go to the ports tab in vscode and change the visibility of the port 443 port-forward public. without this access to backstage will not work
- The environment includes Docker-in-Docker support, allowing you to run kind clusters within the Codespace
- The workspace is configured with recommended VS Code settings for the project

## Explore the app
To explore the different capabilities of the BACKStack and this implementation of the stack, we recommend fullowing our [Getting Started Guide](../docs/01-getting-started.md)
