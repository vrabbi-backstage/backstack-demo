# Web Based GitHub Codespaces Configuration

This directory contains the configuration for running the Backstack Demo in GitHub Codespaces.

## Getting Started

### While the Codespace starts:

1. [Create Github PAT](https://github.com/settings/tokens/new)
2. [Create Github Oauth App](https://github.com/settings/applications/new)

    * Get the values by running in the terminal of this codespace the following commands:
    ```bash
    echo "Application Name: Backstage"
    echo "Homepage URL: https://${CODESPACE_NAME}-443.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    echo "Authorization Callback URL: https://${CODESPACE_NAME}-443.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/api/auth/github"
    ```
3. Copy the Client ID
4. Create a Client Secret and copy it

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
   export KUBERNETES_SERVICE_ACCOUNT_TOKEN=`kubectl get secret -n backstage-system backstage-token -o jsonpath='{.data.token}' | base64 --decode`
   export ARGOCD_ADMIN_PASSWORD=`kubectl get secret -n argocd argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 --decode`
   ```
4. **Render Backstage Values File**:
   ```bash
   envsubst <backstage/values-templated.yaml > backstage/values-rendered.yaml
   ```
3. **Deploy Backstage**:
   ```bash
   helm repo add backstage https://backstage.github.io/charts
   helm upgrade --install backstack backstage/backstage -n backstage-system -f backstage/values-rendered.yaml --wait
   ```

## Notes
- Go to the ports tab in vscode and change the visibility of the port 443 port-forward public. without this access to backstage will not work
- The environment includes Docker-in-Docker support, allowing you to run kind clusters within the Codespace
- The workspace is configured with recommended VS Code settings for the project

## Explore the app
To explore the different capabilities of the BACKStack and this implementation of the stack, we recommend fullowing our [Getting Started Guide](../docs/01-getting-started.md)