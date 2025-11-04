---
id: key-features
title: Key Features
description: Deep dive into Argo CD's key features - Applications, ApplicationSets, Repository management, and synchronization
---

This document provides an in-depth exploration of Argo CD's core features that enable GitOps-based continuous delivery.

## Applications: The Core Unit

### What is an Application?

An Application is the fundamental unit of deployment in Argo CD. It represents a group of Kubernetes resources defined by manifests stored in a Git repository.

### Application Anatomy

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
  labels:
    app: my-app
    team: platform
spec:
  # Project association
  project: default

  # Source of manifests
  source:
    repoURL: https://github.com/mycompany/apps.git
    path: apps/my-app
    targetRevision: main

    # Helm configuration
    helm:
      releaseName: my-app
      values: |
        replicas: 3
        image: myapp:latest

  # Destination cluster
  destination:
    server: https://kubernetes.default.svc
    namespace: default

  # Sync policy
  syncPolicy:
    automated:
      prune: true      # Delete removed resources
      selfHeal: true   # Sync on drift detection
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m

  # Lifecycle hooks
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
```

### Application Lifecycle

Applications follow a lifecycle:

1. **Created** - Application manifest applied to Argo CD
2. **Syncing** - Initial sync of Git manifests to cluster
3. **Synced/OutOfSync** - Stable state, either matching or differing from Git
4. **Progressing/Degraded** - Resources deploying or unhealthy
5. **Deleted** - Application removed

### Application Tracking Strategies

Applications can track Git in different ways:

```yaml
# Track branch (always latest)
targetRevision: main

# Track tag (specific release)
targetRevision: v1.2.3

# Track commit (pinned version)
targetRevision: abc123def456

# Track semantic version
targetRevision: ~1.2  # v1.2.x

# Track git ref pattern
targetRevision: 'refs/heads/feature-*'
```

### Multi-source Applications

Deploy from multiple Git sources:

```yaml
spec:
  sources:
    # Base configuration
    - repoURL: https://github.com/company/base.git
      path: base/
      targetRevision: main

    # Environment-specific overrides
    - repoURL: https://github.com/company/environments.git
      path: prod/
      targetRevision: main
```

## ApplicationSet: Declarative Application Generation

### The Problem: Managing Multiple Applications

Managing dozens of applications with similar patterns becomes tedious:

```
# Without ApplicationSet - repeat for each app
Application for: staging-app-1
Application for: staging-app-2
Application for: staging-app-3
...
Application for: prod-app-1
Application for: prod-app-2
...
```

### The Solution: ApplicationSet

**ApplicationSet** generates multiple Applications declaratively from templates.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: apps-generator
spec:
  # Generator creates Applications from template
  generators:
    - list:
        elements:
          - app: frontend
            namespace: frontend
          - app: backend
            namespace: backend
          - app: database
            namespace: data

  # Template applied for each generated application
  template:
    metadata:
      name: "{{ app }}"
    spec:
      project: default
      source:
        repoURL: https://github.com/company/apps.git
        path: "apps/{{ app }}"
        targetRevision: main
      destination:
        server: https://kubernetes.default.svc
        namespace: "{{ namespace }}"
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

### Generator Types

#### 1. List Generator

Generate from static list:

```yaml
generators:
  - list:
      elements:
        - cluster: prod
          namespace: production
        - cluster: staging
          namespace: staging
```

#### 2. Git Generator

Generate from Git repository directories:

```yaml
generators:
  - git:
      repoURL: https://github.com/company/apps.git
      revision: main
      directories:
        - path: "apps/*" # Match app directories
```

#### 3. SCM Provider Generator

Generate from GitHub organization repositories:

```yaml
generators:
  - scmProvider:
      github:
        organization: mycompany
        allBranches: true
```

#### 4. Cluster Generator

Generate Applications for multiple clusters:

```yaml
generators:
  - clusters:
      selector:
        matchLabels:
          environment: production
```

#### 5. Matrix Generator

Combine multiple generators:

```yaml
generators:
  - matrix:
      generators:
        - list:
            elements:
              - app: app1
              - app: app2
        - list:
            elements:
              - env: prod
              - env: staging
```

### Use Cases

**Multi-cluster deployments**:

```yaml
# Generate Application for each cluster
generators:
  - clusters:
      selector:
        matchLabels:
          deploy: "true"
template:
  spec:
    destination:
      server: "{{ url }}" # Cluster URL from label
```

**Multi-tenant SaaS**:

```yaml
# Generate Application for each tenant
generators:
  - git:
      repoURL: https://github.com/company/tenants.git
      directories:
        - path: "tenants/*"
template:
  spec:
    destination:
      namespace: "{{ path.basename }}"
```

**Environment promotion**:

```yaml
# Generate Application for each environment
generators:
  - list:
      elements:
        - env: dev
        - env: staging
        - env: prod
template:
  spec:
    source:
      path: "apps/myapp/{{ env }}"
```

## Repository Management

### Repository Configuration

Argo CD needs credentials to access Git repositories:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: private-repo-creds
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: repository
stringData:
  type: git
  url: https://github.com/mycompany/apps.git
  password: <github-token>
  username: git
```

### Repository Types

- **GitHub/GitLab/Gitea** - Standard Git hosting
- **BitBucket/Bitbucket Server** - Atlassian platforms
- **Private Git servers** - Any Git over HTTPS/SSH
- **Helm repositories** - Chart repositories
- **OCI registries** - Container registries hosting Helm/Kustomize

