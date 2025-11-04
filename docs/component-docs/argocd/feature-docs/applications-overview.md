---
id: applications-overview
title: Applications
description: Manage applications and their deployments using Argo CD Applications
---

An **Application** is the fundamental unit of deployment in Argo CD. It represents a group of Kubernetes resources defined by manifests in a Git repository and manages their synchronization to a Kubernetes cluster.

## What is an Application?

An Application is a Kubernetes custom resource that defines:

- Where application manifests are stored (Git repository)
- How to generate those manifests (Helm, Kustomize, plain YAML, etc.)
- Where to deploy them (target cluster and namespace)
- How to keep them in sync (sync policies)

## Creating Applications

### Declarative Application (Recommended)

Define Applications as YAML in Git:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default

  source:
    repoURL: https://github.com/mycompany/apps.git
    targetRevision: main
    path: apps/my-app

  destination:
    server: https://kubernetes.default.svc
    namespace: default

  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

### Using the CLI

Create Applications through command-line:

```bash
argocd app create my-app \
  --repo https://github.com/mycompany/apps.git \
  --path apps/my-app \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace default
```

### Using the Web UI

Create through the Argo CD web interface:

1. Click "Create Application"
2. Enter application name
3. Select project
4. Configure source repository and path
5. Configure destination cluster
6. Set sync policy
7. Create

## Application Configuration

### Source Configuration

Specify where application manifests come from:

```yaml
source:
  # Git repository URL
  repoURL: https://github.com/mycompany/apps.git

  # Which branch/tag/commit to track
  targetRevision: main

  # Path within repository
  path: apps/my-app

  # For Helm charts
  chart: my-chart # If deploying Helm from repo
  helm:
    releaseName: my-app
    values: |
      replicas: 3
      image: myapp:v1.0.0

  # For Kustomize
  kustomize:
    namePrefix: prod-
    nameSuffix: -prod

  # For Jsonnet
  jsonnet:
    vars:
      environment: prod
```

### Destination Configuration

Specify target cluster and namespace:

```yaml
destination:
  # Local cluster
  server: https://kubernetes.default.svc
  # OR remote cluster
  name: production

  # Target namespace
  namespace: production

  # Create namespace if missing
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
```

### Project Configuration

Associate with a project for access control:

```yaml
project: platform-team # Which project this app belongs to
```

## Synchronization

### Sync Status

Applications report sync status:

- **Synced** - Live state matches desired state
- **OutOfSync** - Live state differs from desired state
- **Unknown** - Cannot determine sync status

Check sync status:

```bash
argocd app get my-app
# Shows: Sync Status, Health, etc.
```

### Manual Sync

Manually sync when automated is disabled:

```bash
# Sync entire application
argocd app sync my-app

# Sync specific resource
argocd app sync my-app --resource=Deployment/my-app

# Sync and wait for completion
argocd app sync my-app --wait
```

### Automated Sync

Enable automatic synchronization:

```yaml
syncPolicy:
  automated:
    prune: true # Delete removed resources
    selfHeal: true # Sync on drift
```

**What happens with automated sync**:

- When Git changes detected → automatically apply changes
- When cluster drifts → automatically reconcile to Git state
- Resources deleted from cluster → automatically recreate
- Manifests removed from Git → automatically delete from cluster

### Sync Retry

Configure retry behavior if sync fails:

```yaml
syncPolicy:
  retry:
    limit: 5 # Max retry attempts
    backoff:
      duration: 5s # Initial delay
      factor: 2 # Multiply delay by factor each retry
      maxDuration: 3m # Max delay between retries
```

## Application Status

### Sync Status vs Health Status

Applications track two independent status dimensions:

**Sync Status** - Does live state match Git?

- Synced / OutOfSync / Unknown

**Health Status** - Are resources functioning?

- Healthy / Progressing / Degraded / Unknown

An application can be:

- **Synced & Healthy** ✅ - Perfect state
- **Synced but Degraded** - In Git but resources unhealthy
- **OutOfSync & Healthy** - Not deployed yet or manual changes
- **OutOfSync & Degraded** - Deployment failed or drift

### Viewing Status

```bash
# Detailed status
argocd app get my-app

# Watch live updates
argocd app watch my-app

# Get as JSON for automation
argocd app get my-app -o json
```

## Application Operations

### Refresh

Refresh compares Git state with cluster state:

```bash
# Refresh application
argocd app refresh my-app

# Hard refresh (clear cache)
argocd app refresh my-app --hard
```

Refresh happens automatically on schedule (default 3 minutes) or when webhook received.

### Rollback

Revert to a previous deployment:

```bash
# List deployment history
argocd app history my-app

# Rollback to previous deployment
argocd app rollback my-app 1

# Deploy specific Git commit
argocd app sync my-app --revision abc123def
```

