---
id: managed-resources-overview
title: Managed Resources
description: Manage cloud resources through Kubernetes using Crossplane Managed Resources
---

Managed Resources (MRs) are the foundation of Crossplane's infrastructure abstraction. They represent cloud provider resources as Kubernetes custom resources.

## What are Managed Resources?

Managed Resources are Kubernetes representations of cloud resources. Each Crossplane provider publishes Managed Resource types for resources it supports.

**Examples**:

- AWS: `Instance`, `DBInstance`, `SecurityGroup`, `S3Bucket`, `LoadBalancer`
- Azure: `ResourceGroup`, `VirtualMachine`, `SQLServer`, `StorageAccount`
- GCP: `Instance`, `CloudSQLInstance`, `StorageBucket`, `ServiceAccount`

## Why Use Managed Resources?

### Traditional Cloud Management

```
Write code → Call cloud SDK → Handle errors → Parse responses → Update app state
```

### With Crossplane Managed Resources

```
Write YAML → Create resource → Kubernetes reconciles → Status is always current
```

Benefits:
✅ **Declarative** - Define desired state, Crossplane ensures it happens
✅ **Consistent** - Cloud and Kubernetes use same paradigms
✅ **Familiar tools** - Use kubectl and GitOps tooling
✅ **Automatic reconciliation** - Crossplane fixes drift automatically
✅ **Native integration** - Works with RBAC, networking, and all Kubernetes features

## Managed Resource Anatomy

### Resource Specification

```yaml
apiVersion: ec2.aws.crossplane.io/v1beta1
kind: Instance
metadata:
  name: my-instance
spec:
  forProvider:
    region: us-east-1
    instanceType: t3.medium
    keyName: my-key
    subnetId: subnet-12345
    securityGroupIds:
      - sg-12345
  providerConfigRef:
    name: aws-provider
```

**Key sections**:

- `apiVersion` - Provider-specific resource API
- `spec.forProvider` - Cloud-provider specific configuration
- `spec.providerConfigRef` - Credentials and configuration for this provider

### Resource Status

```yaml
status:
  conditions:
    - type: Ready
      status: "True"
      reason: "Available"
    - type: Synced
      status: "True"
  atProvider:
    instanceId: i-0123456789abcdef
    state: running
    privateIpAddress: 10.0.0.5
    publicIpAddress: 54.123.45.67
  observedGeneration: 1
```

**Key fields**:

- `conditions` - Resource health and status
- `atProvider` - Actual cloud resource properties
- `observedGeneration` - Last reconciliation generation

## Managed Resource Lifecycle

### 1. Creation

When you create a Managed Resource:

```
Create → Provider controller watches → Calls cloud API → Cloud resource created → Status updated
```

```yaml
kubectl apply -f instance.yaml
# Status becomes:
# status.conditions[Ready] = False (Creating)
# (waiting for actual cloud resource)

# Minutes later:
# status.conditions[Ready] = True (Available)
# status.atProvider.instanceId = i-1234567890
```

### 2. Updates

When you modify a Managed Resource:

```
Edit YAML → kubectl apply → Provider compares desired vs actual → Patches cloud resource
```

Crossplane intelligently patches only what changed:

```yaml
# Original
spec.forProvider.tags:
  Name: my-instance

# Updated
spec.forProvider.tags:
  Name: my-instance-v2
  Environment: production

# Provider applies only the tag changes
```

### 3. Monitoring

Crossplane continuously monitors cloud resources:

```
Poll cloud API → Compare actual state vs desired state →
  If different: patch resources → Report through status
```

This prevents configuration drift where manual changes through cloud console deviate from the Kubernetes manifest.

### 4. Deletion

When you delete a Managed Resource:

```
Delete → Set deletion policy → Remove finalizers → Cloud resource cleanup
```

Deletion policies determine what happens to the cloud resource:

```yaml
spec:
  deletionPolicy: Delete        # Delete cloud resource
  # OR
  deletionPolicy: Orphan        # Leave cloud resource running
```

## Provider Configuration

Managed Resources need provider credentials. This is configured through `ProviderConfig`:

```yaml
apiVersion: aws.crossplane.io/v1beta1
kind: ProviderConfig
metadata:
  name: aws-provider
spec:
  credentials:
    source: Secret
    secretRef:
      namespace: crossplane-system
      name: aws-credentials
      key: creds
```

Multiple configurations support:

- Different cloud accounts
- Different regions as defaults
- Different credential types (IAM role, credentials, OIDC)

## Dependencies Between Resources

Managed Resources can reference each other:

```yaml
---
# VPC
apiVersion: ec2.aws.crossplane.io/v1beta1
kind: VPC
metadata:
  name: my-vpc
spec:
  forProvider:
    region: us-east-1
---
# Subnet references VPC
apiVersion: ec2.aws.crossplane.io/v1beta1
kind: Subnet
metadata:
  name: my-subnet
spec:
  forProvider:
    region: us-east-1
    vpcId: ${my-vpc.status.atProvider.vpcId} # Reference other resource
```

