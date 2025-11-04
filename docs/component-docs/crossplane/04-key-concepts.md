---
id: key-concepts
title: Key Concepts
description: Deep dive into Crossplane's key concepts - Composition, Managed Resources, Operations, and the Package Manager
---

This document provides an in-depth exploration of Crossplane's core components and concepts that enable platform engineers to build sophisticated infrastructure control planes.

## Composition: Building Custom Infrastructure APIs

### Overview

Composition is the process of combining multiple Managed Resources (or other resources) into a higher-level infrastructure API. Instead of forcing users to understand and manage individual cloud resources, you compose them into logical abstractions.

### Composition Functions

Composition functions are the modern approach to defining how composite resources become managed resources. They form a pipeline:

```
User creates XR → Function 1 (transform) → Function 2 (add defaults) → ... → Managed Resources
```

**Key capabilities**:

- **Multi-language support** - Go, Python, or template-based
- **Reusable** - Package and share functions across teams
- **Composable** - Chain multiple functions together
- **Stateless** - Functions are idempotent and deterministic

### Composition Patching

Patching allows you to map values from a Composite Resource to Managed Resources:

```yaml
patches:
  - fromFieldPath: spec.region
    toFieldPath: spec.forProvider.region

  - fromFieldPath: spec.size
    transforms:
      - type: map
        map:
          small: t3.small
          medium: t3.medium
          large: t3.large
    toFieldPath: spec.forProvider.instanceType
```

### Policy-based Composition

Compositions support conditional logic through policy engines:

- **What-if scenarios** - Determine which managed resources to create based on inputs
- **Multi-region** - Create resources in different regions based on configuration
- **Cost optimization** - Select instance types or providers based on cost policies
- **Compliance** - Enforce organizational policies in composition logic

## Managed Resources: Cloud Resource Abstraction

### What are Managed Resources?

Managed Resources (MRs) are Kubernetes custom resources that represent cloud provider resources. Each Crossplane provider publishes their own set of MRs.

Examples:

- AWS provider: `Instance`, `DBInstance`, `SecurityGroup`, `Bucket`, etc.
- Azure provider: `ResourceGroup`, `VirtualMachine`, `SQLServer`, etc.
- GCP provider: `Instance`, `CloudSQLInstance`, `StorageBucket`, etc.

### Managed Resource Lifecycle

Every Managed Resource follows a lifecycle:

1. **Pending** - Resource created, waiting for provider controller to process
2. **Creating** - Provider controller initiating cloud resource creation
3. **Updating** - Changes detected, provider controller applying patches
4. **Ready** - Cloud resource exists and is healthy
5. **Deleting** - Resource marked for deletion, waiting for cleanup
6. **Deleted** - Cloud resource cleaned up, Kubernetes resource removed

### Drift Detection and Correction

Crossplane continuously monitors managed resources for drift:

- **Detection** - Periodically reads cloud resource state
- **Comparison** - Compares actual state vs. desired state from Kubernetes
- **Correction** - If drift detected, applies patches to bring back to desired state
- **Observability** - Reports drift through conditions and status

This ensures infrastructure remains in the desired state even if changes are made outside of Crossplane.

### Cross-Resource Dependencies

Managed resources can reference other resources:

```yaml
# Database instance depends on security group
spec:
  forProvider:
    vpcSecurityGroupIds:
      - ${securityGroup.status.atProvider.id}
```

Crossplane automatically:

- Determines creation order based on dependencies
- Waits for referenced resources to become ready
- Updates references as resources are created
- Handles cascading deletes

## Operations: Infrastructure Automation

### CronOperations

CronOperations allow you to schedule automation tasks on cloud resources:

```yaml
apiVersion: ops.crossplane.io/v1beta1
kind: CronOperation
metadata:
  name: daily-backup
spec:
  schedule: "0 2 * * *" # 2 AM daily
  resourceRef:
    apiVersion: database.example.com/v1
    kind: Database
    name: production-db
  operations:
    - type: CreateSnapshot
      parameters:
        retentionDays: 7
```

**Use cases**:

- Scheduled backups of databases
- Periodic scaling operations
- Resource cleanup and maintenance
- Report generation and exports

### WatchOperations

WatchOperations trigger automation based on resource state changes:

```yaml
apiVersion: ops.crossplane.io/v1beta1
kind: WatchOperation
metadata:
  name: auto-heal-database
spec:
  resourceRef:
    apiVersion: database.example.com/v1
    kind: Database
    name: production-db
  triggers:
    - when: status.health == "Unhealthy"
      operation:
        type: Restart
```

**Use cases**:

- Auto-remediation of unhealthy resources
- Cascading updates based on dependency changes
- Event-driven infrastructure automation
- Cost optimization triggers

### Operation Targets

Operations can target:

