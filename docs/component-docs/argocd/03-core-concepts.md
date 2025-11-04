---
id: core-concepts
title: Core Concepts
description: Essential Argo CD concepts and terminology for understanding GitOps-based deployments
---

Before working with Argo CD, it's important to understand the core concepts and terminology that define how Argo CD operates.

## Application

An **Application** is the fundamental unit in Argo CD. It represents a group of Kubernetes resources defined by manifests in a Git repository.

**Key characteristics**:

- **Defined in Git** - Application source and configuration stored in version control
- **Single logical unit** - Group of related resources treated as one deployable unit
- **Custom Resource** - Implemented as Kubernetes CRD (CustomResourceDefinition)
- **Declarative** - Application state defined in YAML manifest
- **Trackable** - Can track Git branches, tags, or specific commits

**Example**:

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
    path: my-app/
    targetRevision: main
  destination:
    server: https://kubernetes.default.svc
    namespace: default
```

## Target State (Desired State)

The **target state** is the desired state of an application as defined by manifests stored in a Git repository.

**Characteristics**:

- **Source of truth** - Git repository contains the canonical desired state
- **Version controlled** - All changes tracked with Git history
- **Declarative** - Expressed through Kubernetes manifests
- **Auditable** - Every change has author, timestamp, and message
- **Reproducible** - Can deploy any historical state by checking out Git commit

**Target state can be defined through**:

- Helm charts
- Kustomize overlays
- Jsonnet files
- Plain YAML manifests
- Custom templating tools

## Live State (Actual State)

The **live state** is the actual current state of an application running in a Kubernetes cluster.

**Characteristics**:

- **Real-time** - Current running state of resources
- **Observed** - Discovered by monitoring Kubernetes API
- **Dynamic** - Changes when users manually update resources or deployments complete
- **Reported by cluster** - Kubernetes reports current state through API
- **Can drift** - May differ from target state due to manual changes

## Sync Status

**Sync status** describes whether the live state matches the target state.

### Synced

- Live state matches target state
- Application is in desired configuration
- No manual changes outside of Git
- Safe to deploy

### OutOfSync

- Live state differs from target state
- Could be due to:
  - Manual changes to Kubernetes resources (drift)
  - New Git commits not yet deployed
  - Failures during previous sync attempt
  - Helm chart or template changes

### Unknown

- Argo CD cannot determine sync status
- Usually indicates:
  - Application not yet synced
  - Communication issues with cluster
  - Application components missing

## Sync

**Sync** is the process of making the live state match the target state.

**Sync process**:

1. Generate manifests from Git (Helm, Kustomize, etc.)
2. Compare generated manifests with live cluster state
3. Identify differences
4. Apply kubectl patches or create/delete resources
5. Wait for resources to reach desired state
6. Update application status

**Sync can be**:

- **Automatic** - Argo CD automatically syncs when Git changes
- **Manual** - Requires explicit approval/trigger
- **Selective** - Sync only specific resources instead of entire application
- **Partial** - Sync only affected resources, not whole application

## Refresh

**Refresh** is the process of comparing the latest Git commits with the live cluster state and updating the sync status.

**Refresh operations**:

- Fetch latest Git commit
- Re-generate manifests
- Compare with live state
- Update OutOfSync status
- Detect drift from manual changes

Refresh happens:

- Automatically on a schedule (default 3 minutes)
- When webhook received from Git
- Manually via CLI: `argocd app refresh`
- When user requests status update

## Health

**Health** describes whether an application's resources are functioning correctly.

### Health States

- **Healthy** - All resources are running and functioning
- **Progressing** - Application is deploying, resources being created/updated
- **Degraded** - Some resources are unhealthy
- **Unknown** - Cannot determine health status
- **Suspended** - Application is suspended

### Health Conditions

Argo CD evaluates health based on:

- **Deployment** - All replicas ready and updated
- **StatefulSet** - All replicas ready
- **DaemonSet** - All nodes running the DaemonSet
- **Job** - Job completed successfully
- **Pod** - All containers running
- **Service** - Endpoints exist
- **Ingress** - Has IP/hostname assigned
- **Custom resources** - Evaluated by CRD health rules

## Source

The **source** specifies where application manifests come from.

### Source Components

```yaml
source:
  repoURL: https://github.com/mycompany/apps.git # Git repository
  path: apps/my-app # Path in repository
  targetRevision: main # Branch, tag, or commit

  # If using Helm
  helm:
    valueFiles:
      - values-prod.yaml
    parameters:
      - name: replicas
        value: "3"

  # If using Kustomize
  kustomize:
    namePrefix: prod-

  # If using Jsonnet
  jsonnet:
    vars:
      environment: production
```

### Target Revision Strategies

Applications can track:

- **Branch** - `targetRevision: main` - Always deploy latest from branch
- **Tag** - `targetRevision: v1.2.3` - Pin to specific release
- **Commit** - `targetRevision: abc1234` - Pin to specific commit
- **Semantic version** - `targetRevision: ~1.2` - Deploy compatible versions

## Destination

The **destination** specifies where an application should be deployed.

### Destination Components

```yaml
destination:
  server: https://kubernetes.default.svc # API server URL
  namespace: production # Kubernetes namespace
  name: production-cluster # Or cluster name