### Delete

Remove application and optionally cluster resources:

```bash
# Delete application (keep cluster resources)
argocd app delete my-app

# Cascading delete (delete cluster resources too)
argocd app delete my-app --cascade
```

## Advanced Features

### Multi-source Applications

Deploy from multiple Git sources:

```yaml
sources:
  # Base configuration
  - repoURL: https://github.com/company/base.git
    path: base/
    targetRevision: main

  # Environment-specific
  - repoURL: https://github.com/company/envs.git
    path: prod/
    targetRevision: main

# Kustomize can build multiple sources
kustomize:
  images:
    - myapp=myregistry/myapp:latest
```

### Tracking Strategies

Track different Git references:

```yaml
# Track branch (always latest)
targetRevision: main

# Track tag (semantic version)
targetRevision: v1.2.3

# Track commit (pinned)
targetRevision: abc123def456

# Track semantic version range
targetRevision: ~1.2   # Allows 1.2.x but not 1.3.x

# Track branch glob
targetRevision: 'release/*'
```

### Sync Waves

Control deployment order:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: config
  annotations:
    argocd.argoproj.io/sync-wave: "0" # Deploy first
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
  annotations:
    argocd.argoproj.io/sync-wave: "1" # Deploy second
---
apiVersion: batch/v1
kind: Job
metadata:
  name: post-deploy
  annotations:
    argocd.argoproj.io/sync-wave: "2" # Deploy third
```

### Ignore Differences

Ignore specific resource differences during sync:

```yaml
syncPolicy:
  syncOptions:
    - RespectIgnoreDifferences=true

# In application manifests, annotate to ignore
apiVersion: apps/v1
kind: Deployment
metadata:
  annotations:
    argocd.argoproj.io/compare-result: ignore
```

## Health Assessment

Argo CD assesses application health:

- **Deployment** - All replicas ready and updated
- **StatefulSet** - All replicas ready
- **DaemonSet** - All nodes running
- **Pod** - All containers running
- **Service** - Has endpoints
- **Ingress** - Has IP assigned
- **Job** - Completed successfully
- **Custom resources** - Evaluated by CRD health rules

### Custom Health Rules

Define custom health for CRDs:

```yaml
# In argocd-cm ConfigMap
resource.customizations.health.company.com_Widget: |
  hs = {}
  if obj.status.phase == "Ready" then
    hs.status = "Healthy"
  else
    hs.status = "Progressing"
  end
  return hs
```

## Common Patterns

### Separate Git Repos

Application and environment configs in separate repos:

```yaml
# Application repo contains app definition
source:
  repoURL: https://github.com/company/apps.git
  path: my-app/

# Environment repo contains configuration
kustomize:
  bases:
    - https://github.com/company/apps.git//my-app
```

### Namespace per Application

Isolate applications in namespaces:

```yaml
destination:
  namespace: my-app-prod
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
```

### Environment Promotion

Track different branches per environment:

```yaml
# Application for staging
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app-staging
spec:
  source:
    targetRevision: staging
  destination:
    namespace: staging
---
# Application for production
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app-prod
spec:
  source:
    targetRevision: main
  destination:
    namespace: production
```

### Parameter Override

Pass parameters through Application:

```yaml
helm:
  parameters:
    - name: image.tag
      value: v1.2.3
    - name: replicas
      value: "3"
```

## Troubleshooting

### Application OutOfSync

Check what changed:

```bash
# View resource differences
argocd app diff my-app

# Get detailed diff
argocd app get my-app --refresh
```

### Sync Failures

Check sync logs:

```bash
# View sync operation details
argocd app sync my-app --dry-run

# Get operation history
argocd app history my-app
```

### Health Issues

Investigate unhealthy resources:

```bash
# Get detailed resource status
argocd app get my-app

# Check Kubernetes resource status
kubectl describe deployment my-app -n production
```

## Best Practices

✅ **Use declarative Applications** - Store in Git, version control
✅ **Enable automated sync** - Keep clusters in sync with Git
✅ **Use projects for RBAC** - Organize and control access
✅ **Track branches/tags** - Don't track random commits
✅ **Use meaningful names** - Easy to identify applications
✅ **Monitor status** - Watch health and sync status
✅ **Test before production** - Dry-run syncs before applying
✅ **Implement approval gates** - Use manual sync for production
✅ **Document applications** - Add comments and descriptions

## See Also

- [Core Concepts](../03-core-concepts.md) - Understand Applications fundamentally
- [ApplicationSet Overview](./applicationset-overview.md) - Generate multiple applications
- [Sync Strategies](./sync-strategies-overview.md) - Different deployment approaches
- [Official Documentation](https://argo-cd.readthedocs.io/en/stable/user-guide/application/) - Complete reference
