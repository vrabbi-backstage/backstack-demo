# Application Configuration Overview

This document provides a comprehensive overview of the Backstage configuration used in the BACKStack Kubecon 2025 NA Demo environment. The configuration is defined in `app-config.local.yaml` and establishes the foundational settings for the entire platform.

## Configuration Structure

The application configuration is organized into several key sections, each controlling different aspects of the Backstage instance:

### App Configuration

```yaml
app:
  title: Backstack Kubecon 2025 NA Demo
  baseUrl: http://localhost:3000
  packages: all
```

The app section defines the basic application settings:
- **title**: Display name for the Backstage instance
- **baseUrl**: The frontend application URL
- **packages**: Set to `all` to enable all packages by default from `packages/app/package.json`

#### Extension Configuration

The configuration customizes the UI by:
- Disabling default nav items (search, user-settings, catalog, scaffolder) as they're manually rendered in `packages/app/src/modules/nav/Sidebar.tsx`
- Disabling default entity cards (has-subcomponents, depends-on-components, depends-on-resources)
- Configuring the catalog index page to be the root path (`/`) instead of the default `/catalog`

### Organization

```yaml
organization:
  name: Backstack
```

Defines the organization name that appears throughout the interface.

### Backend Configuration

The backend section is the most comprehensive part of the configuration:

#### Authentication

```yaml
backend:
  auth:
    externalAccess:
      - type: static
        options:
          token: k9lPknGFOGEiHSVuxo1PxKZ+8EfKXBkz
          subject: mcp-clients
```

Configures static token authentication for external access, particularly for MCP clients. The token allows authorized clients to interact with the backend APIs without going through the standard OAuth flow.

#### Actions Registry

```yaml
backend:
  actions:
    pluginSources:
      - 'catalog'
      - 'crossplane'
      - 'kyverno'
```

Registers action sources from specific plugins, enabling those plugins to provide scaffolder actions and MCP tools.

#### Network Configuration

```yaml
backend:
  baseUrl: http://localhost:7007
  listen:
    port: 7007
  cors:
    origin: http://localhost:3000
    methods: [GET, HEAD, PATCH, POST, PUT, DELETE]
    credentials: true
```

Configures the backend server networking:
- **baseUrl**: Backend API endpoint
- **listen.port**: Port the backend listens on
- **cors**: Cross-Origin Resource Sharing settings for frontend-backend communication

#### Database

```yaml
backend:
  database:
    client: better-sqlite3
    connection: ':memory:'
```

Uses an in-memory SQLite database for development purposes. For production deployments, this should be replaced with a persistent database like PostgreSQL.

#### Security

```yaml
backend:
  csp:
    connect-src: ["'self'", 'http:', 'https:']
```

Content Security Policy configuration to control allowed connection sources.

#### Reading Configuration

```yaml
backend:
  reading:
    allow:
      - host: raw.githubusercontent.com
```

Configures which external hosts can be accessed when reading remote content, particularly for catalog entity definitions.

### Integrations

```yaml
integrations:
  github:
    - host: github.com
      token: ${GITHUB_TOKEN}
```

Configures GitHub integration using an environment variable for the access token. This enables:
- Reading catalog entities from GitHub repositories
- Publishing scaffolder outputs to GitHub
- GitHub authentication

### TechDocs

```yaml
techdocs:
  builder: 'local'
  generator:
    runIn: 'docker'
  publisher:
    type: 'local'
```

Configures the TechDocs feature for documentation generation:
- **builder**: Uses local building (alternative: external)
- **generator.runIn**: Runs the documentation generator in Docker containers
- **publisher.type**: Publishes documentation locally (alternatives: googleGcs, awsS3)

### Authentication Providers

```yaml
auth:
  experimentalDynamicClientRegistration:
    enabled: true
  providers:
    guest: {}
    github:
      development:
        clientId: ${GITHUB_CLIENT_ID}
        clientSecret: ${GITHUB_CLIENT_SECRET}
        signIn:
          resolvers:
            - resolver: usernameMatchingUserEntityName
```

Configures authentication providers:
- **experimentalDynamicClientRegistration**: Enables OAuth2 dynamic client registration for MCP clients
- **guest**: Allows guest access without authentication
- **github**: GitHub OAuth authentication with username-based user entity resolution

### Software Catalog

```yaml
catalog:
  import:
    entityFilename: catalog-info.yaml
    pullRequestBranchName: backstage-integration
  rules:
    - allow: [Component, System, API, Resource, Location]
```

The catalog configuration defines:
- **import**: Settings for importing entities via the Backstage web UI
- **rules**: Allowed entity kinds in the catalog

#### Catalog Locations