- **Individual resources** - Specific composite or managed resource
- **Resource sets** - Multiple resources matching a selector
- **Composite resources** - All managed resources within a composite

## Package Manager: Distribution and Reusability

### Packages

Packages are distributions of Crossplane configurations, compositions, and functions:

### Configuration Packages

Configuration packages bundle together:

- Composite Resource Definitions (XRDs)
- Compositions
- Documentation
- Providers and their configurations

Benefits:

- **Reusability** - Share infrastructure APIs across teams and organizations
- **Versioning** - Track changes and provide upgrade paths
- **Dependency management** - Declare and resolve dependencies
- **Community sharing** - Contribute to and consume community packages

### Function Packages

Function packages contain composition functions:

- **Templating functions** - Go templating or KCL-based logic
- **Patching functions** - Transform and patch resources
- **Validation functions** - Validate inputs before provisioning
- **Custom logic functions** - Go or Python implementations

### Package Distribution

Packages can be distributed through:

- **Package registries** - Central package repositories
- **Git repositories** - Direct consumption from GitHub, GitLab
- **Container registries** - Docker registries for function images
- **Private registries** - Enterprise package repositories

## Integration Patterns

### With Kubernetes Operators

Crossplane works alongside Kubernetes operators:

```
Kubernetes Operator (manages app lifecycle)
         ↓ (needs)
Application Configuration Secret
         ↓ (references)
Crossplane Composite Resource (provisions infrastructure)
         ↓ (creates)
Cloud Resources
```

### With GitOps

Crossplane integrates with GitOps operators (Argo CD, Flux):

- Composite resources defined in Git
- GitOps operator deploys changes
- Crossplane reconciles infrastructure
- Single source of truth for infrastructure

### With Policy Engines

Crossplane composes with policy engines like Kyverno and OPA:

- **Creation policies** - Validate composite resources before creation
- **Mutation policies** - Inject defaults or enforce standards
- **Audit policies** - Log all infrastructure changes
- **Compliance policies** - Ensure infrastructure meets requirements

## Advanced Composition Scenarios

### Multi-cloud Infrastructure

Compositions can provision resources across clouds:

```
User requests "WebApp" → Composition:
  - Creates App on AWS Lambda
  - Creates Database on Azure SQL
  - Creates CDN on Google Cloud CDN
  - Configures DNS and networking
```

### Self-healing Infrastructure

Compositions with watch operations provide self-healing:

```
Resource becomes Unhealthy → WatchOperation triggered →
  Remediation function determines issue →
  Applies corrective patches → Resource heals
```

### Progressive Delivery

Crossplane integrates with progressive delivery systems:

```
New version staged → Crossplane provisions → Canary validation →
  Progressive traffic shift → Full rollout (coordinated with Flagger)
```

### Cost Optimization

Compositions can implement cost optimization:

```
Composition detects:
  - Off-peak hours → Auto-scale down
  - Spot price drops → Migrate to spot instances
  - Resource underutilization → Resize downward
  - Bulk discount available → Consolidate resources
```

## Composition vs. Templates

### Why not just templates?

While templates are simpler, compositions are more powerful:

| Aspect         | Templates           | Compositions              |
| -------------- | ------------------- | ------------------------- |
| Logic          | Simple substitution | Complex functions         |
| Reusability    | Limited             | High (packaged functions) |
| Validation     | Manual              | Built-in policy support   |
| Error handling | Manual              | Automatic                 |
| Testing        | Difficult           | Supported by framework    |
| Updates        | Re-render all       | Incremental patches       |

Crossplane's composition functions are the recommended modern approach.

## Best Practices

### 1. **Composition Design**

- Keep compositions focused on a single infrastructure abstraction
- Use multiple functions for different concerns (validation, transformation, defaults)
- Version compositions for backward compatibility

### 2. **Managed Resource Usage**

- Understand provider-specific quirks and behaviors
- Use provider configurations to manage credentials and defaults
- Monitor for provider API changes

### 3. **Operations Management**

- Use CronOperations for scheduled maintenance
- Implement WatchOperations for critical resource monitoring
- Log all operations for audit trails

### 4. **Package Management**

- Version all packages semantically (MAJOR.MINOR.PATCH)
- Document package capabilities and requirements
- Test packages before publishing

### 5. **Multi-cloud Strategy**

- Abstract provider differences in compositions
- Use composition functions to implement cloud-specific logic
- Plan for provider portability

## Learning Resources

- **[Official Composition Docs](https://docs.crossplane.io/latest/concepts/compositions/)** - Comprehensive composition guide
- **[Managed Resources Guide](https://docs.crossplane.io/latest/concepts/managed-resources/)** - Deep dive on MRs
- **[Crossplane Examples](https://github.com/crossplane/crossplane/tree/master/examples)** - Real-world examples
- **[Community Functions](https://marketplace.upbound.io/)** - Published composition functions
