---
id: sync-strategies-overview
title: Sync Strategies and Deployment Patterns
description: Different deployment strategies and synchronization approaches for Argo CD applications
---

Argo CD supports multiple synchronization and deployment strategies to match different operational requirements, risk profiles, and deployment patterns.

## Synchronization Strategies

### Automated Sync

Argo CD automatically deploys changes when Git is updated:

```yaml
syncPolicy:
  automated:
    prune: true # Delete removed resources
    selfHeal: true # Sync on drift detection
    allowEmpty: false # Reject empty manifests
```

**When to use**:

- Development/testing environments
- Teams with high trust and low risk
- Fast-moving projects
- Non-critical applications

**Advantages**:

- ✅ Latest changes always deployed
- ✅ No manual intervention needed
- ✅ Automatic drift correction
- ✅ Fast deployment pipeline

**Disadvantages**:

- ❌ Bugs deployed automatically
- ❌ No approval gate
- ❌ Difficult to control in production

### Manual Sync

Requires explicit approval before deployment:

```yaml
# No automated sync configured
syncPolicy: {}

# Manually trigger
argocd app sync my-app
```

**When to use**:

- Production environments
- High-risk deployments
- Regulated industries
- Blue-team/change control processes

**Advantages**:

- ✅ Full control over deployments
- ✅ Approval gates possible
- ✅ Prevents accidental deployments
- ✅ Production-safe

**Disadvantages**:

- ❌ Manual overhead
- ❌ Delayed deployments
- ❌ Can lag behind Git

### Hybrid Approach

Auto-sync for non-production, manual for production:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app-dev
spec:
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
---
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app-prod
spec:
  syncPolicy: {} # Manual sync only
```

## Deployment Patterns

### Blue-Green Deployment

Run two identical production environments:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: blue-green
spec:
  generators:
    - list:
        elements:
          - color: blue
            weight: 100 # All traffic to blue
          - color: green
            weight: 0 # No traffic to green

  template:
    metadata:
      name: "my-app-{{ color }}"
    spec:
      source:
        repoURL: https://github.com/company/apps.git
        path: my-app
        helm:
          parameters:
            - name: trafficWeight
              value: "{{ weight }}"
            - name: environmentColor
              value: "{{ color }}"
      destination:
        namespace: production
```

**Deployment process**:

1. Deploy new version to green environment
2. Test green environment (all traffic on blue)
3. Switch traffic from blue to green
4. Keep blue as fallback

**Advantages**:

- ✅ Zero-downtime deployments
- ✅ Easy rollback (switch back to blue)
- ✅ Full testing before traffic switch
- ✅ Minimal traffic loss

**Disadvantages**:

- ❌ Double infrastructure cost
- ❌ Database migration complexity
- ❌ Storage usage doubled

### Canary Deployment

Gradually roll out to small percentage of users:

```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: my-app
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  progressDeadlineSeconds: 60
  service:
    port: 80
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50 # Max traffic to canary
    stepWeight: 5 # Traffic increase per step
    metrics:
      - name: request-success-rate
        thresholdRange:
          min: 99
        interval: 1m
      - name: request-duration
        thresholdRange:
          max: 500
        interval: 1m
```

**Deployment process**:

1. Deploy new version alongside old
2. Route small percentage to new version (5%)
3. Monitor metrics (error rate, latency)
4. Gradually increase traffic (5% → 10% → ... → 100%)
5. Roll back if metrics degrade

**Advantages**:

- ✅ Early detection of issues
- ✅ Gradual rollout reduces risk
- ✅ Automatic rollback on errors
- ✅ Real-world testing with real traffic

**Disadvantages**:

- ❌ Complex setup and monitoring
- ❌ Longer deployment time
- ❌ Requires good metrics/alerts
- ❌ Database compatibility required

### Rolling Deployment

Gradually replace pods during update:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1 # One extra pod during update
      maxUnavailable: 0 # Zero pods unavailable
  template:
    spec:
      containers:
        - name: app
          image: myapp:v1.2.3
```

**Deployment process**:

1. Start new pod with new version
2. Wait for readiness
3. Remove old pod
4. Repeat for each pod

**Advantages**:

- ✅ Simple, Kubernetes native
- ✅ Zero-downtime deployment
- ✅ Easy rollback
- ✅ No extra infrastructure

**Disadvantages**:

- ❌ Multiple versions running simultaneously
- ❌ Database compatibility required
- ❌ Limited control over rollout speed

### Recreate Deployment

Stop all pods, then start new version:

```yaml
spec:
  strategy:
    type: Recreate # Stop all, then start new