Crossplane automatically:

- Determines creation order (VPC first, then subnet)
- Waits for dependencies to be ready
- Updates references with actual resource IDs

## Cross-Region and Multi-Account

### Same account, different regions

```yaml
apiVersion: ec2.aws.crossplane.io/v1beta1
kind: Instance
metadata:
  name: instance-us-east
spec:
  forProvider:
    region: us-east-1
---
apiVersion: ec2.aws.crossplane.io/v1beta1
kind: Instance
metadata:
  name: instance-us-west
spec:
  forProvider:
    region: us-west-2
```

### Different accounts

```yaml
---
apiVersion: aws.crossplane.io/v1beta1
kind: ProviderConfig
metadata:
  name: aws-prod
spec:
  credentials:
    source: Secret
    secretRef:
      name: prod-credentials
---
apiVersion: aws.crossplane.io/v1beta1
kind: ProviderConfig
metadata:
  name: aws-dev
spec:
  credentials:
    source: Secret
    secretRef:
      name: dev-credentials
---
apiVersion: ec2.aws.crossplane.io/v1beta1
kind: Instance
metadata:
  name: prod-instance
spec:
  providerConfigRef:
    name: aws-prod
---
apiVersion: ec2.aws.crossplane.io/v1beta1
kind: Instance
metadata:
  name: dev-instance
spec:
  providerConfigRef:
    name: aws-dev
```

## Managed Resource Patterns

### Read-only Resources

Some resources are read-only (you observe cloud state but don't create):

```yaml
apiVersion: ec2.aws.crossplane.io/v1beta1
kind: VPC
metadata:
  name: existing-vpc
spec:
  managementPolicy: Observe # Just watch, don't create
  forProvider:
    vpcId: vpc-12345
```

### Import Existing Resources

Use management policies to import existing resources:

```yaml
spec:
  managementPolicy: Import
  # Crossplane will adopt the resource
```

### Multi-cloud Pattern

Use different providers for different resources:

```yaml
---
# Database on AWS
apiVersion: rds.aws.crossplane.io/v1beta1
kind: DBInstance
spec:
  forProvider:
    engine: postgres
---
# Cache on Azure (for licensing reasons)
apiVersion: cache.azure.crossplane.io/v1beta1
kind: Redis
spec:
  forProvider:
    location: eastus
---
# DNS on GCP (best pricing)
apiVersion: dns.gcp.crossplane.io/v1beta1
kind: DNSRecordSet
spec:
  forProvider:
    zone: my-zone
```

## Observability

### Status Conditions

Monitor resource health through conditions:

```yaml
status.conditions:
  - type: Ready
    status: "True"
    reason: "Available"
    message: "Resource is ready"

  - type: Synced
    status: "True"
    reason: "ReconcileSuccess"
```

### Events

Kubernetes events track state transitions:

```
kubectl describe instance my-instance

Events:
  Type    Reason           Message
  ----    ------           -------
  Normal  CreatedProvider  Successfully created provider instance
  Normal  ResourceReady    Resource became ready
```

### Metrics

Crossplane providers expose Prometheus metrics:

- `crossplane_managed_resource_create_duration_seconds`
- `crossplane_managed_resource_update_duration_seconds`
- `crossplane_managed_resource_status_update_duration_seconds`

## Best Practices

### 1. Use Compositions for Abstractions

Don't expose Managed Resources directly to users; compose them:

```yaml
# ❌ Don't do this
spec.forProvider:
  subnetId: subnet-12345
  securityGroupIds: [sg-1, sg-2, sg-3]
  iamInstanceProfile: arn:aws:iam::...

# ✅ Do this - hide complexity in composition
spec.environment: production
```

### 2. Use Provider Configurations Wisely

Centralize provider config management:

```yaml
# One ProviderConfig per AWS account/region
# Managed Resources reference them
spec:
  providerConfigRef:
    name: prod-us-east-1
```

### 3. Set Appropriate Deletion Policies

Choose deletion policies intentionally:

```yaml
# Development: Delete everything
deletionPolicy: Delete

# Production: Preserve resources
deletionPolicy: Orphan
```

### 4. Use Dependencies for Ordering

Rely on Crossplane's dependency management rather than manual sequencing.

### 5. Monitor Status Conditions

Build automation around status conditions:

```yaml
# Only consider resource ready when Ready condition is true
if resource.status.conditions.ready.status == "True"
```

## See Also

- [System Model](../03-system-model.md) - Understand how MRs fit in
- [Key Concepts](../04-key-concepts.md) - Advanced MR patterns
- [Provider Documentation](https://docs.crossplane.io/latest/providers/) - Provider-specific resources
