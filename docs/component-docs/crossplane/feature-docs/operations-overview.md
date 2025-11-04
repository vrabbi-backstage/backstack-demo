---
id: operations-overview
title: Operations
description: Automate operational tasks on cloud resources using Crossplane Operations
---

Operations enable you to automate operational tasks on cloud resources. They allow you to schedule maintenance, respond to events, and trigger automation based on resource state changes.

## What are Operations?

Operations are Crossplane abstractions that automate tasks on managed resources:

- **CronOperations** - Schedule tasks at specific times (backups, scaling, maintenance)
- **WatchOperations** - Trigger tasks when resources reach certain states (auto-healing, scaling)

Operations work with both Composite Resources and Managed Resources.

## CronOperations: Scheduled Automation

### Overview

CronOperations run automation tasks on a schedule, just like cron jobs in Linux.

### Basic Example

```yaml
apiVersion: ops.crossplane.io/v1beta1
kind: CronOperation
metadata:
  name: daily-backup
spec:
  schedule: "0 2 * * *" # 2 AM UTC every day
  resourceRef:
    apiVersion: database.example.com/v1
    kind: Database
    name: production-db
  operations:
    - type: CreateSnapshot
      parameters:
        retentionDays: 7
```

### Schedule Format

Uses standard cron syntax:

```
0 2 * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0=Sunday, 6=Saturday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)

# Examples:
"0 2 * * *"      # 2 AM every day
"0 0 * * 0"      # Midnight every Sunday
"0 * * * *"      # Every hour
"*/30 * * * *"   # Every 30 minutes
"0 0 1 * *"      # First day of month
```

### Common Use Cases

#### Daily Backups

```yaml
apiVersion: ops.crossplane.io/v1beta1
kind: CronOperation
metadata:
  name: db-backup
spec:
  schedule: "0 3 * * *" # 3 AM daily
  resourceRef:
    apiVersion: rds.aws.crossplane.io/v1beta1
    kind: DBInstance
    name: production-db
  operations:
    - type: CreateDBSnapshot
      parameters:
        dBSnapshotIdentifier: "backup-$(date +%Y%m%d)"
        tags:
          Retention: "30days"
```

#### Weekly Maintenance Windows

```yaml
apiVersion: ops.crossplane.io/v1beta1
kind: CronOperation
metadata:
  name: maintenance-window
spec:
  schedule: "0 2 * * 0" # 2 AM every Sunday
  resourceRef:
    apiVersion: rds.aws.crossplane.io/v1beta1
    kind: DBInstance
    name: production-db
  operations:
    - type: ModifyDBInstance
      parameters:
        preferredMaintenanceWindow: "sun:02:00-sun:03:00"
        applyImmediately: true
```

#### Monthly Scaling Reviews

```yaml
apiVersion: ops.crossplane.io/v1beta1
kind: CronOperation
metadata:
  name: monthly-scaling-check
spec:
  schedule: "0 0 1 * *" # First day of month
  resourceRef:
    apiVersion: database.example.com/v1
    kind: Database
  operations:
    - type: AnalyzeAndRecommend
      parameters:
        metricName: CPU
        threshold: 80
```

## WatchOperations: Event-driven Automation

### Overview

WatchOperations respond to state changes in resources. When a resource reaches a certain state, the operation triggers.

### Basic Example

```yaml
apiVersion: ops.crossplane.io/v1beta1
kind: WatchOperation
metadata:
  name: auto-heal
spec:
  resourceRef:
    apiVersion: database.example.com/v1
    kind: Database
    name: production-db
  triggers:
    - when: status.health == "Unhealthy"
      operation:
        type: RestartDatabase
        parameters:
          retryCount: 3
      backoff:
        initialDelay: 30s
        maxDelay: 5m
```

### Trigger Conditions

Conditions can reference any status field:

```yaml
triggers:
  # Resource unhealthy
  - when: status.phase == "Unhealthy"

  # CPU too high
  - when: status.metrics.cpu.percentage > 80

  # Disk filling up
  - when: status.storage.used / status.storage.total > 0.9

  # Any condition
  - when: status.conditions[Ready] == False

  # Multiple conditions
  - when: status.phase == "Degraded" && status.replicasAvailable < 2
```

### Common Use Cases

#### Auto-healing Unhealthy Resources

```yaml
apiVersion: ops.crossplane.io/v1beta1
kind: WatchOperation
metadata:
  name: auto-heal-instance
spec:
  resourceRef:
    apiVersion: ec2.aws.crossplane.io/v1beta1
    kind: Instance
    name: web-server
  triggers:
    - when: status.state == "stopped"
      operation:
        type: StartInstance
        parameters:
          ignoreErrors: false
```

#### Auto-scaling Based on Metrics

```yaml
apiVersion: ops.crossplane.io/v1beta1
kind: WatchOperation
metadata:
  name: auto-scale-up
spec:
  resourceRef:
    apiVersion: database.example.com/v1
    kind: Database
  triggers:
    - when: status.metrics.connections > status.maxConnections * 0.9
      operation:
        type: ScaleUp
        parameters:
          newInstanceType: "larger-tier"
          stopOldInstance: false # Keep for fallback
```

