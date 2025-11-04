---
id: applicationset-overview
title: ApplicationSet
description: Declaratively generate and manage multiple Argo CD Applications using ApplicationSet
---

**ApplicationSet** extends Argo CD by enabling you to declaratively generate multiple Applications from templates. It solves the problem of managing dozens or hundreds of similar applications.

## Why ApplicationSet?

### The Problem Without ApplicationSet

Managing multiple applications with Argo CD requires creating an Application for each:

```yaml
# Without ApplicationSet - repeat for each app
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: app1
spec:
  source:
    repoURL: https://github.com/company/apps.git
    path: apps/app1
  destination:
    namespace: app1
---
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: app2
spec:
  source:
    repoURL: https://github.com/company/apps.git
    path: apps/app2
  destination:
    namespace: app2
# ... repeat for every app
```

This leads to:

- ❌ Massive amounts of duplication
- ❌ Hard to update all applications together
- ❌ Error-prone template management
- ❌ Difficult to manage at scale

### The Solution: ApplicationSet

```yaml
# With ApplicationSet - define once, generate many
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: apps-generator
spec:
  generators:
    - git:
        repoURL: https://github.com/company/apps.git
        directories:
          - path: "apps/*"
  template:
    metadata:
      name: "{{ path.basename }}"
    spec:
      source:
        repoURL: https://github.com/company/apps.git
        path: "{{ path }}"
      destination:
        namespace: "{{ path.basename }}"
```

Benefits:

- ✅ Single definition for many applications
- ✅ Easy to add/remove applications
- ✅ Consistent configuration across all apps
- ✅ Scales to hundreds of applications

## How ApplicationSet Works

### Generator Types

ApplicationSet uses generators to create Applications:

```
ApplicationSet + Generator → Multiple Applications
```

Generators examine Git, clusters, or external systems to determine what Applications to create.

## Generator Types

### 1. List Generator

Generate Applications from a static list:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: myapps
spec:
  generators:
    - list:
        elements:
          - name: app1
            environment: dev
          - name: app2
            environment: staging
          - name: app3
            environment: prod

  template:
    metadata:
      name: "{{ name }}"
    spec:
      source:
        path: "{{ name }}"
      destination:
        namespace: "{{ environment }}"
```

### 2. Git Generator

Generate Applications from Git repository:

#### Directories

Generate one Application per directory:

```yaml
generators:
  - git:
      repoURL: https://github.com/company/apps.git
      revision: main
      directories:
        - path: "apps/*"
        - path: "services/*"
        - path: "databases/*"
```

#### Files

Generate from files in Git:

```yaml
generators:
  - git:
      repoURL: https://github.com/company/config.git
      files:
        - path: "apps/*.json"
```

### 3. Cluster Generator

Generate Applications for multiple clusters:

```yaml
generators:
  - clusters:
      selector:
        matchLabels:
          deployment: "true"
          environment: production

template:
  spec:
    destination:
      name: "{{ name }}" # Cluster name
      namespace: myapp
```

Use when:

- Deploying same application to multiple clusters
- Multi-region/multi-cloud deployments
- Different cluster configurations needed

### 4. SCM Provider Generator

Generate Applications from Git provider (GitHub, GitLab):

```yaml
generators:
  - scmProvider:
      github:
        organization: mycompany
        allBranches: false
        api: https://api.github.com # For GitHub Enterprise

template:
  metadata:
    name: "{{ repository }}"
  spec:
    source:
      repoURL: "{{ url }}"
      path: "{{ path }}"
```

Use when:

- Deploying all repositories in organization
- CI/CD triggered deployments
- Dynamic repository discovery

### 5. Matrix Generator

Combine multiple generators (Cartesian product):

```yaml
generators:
  - matrix:
      generators:
        # First dimension: applications
        - git:
            repoURL: https://github.com/company/apps.git
            directories:
              - path: "apps/*"

        # Second dimension: clusters
        - clusters:
            selector:
              matchLabels:
                environment: prod

template:
  metadata:
    name: "{{ path.basename }}-{{ name }}"
  spec:
    source:
      path: "{{ path }}"
    destination:
      name: "{{ name }}"
```

This generates one Application per app-cluster combination.

### 6. Merge Generator

Combine generators with shared values:

```yaml
generators:
  - merge:
      mergeKeys:
        - name
      generators:
        - list:
            elements:
              - name: frontend
                tier: web
        - list:
            elements:
              - name: frontend
                version: v1