### Credential Management

Different authentication methods:

```yaml
# HTTPS with token
password: <token>
username: git

# SSH with private key
sshPrivateKey: |
  -----BEGIN RSA PRIVATE KEY-----
  ...
  -----END RSA PRIVATE KEY-----

# Deploy key
deployKey: true

# Username/password
username: user
password: pass
```

## Synchronization: GitOps in Action

### Sync Policies

Control how and when synchronization happens:

```yaml
syncPolicy:
  # Automated sync
  automated:
    prune: true # Delete resources removed from Git
    selfHeal: true # Sync when live state drifts
    allowEmpty: false # Reject empty manifests

  # Manual sync settings
  syncOptions:
    - CreateNamespace=true # Create namespace if missing
    - PrunePropagationPolicy=foreground # How to delete resources
    - RespectIgnoreDifferences=true # Ignore specified differences

  # Retry configuration
  retry:
    limit: 5
    backoff:
      duration: 5s
      factor: 2
      maxDuration: 3m
```

### Sync Strategies

#### Automated Sync

Argo CD automatically deploys when Git changes:

```yaml
syncPolicy:
  automated:
    prune: true
    selfHeal: true
```

**Advantages**:

- Latest changes always deployed
- No manual approval needed
- Great for development/staging

**Disadvantages**:

- No approval gate
- Can deploy errors
- Less control in production

#### Manual Sync

Requires explicit approval:

```yaml
# Default - no automated
syncPolicy: {}

# Or explicitly request through CLI
argocd app sync my-app
```

**Advantages**:

- Full control over deployments
- Approval gates possible
- Production-safe

**Disadvantages**:

- Requires manual intervention
- Can lag behind Git

#### Progressive Sync

Deploy resources gradually:

```yaml
syncPolicy:
  syncOptions:
    - RespectIgnoreDifferences=true

# Only sync selected resources
argocd app sync my-app --resource=Deployment/my-app
```

### Sync Waves

Control order of resource deployment:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
  annotations:
    argocd.argoproj.io/sync-wave: "0" # Deploy first
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  annotations:
    argocd.argoproj.io/sync-wave: "1" # Deploy second
---
apiVersion: batch/v1
kind: Job
metadata:
  name: post-deploy-job
  annotations:
    argocd.argoproj.io/sync-wave: "2" # Deploy third
```

### Sync Hooks

Execute custom logic during sync:

```yaml
syncPolicy:
  # PreSync hook - runs before resources applied
  PreSync:
    - rbac: "*"
      kind: Job
      name: pre-sync-job

  # Sync hook - runs during resource sync
  Sync:
    - rbac: "*"
      kind: Pod
      name: sync-pod

  # PostSync hook - runs after resources applied
  PostSync:
    - rbac: "*"
      kind: Job
      name: post-sync-job
```

## RBAC: Fine-grained Access Control

### Project-based RBAC

Control what users can deploy and where:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: frontend-team
spec:
  # Which source repos team can deploy from
  sourceRepos:
    - "https://github.com/mycompany/frontend-*"

  # Which clusters/namespaces they can deploy to
  destinations:
    - namespace: "frontend-*"
      server: "*"

  # What resources they can manage
  clusterResourceWhitelist:
    - group: ""
      kind: Namespace
```

### RBAC Policies

Fine-grained permissions:

```yaml
# In argocd-rbac-cm ConfigMap
policy.csv: |
  p, role:frontend-team, applications, get, frontend-team/*, allow
  p, role:frontend-team, applications, sync, frontend-team/*, allow
  p, role:frontend-team, repositories, get, https://github.com/mycompany/frontend-*, allow

  # Grant role to user
  g, user@example.com, role:frontend-team
```

## Deployment Strategies

### Blue-Green Deployment

Two production environments:

```yaml
# ApplicationSet generates two apps
generators:
  - list:
      elements:
        - name: blue
          version: v1.0.0
        - name: green
          version: v1.1.0
template:
  spec:
    source:
      path: "apps/myapp"
      helm:
        parameters:
          - name: version
            value: "{{ version }}"
```

### Canary Deployment

Gradual rollout to percentage of users:

```yaml
# Use Flagger integration for canary
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: my-app
spec:
  targetRef:
    name: my-app
    apiVersion: apps/v1
    kind: Deployment
  progressDeadlineSeconds: 60
  service:
    port: 80
```

### Rolling Deployment

Standard Kubernetes rolling update:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    # ...
```

## Multi-cluster and Multi-environment

### Single cluster, multiple environments

Different namespaces per environment:

```yaml
# dev environment
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app-dev
spec:
  destination:
    namespace: development

---
# prod environment
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app-prod
spec:
  destination:
    namespace: production
```

### Multiple clusters

ApplicationSet to deploy across clusters:

```yaml
generators:
  - clusters:
      selector:
        matchLabels:
          deploy: "true"
template:
  spec:
    destination:
      server: "{{ url }}" # Cluster URL
      namespace: "{{ metadata.namespace }}"
```

## See Also

- [Core Concepts](./03-core-concepts.md) - Understand Applications, Sync status, Projects
- [Applications Overview](./feature-docs/applications-overview.md) - Detailed Application guide
- [ApplicationSet Overview](./feature-docs/applicationset-overview.md) - Advanced ApplicationSet patterns
- [Sync Strategies](./feature-docs/sync-strategies-overview.md) - Deployment patterns and strategies
- [Official Documentation](https://argo-cd.readthedocs.io/en/stable/) - Complete reference