#### Cascading Updates

```yaml
apiVersion: ops.crossplane.io/v1beta1
kind: WatchOperation
metadata:
  name: cascade-updates
spec:
  resourceRef:
    apiVersion: apiextensions.crossplane.io/v1
    kind: CompositeResource
    name: my-app
  triggers:
    - when: status.state == "Ready"
      operation:
        type: UpdateDependents
        parameters:
          updatePolicies: []
          restartServices: true
```

#### Cost Optimization

```yaml
apiVersion: ops.crossplane.io/v1beta1
kind: WatchOperation
metadata:
  name: cost-optimization
spec:
  resourceRef:
    apiVersion: ec2.aws.crossplane.io/v1beta1
    kind: Instance
    name: compute-instance
  triggers:
    # If running idle
    - when: status.metrics.cpu.average < 5 && status.metrics.network.bytes < 100000
      operation:
        type: MigrateToSpotInstance
        parameters:
          spotPrice: "0.05"
```

## Operation Targets

### Single Resource

Target a specific resource:

```yaml
resourceRef:
  apiVersion: database.example.com/v1
  kind: Database
  name: production-db
```

### Resource Selector

Target multiple resources matching criteria:

```yaml
resourceSelector:
  matchLabels:
    environment: production
    tier: database
```

### Composite Resources

Target all managed resources within a composite:

```yaml
compositeResourceRef:
  apiVersion: application.example.com/v1
  kind: App
  name: my-app
```

## Advanced Features

### Backoff and Retry Strategies

Control how operations retry:

```yaml
operation:
  type: RestartDatabase
  backoff:
    initialDelay: 10s # First retry after 10s
    maxDelay: 5m # Max wait between retries
    backoffMultiplier: 2 # Double each time (10s, 20s, 40s...)
  maxRetries: 5
```

### Conditional Operations

Chain multiple operations with conditions:

```yaml
triggers:
  - when: status.health == "Unhealthy"
    operations:
      - type: Restart
        condition: status.restartCount < 3
      - type: Failover
        condition: status.restartCount >= 3
      - type: PagerDutyAlert
        condition: status.failoverCount > 0
```

### Pre and Post Hooks

Run operations before and after main operation:

```yaml
operation:
  type: UpdateDatabase
  preHooks:
    - type: CreateBackup
      parameters:
        backupName: pre-update-backup
  postHooks:
    - type: RunTests
      parameters:
        testSuite: health-check
    - type: NotifySlack
      parameters:
        channel: "#infrastructure"
```

## Observability

### Operation Status

Track operation execution:

```yaml
status:
  lastExecution:
    time: "2024-11-04T02:00:00Z"
    result: Success
    duration: 45s
  nextExecution: "2024-11-05T02:00:00Z"
  totalExecutions: 30
  failedExecutions: 1
```

### Events

Kubernetes events track operation execution:

```
kubectl describe cronoperation daily-backup

Events:
  Type    Reason           Message
  ----    ------           -------
  Normal  OperationStart   Operation started at 2024-11-04T02:00:00Z
  Normal  OperationSuccess Operation completed successfully in 45s
```

### Metrics

Crossplane exports operation metrics:

- `crossplane_operation_execution_duration_seconds`
- `crossplane_operation_success_total`
- `crossplane_operation_failure_total`

## Best Practices

### 1. Start Simple

Begin with basic CronOperations for routine tasks:

```yaml
# Before adding complex WatchOperations
spec:
  schedule: "0 2 * * *"
  operations:
    - type: CreateSnapshot
```

### 2. Use Appropriate Backoff

Balance between quick recovery and excessive retries:

```yaml
# For transient issues: fast retry
backoff:
  initialDelay: 5s
  maxDelay: 1m

# For infrastructure issues: slower retry
backoff:
  initialDelay: 1m
  maxDelay: 1h
```

### 3. Monitor Operation Health

Track operation success rates and failures:

```bash
# Check operation status
kubectl get cronoperations
kubectl describe cronoperation daily-backup

# Check operation logs
kubectl logs deployment/crossplane -f | grep operation
```

### 4. Use WatchOperations Carefully

WatchOperations can cause rapid re-execution. Add guards:

```yaml
triggers:
  - when: status.phase == "Unhealthy"
    operation:
      maxRetries: 3
      backoff:
        maxDelay: 10m # Don't retry too frequently
```

### 5. Document Operation Intentions

Add annotations to clarify purpose:

```yaml
metadata:
  annotations:
    description: "Backup critical production database daily"
    owner: "platform-team"
    runbook: "https://wiki.internal/operations/backups"
```

## See Also

- [System Model](../03-system-model.md) - Understand operations' role
- [Key Concepts](../04-key-concepts.md) - Advanced operation patterns
- [Crossplane Operations Documentation](https://docs.crossplane.io/latest/concepts/operations/) - Official docs