```

### Multi-cluster Deployments

Applications can deploy to multiple clusters:

```yaml
# ApplicationSet can generate Applications for multiple clusters
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: multi-cluster-app
spec:
  generators:
    - list:
        elements:
          - cluster: production
            namespace: prod
          - cluster: staging
            namespace: staging
  template:
    spec:
      destination:
        server: "{{ server }}" # Populated by generator
        namespace: "{{ namespace }}"
```

## Project

A **project** is a logical grouping of applications with associated access controls.

**Project purposes**:

- **Access control** - RBAC policies per project
- **Organization** - Group related applications
- **Policy enforcement** - Source repositories, destinations, resources allowed
- **Multi-tenancy** - Separate applications by team

**Example**:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: platform-team
spec:
  description: Applications managed by platform team
  sourceRepos:
    - "https://github.com/mycompany/*" # Allowed source repos
  destinations:
    - namespace: "platform-*" # Allowed namespaces
      server: "*" # Allowed servers
  clusterResourceWhitelist:
    - group: "*"
      kind: "*" # Allowed cluster-scoped resources
```

## Tool (Configuration Management Tool)

A **tool** is the application used to generate Kubernetes manifests.

### Supported Tools

- **Helm** - Package manager with templating
- **Kustomize** - Template-free customization
- **Jsonnet** - Declarative configuration language
- **Plain YAML** - Direct Kubernetes manifests
- **Custom tools** - Via Config Management Plugins (CMPs)

### Tool Selection

Argo CD automatically detects the tool based on files present:

```
./Chart.yaml              → Use Helm
./kustomization.yaml      → Use Kustomize
./jsonnetfile.json        → Use Jsonnet
*.yaml or *.json files    → Use plain YAML
```

## Repository

A **repository** is a Git repository containing application manifests.

**Repository characteristics**:

- **Source control** - All history tracked in Git
- **Credentials** - Argo CD stores credentials to access private repos
- **Caching** - Local cache maintained for performance
- **Webhook support** - Can receive push notifications

**Repository configuration**:

```yaml
- url: https://github.com/mycompany/apps.git
  password: <token> # For HTTPS
  sshPrivateKey: <key> # For SSH
  username: <username> # For HTTPS
```

## Reconciliation

**Reconciliation** is Argo CD's continuous process of ensuring live state matches target state.

**Reconciliation loop**:

1. Watch for changes (Git commits, manual cluster changes)
2. Fetch latest manifests from Git
3. Generate manifests if templated
4. Compare desired vs actual state
5. If auto-sync enabled, apply changes
6. Monitor resource health
7. Report status
8. Repeat continuously

**Reconciliation happens**:

- Continuously in background (every ~5 seconds)
- When Git changes detected (via webhook)
- When manual sync triggered
- On refresh schedule

## Sync Hooks

**Sync hooks** are lifecycle events that trigger custom logic during the sync process.

### Hook Types

- **PreSync** - Execute before resources applied (e.g., run migration, backup)
- **Sync** - Execute during resource application (e.g., wait for specific condition)
- **PostSync** - Execute after resources applied (e.g., run tests, notify)

**Example**:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
spec:
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
    retry:
      limit: 5
  source:
    path: my-app/
  destination:
    namespace: default
  syncPolicy:
    automated:
      prune: true      # Delete removed resources
      selfHeal: true   # Sync on drift detection
```

## OutOfSync

An application is **OutOfSync** when live state differs from target state.

**Common causes**:

- New Git commits pushed but not yet deployed
- Manual kubectl changes outside of Argo CD
- Resource deleted from cluster manually
- Failed sync attempt with partial application
- Scaling changes not reflected in Git

**Detection**:

- Argo CD detects during refresh
- Shown in UI and CLI as "OutOfSync"
- Can trigger automatic sync if enabled

## Status

**Status** is the comprehensive state information for an application.

**Status includes**:

- **Sync status** - Synced, OutOfSync, Unknown
- **Health** - Healthy, Progressing, Degraded, Unknown
- **Resources** - Individual resource statuses
- **Summary** - Total counts of healthy/degraded resources
- **Conditions** - Any warnings or errors
- **Revision** - Currently deployed Git commit

## Summary

The Argo CD concepts form a cohesive model:

| Concept        | Purpose                                |
| -------------- | -------------------------------------- |
| Application    | Unit of deployment and management      |
| Target State   | Desired state in Git (source of truth) |
| Live State     | Actual running state in Kubernetes     |
| Sync Status    | Whether target matches live            |
| Sync           | Process of making target match live    |
| Health         | Whether app is functioning correctly   |
| Source         | Where manifests come from (Git)        |
| Destination    | Where app deploys (Kubernetes cluster) |
| Reconciliation | Continuous monitoring and correction   |

Understanding these concepts is essential for effectively using Argo CD.

## See Also

- [What is Argo CD](./01-what-is-argocd.md) - Introduction to Argo CD
- [Technical Overview](./02-technical-overview.md) - Architecture and components
- [Key Features](./04-key-features.md) - Deep dive into Applications and ApplicationSets