The configuration includes several catalog entity sources:
- **Local file entities**: `../../examples/entities.yaml` and `../../examples/org.yaml`
- **Local templates**: `../../examples/template/template.yaml`
- **Remote templates**: GitHub-hosted Terraform module template
- **Remote components**: GitHub-hosted component with AI rules

### Permissions

```yaml
permission:
  enabled: false
```

Permissions system is currently disabled, allowing unrestricted access to all resources.

### Kubernetes Ingestor

```yaml
kubernetesIngestor:
  mappings:
    namespaceModel: 'default'
    nameModel: 'name'
    titleModel: 'name'
    systemModel: 'namespace'
    referencesNamespaceModel: 'default'
```

The Kubernetes Ingestor plugin configuration controls how Kubernetes resources are ingested as catalog entities:

#### Component Ingestion

```yaml
kubernetesIngestor:
  components:
    enabled: true
    taskRunner:
      frequency: 10
      timeout: 600
    excludedNamespaces:
      - kube-public
      - kube-system
    customWorkloadTypes: []
    disableDefaultWorkloadTypes: true
    onlyIngestAnnotatedResources: false
```

Settings for ingesting Kubernetes workloads as components:
- **enabled**: Turns on component ingestion
- **taskRunner**: Runs ingestion every 10 seconds with a 10-minute timeout
- **excludedNamespaces**: System namespaces to skip
- **onlyIngestAnnotatedResources**: When false, ingests all resources (not just annotated ones)

#### Crossplane Integration

```yaml
kubernetesIngestor:
  crossplane:
    claims:
      ingestAllClaims: true
    xrds:
      convertDefaultValuesToPlaceholders: true
      enabled: true
      publishPhase:
        allowRepoSelection: false
        allowedTargets: ['github.com']
        target: github
        git:
          repoUrl: github.com?owner=${GITHUB_OWNER}&repo=${GITHUB_REPO}
          targetBranch: main
      taskRunner:
        frequency: 10
        timeout: 600
      ingestAllXRDs: true
```

Crossplane-specific ingestion settings:
- **claims.ingestAllClaims**: Automatically ingests all Crossplane claims
- **xrds**: Configuration for Crossplane XRD (Composite Resource Definition) ingestion and template generation
- **publishPhase**: Settings for publishing generated templates to GitHub

### Crossplane Plugin

```yaml
crossplane:
  enablePermissions: false
```

Disables the Crossplane permission framework, allowing unrestricted access to Crossplane resources.

### Kyverno Plugin

```yaml
kyverno:
  enablePermissions: false
```

Disables the Kyverno permission framework, allowing unrestricted access to policy reports.

### Kubernetes Plugin

```yaml
kubernetes:
  frontend:
    podDelete:
      enabled: true
  serviceLocatorMethod:
    type: 'singleTenant'
  clusterLocatorMethods:
    - type: 'config'
      clusters:
        - name: demo-cluster
          authProvider: 'serviceAccount'
          skipTLSVerify: true
          url: ${KUBERNETES_URL}
          serviceAccountToken: ${KUBERNETES_SERVICE_ACCOUNT_TOKEN}
```

Configures Kubernetes integration:
- **frontend.podDelete**: Enables pod deletion from the UI
- **serviceLocatorMethod**: Uses single-tenant mode (all components use the same cluster)
- **clusterLocatorMethods**: Defines cluster connection using service account authentication

## Environment Variables

The configuration references several environment variables that must be set:

- `GITHUB_TOKEN`: GitHub personal access token for API access
- `GITHUB_CLIENT_ID`: OAuth app client ID for GitHub authentication
- `GITHUB_CLIENT_SECRET`: OAuth app client secret for GitHub authentication
- `GITHUB_OWNER`: GitHub organization/user for Crossplane template publishing
- `GITHUB_REPO`: GitHub repository for Crossplane template publishing
- `KUBERNETES_URL`: Kubernetes cluster API server URL
- `KUBERNETES_SERVICE_ACCOUNT_TOKEN`: Service account token for Kubernetes access

## Best Practices

1. **Never commit secrets**: Use environment variables for all sensitive data
2. **Use persistent database**: Replace in-memory database with PostgreSQL for production
3. **Enable permissions**: Once deployed, enable the permissions system for security
4. **Configure TLS**: Update URLs to use HTTPS in production
5. **Restrict CORS**: Limit CORS origins to specific domains in production
6. **Review proxy endpoints**: Ensure proxy endpoints are necessary and secure
7. **Rotate tokens**: Regularly rotate all authentication tokens
8. **Enable monitoring**: Add observability configuration for production deployments

## Related Documentation

- [Plugins Overview](./04-plugins-in-the-environment.md)
- [MCP Server Capabilities](./06-mcp-server-capabilities.md)
- [System Model](./03-system-model.md)