```

**Deployment process**:

1. Stop all running pods
2. Wait for graceful shutdown
3. Start new pods with new version

**Advantages**:

- ✅ Simple, fast
- ✅ Only one version running
- ✅ No version compatibility issues

**Disadvantages**:

- ❌ Downtime during deployment
- ❌ No traffic during update
- ❌ Not suitable for high-availability

## Advanced Sync Patterns

### Selective Sync

Sync only specific resources instead of entire application:

```bash
# Sync only Deployment resource
argocd app sync my-app --resource=Deployment/my-app

# Sync multiple specific resources
argocd app sync my-app \
  --resource=Deployment/my-app \
  --resource=Service/my-app
```

**Use cases**:

- Configuration-only changes
- Urgent hotfixes
- Testing partial deployments

### Partial Sync

Sync only affected resources based on Git changes:

```yaml
syncPolicy:
  syncOptions:
    - PartialSyncEnabled=true
```

Only resources with Git changes are synced, not entire application.

### Dry-run Sync

Preview changes before applying:

```bash
# See what would change
argocd app sync my-app --dry-run

# See detailed diff
argocd app diff my-app
```

### Sync Waves

Control deployment order with waves:

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
    argocd.argoproj.io/sync-wave: "2" # Deploy third (post-sync hook)
```

**Use cases**:

- Database migrations before app deployment
- Configuration setup before services
- Health checks after deployment
- Ordered resource creation

### Sync Hooks

Execute custom logic during sync:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pre-sync-hook
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/hook-phase: Sync
    argocd.argoproj.io/hook-type: Backup
spec:
  containers:
    - name: backup
      image: mysql:latest
      command:
        - /bin/sh
        - -c
        - mysqldump -u root -p$MYSQL_PASSWORD > /tmp/backup.sql
```

**Hook types**:

- **PreSync** - Before resources applied (e.g., backup)
- **Sync** - During application (e.g., waiting)
- **PostSync** - After resources applied (e.g., tests)
- **SyncFail** - On sync failure (e.g., alert)

## Progressive Delivery Patterns

### Flagger Integration

Use Flagger for automated canary analysis:

```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: my-app
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app

  # Argo CD watches this metric
  analysis:
    metrics:
      - name: request-success-rate
        query: 'rate(http_requests_total{job="my-app"}[5m])'
        thresholdRange:
          min: 99
      - name: request-duration
        query: 'histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{job="my-app"}[5m]))'
        thresholdRange:
          max: 500
```

### Traffic Management

Use service mesh for traffic splitting:

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app
spec:
  hosts:
    - my-app
  http:
    - match:
        - sourceLabels:
            canary: "true"
      route:
        - destination:
            host: my-app
            subset: v2
          weight: 100
      timeout: 30s
    - route:
        - destination:
            host: my-app
            subset: v1
          weight: 95
        - destination:
            host: my-app
            subset: v2
          weight: 5
      timeout: 30s
```

## Multi-environment Strategies

### Environment Promotion

Promote through environments with different sync settings:

```yaml
# Development - automated
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app-dev
spec:
  source:
    targetRevision: develop
  syncPolicy:
    automated:
      prune: true
      selfHeal: true

---
# Staging - automated (from staging branch)
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app-staging
spec:
  source:
    targetRevision: staging
  syncPolicy:
    automated:
      prune: true
      selfHeal: false

---
# Production - manual only
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app-prod
spec:
  source:
    targetRevision: main
  syncPolicy: {} # Manual sync only
```

## Choosing a Strategy

| Strategy       | Best For               | Risk     | Complexity |
| -------------- | ---------------------- | -------- | ---------- |
| **Automated**  | Development/testing    | High     | Low        |
| **Manual**     | Production/regulated   | Low      | Low        |
| **Rolling**    | High-availability apps | Medium   | Low        |
| **Blue-green** | Zero-downtime critical | Low      | Medium     |
| **Canary**     | High-risk deployments  | Very Low | High       |
| **Recreate**   | Non-critical apps      | High     | Low        |

## Best Practices

✅ **Automate where safe** - Dev/staging can use auto-sync
✅ **Gate production** - Manual sync or approval gates
✅ **Use dry-run first** - Verify changes before applying
✅ **Monitor health** - Watch metrics during deployment
✅ **Have rollback plan** - Know how to revert
✅ **Test thoroughly** - Catch issues before production
✅ **Document strategy** - Make deployment process clear
✅ **Use sync waves** - Control deployment order
✅ **Implement hooks** - Custom logic when needed
✅ **Progressive rollout** - Start small, gradually increase

## See Also

- [Key Features](../04-key-features.md) - Sync policies in context
- [Applications Overview](./applications-overview.md) - Application-level sync control
- [Official Documentation](https://argo-cd.readthedocs.io/en/stable/user-guide/sync-waves/) - Complete reference