```

## Common Use Cases

### Multi-cluster Deployment

Deploy application to multiple clusters:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: multi-cluster-app
spec:
  generators:
    - clusters:
        selector:
          matchLabels:
            deploy-app: "true"

  template:
    metadata:
      name: "{{ name }}-myapp"
    spec:
      project: default
      source:
        repoURL: https://github.com/company/apps.git
        path: myapp
        targetRevision: main
      destination:
        name: "{{ name }}"
        namespace: production
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

### Multi-tenant SaaS

Generate Application for each tenant:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: saas-tenants
spec:
  generators:
    - git:
        repoURL: https://github.com/company/tenants.git
        directories:
          - path: "tenants/*"

  template:
    metadata:
      name: "{{ path.basename }}"
    spec:
      source:
        repoURL: https://github.com/company/saas.git
        path: saas
        helm:
          parameters:
            - name: tenantId
              value: "{{ path.basename }}"
      destination:
        namespace: "{{ path.basename }}"
        syncPolicy:
          syncOptions:
            - CreateNamespace=true
```

### Environment Promotion

Deploy to dev, staging, prod:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: environments
spec:
  generators:
    - list:
        elements:
          - name: dev
            cluster: dev-cluster
            branch: develop
          - name: staging
            cluster: staging-cluster
            branch: staging
          - name: prod
            cluster: prod-cluster
            branch: main

  template:
    metadata:
      name: "my-app-{{ name }}"
    spec:
      project: default
      source:
        repoURL: https://github.com/company/apps.git
        targetRevision: "{{ branch }}"
        path: my-app
      destination:
        name: "{{ cluster }}"
        namespace: default
      syncPolicy:
        automated:
          prune: true
          selfHeal: "{{ name != 'prod' }}" # Auto-sync except prod
```

### Progressive Deployment

Canary deployment across clusters:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: canary-deployment
spec:
  generators:
    - list:
        elements:
          - canary: "true"
            percentage: "10"
          - canary: "false"
            percentage: "100"

  template:
    metadata:
      name: "my-app-{{ canary }}"
    spec:
      source:
        repoURL: https://github.com/company/apps.git
        helm:
          parameters:
            - name: trafficPercentage
              value: "{{ percentage }}"
      destination:
        namespace: default
```

## Advanced Features

### Templating

Use variables from generators:

```yaml
template:
  metadata:
    name: "{{ appName }}-{{ env }}"
    labels:
      environment: "{{ env }}"
      team: "{{ team }}"
  spec:
    source:
      repoURL: "{{ repoUrl }}"
      path: "apps/{{ appName }}/{{ env }}"
```

### Nested Templating

Template within templates:

```yaml
source:
  helm:
    valuesObject:
      image:
        repository: "{{ registry }}/{{ imageName }}"
        tag: "{{ imageTag }}"
```

### Selector Matching

Filter generator results:

```yaml
generators:
  - clusters:
      selector:
        matchLabels:
          environment: production
          region: us-east
      matchExpressions:
        - key: tier
          operator: In
          values:
            - web
            - api
```

## Synchronization Strategies

### Individual ApplicationSet Control

Each generated Application gets its own sync policy:

```yaml
template:
  spec:
    syncPolicy:
      automated:
        prune: true
        selfHeal: true
      retry:
        limit: 5
```

### Progressive Rollout

Different sync policies for different applications:

```yaml
template:
  spec:
    syncPolicy:
      automated:
        # Only auto-sync non-production
        selfHeal: "{{ environment != 'production' }}"
      syncOptions:
        - CreateNamespace=true
```

## Scale and Performance

### Managing Many Applications

ApplicationSet can generate hundreds of applications:

```yaml
# Example: 1000+ apps from 30 repos
generators:
  - scmProvider:
      github:
        organization: large-company
        # Will create 1000+ applications automatically
```

### Performance Considerations

- Repository Server caches manifest generation
- Webhook-driven updates (not polling)
- Parallel syncs when enabled
- Supports horizontal scaling

## Best Practices

✅ **Use generators** - Don't manually manage applications
✅ **Template effectively** - Minimize duplication
✅ **Use consistent naming** - Easy identification
✅ **Selector carefully** - Avoid unexpected applications
✅ **Test templates** - Verify generated applications
✅ **Monitor generation** - Check ApplicationSet status

```bash
# View generated applications
argocd appset get my-appset

# Watch generation
argocd appset watch my-appset

# Get as JSON
argocd appset get my-appset -o json
```

## Troubleshooting

### Applications Not Generated

Check generator configuration:

```bash
# Describe ApplicationSet
kubectl describe applicationset my-appset -n argocd

# Check generator errors
kubectl get applicationset my-appset -o yaml
```

### Unexpected Applications

Verify selector/directory matching:

```bash
# List all clusters (for cluster generator)
argocd cluster list

# Check Git repo structure (for git generator)
git ls-tree -r --name-only HEAD
```

## See Also

- [Key Features](../04-key-features.md) - ApplicationSet in context of key features
- [Applications Overview](./applications-overview.md) - Individual Application management
- [Official Documentation](https://argo-cd.readthedocs.io/en/stable/user-guide/application-set/) - Complete reference
