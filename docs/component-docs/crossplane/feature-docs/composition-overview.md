---
id: composition-overview
title: Composition
description: Build custom infrastructure APIs using Crossplane Composition
---

Composition is the core capability that enables Crossplane's power. It allows you to build custom infrastructure APIs without implementing Kubernetes controllers.

## What is Composition?

Composition is the process of combining Managed Resources (and other Kubernetes resources) into a cohesive infrastructure abstraction that users interact with.

Instead of requiring users to understand and manage individual cloud resources like EC2 instances, security groups, and IAM roles, you compose them into a simple "App" API that handles all the complexity.

## How Composition Works

### 1. Define the API (XRD)

Create a Composite Resource Definition that specifies what parameters users can provide:

```yaml
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: apps.example.com
spec:
  group: example.com
  names:
    kind: App
  claimNames:
    kind: AppClaim
  versions:
    - name: v1
      served: true
      referenceable: true
      schema:
        openAPIV3Schema:
          properties:
            spec:
              properties:
                region:
                  type: string
                instanceType:
                  type: string
```

### 2. Implement the Logic (Composition)

Create a Composition that defines how to realize the API into cloud resources:

```yaml
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: app-aws
spec:
  compositeTypeRef:
    apiVersion: example.com/v1
    kind: App
  mode: Pipeline
  pipeline:
    - step: prepare-inputs
      functionRef:
        name: prepare-function
    - step: create-resources
      functionRef:
        name: create-function
```

### 3. Users Create Resources

Users interact with your high-level API:

```yaml
apiVersion: example.com/v1
kind: App
metadata:
  name: my-app
spec:
  region: us-east-1
  instanceType: t3.medium
```

Crossplane's composition automatically:

- Validates the input
- Executes the composition pipeline
- Creates all necessary cloud resources
- Returns status back to the user

## Composition Functions

Modern Crossplane uses composition functions to implement composition logic.

### Available Function Types

- **Templating functions** - Go templates or KCL for declarative logic
- **Patching and transforming** - Transform data between resources
- **Custom Go functions** - Implement complex business logic
- **Python functions** - Easier development with Python ecosystems

### Function Pipeline

Functions compose together in a pipeline:

```
Input: User creates App with region=us-west-2, tier=production

Step 1: Validation function checks inputs
        → Rejects if invalid region
        → Passes if valid

Step 2: Default function adds defaults
        → Sets backup retention to 7 days
        → Sets encryption to true

Step 3: Provisioning function creates resources
        → Reads tier and maps to instance type
        → Creates security groups, storage, networking

Output: App composite resource with all managed resources created
```

## Use Cases

### Platform APIs

Create self-service infrastructure APIs:

```yaml
# Users request infrastructure through simple APIs
kind: Database
spec:
  engine: postgres
  size: medium
```

Your composition handles:

- Provider-specific configuration
- Networking setup
- Security policies
- Backups and maintenance windows

### Multi-cloud Deployments

Build infrastructure across clouds:

```yaml
kind: WebApplication
spec:
  cloudPreference: auto # Composition chooses optimal cloud
```

Your composition can:

- Evaluate costs across clouds
- Check regional availability
- Select based on compliance requirements
- Create infrastructure on chosen cloud

### Infrastructure as Product

Offer infrastructure as a product to your organization:

```yaml
kind: DataWarehouse
spec:
  users: 50
  dataRetention: 90d
  budget: $5000/month
```

Your composition:

- Sizes infrastructure based on users
- Configures data retention policies
- Optimizes for budget constraints
- Provides monitoring and alerting

## Key Benefits

✅ **Abstraction** - Hide complexity behind simple APIs
✅ **Reusability** - Share compositions across teams and organizations
✅ **Consistency** - Enforce standards through composition logic
✅ **Flexibility** - Support complex multi-cloud scenarios
✅ **Auditability** - All infrastructure changes tracked and versioned
✅ **Safety** - Validation and policy gates before provisioning

## Advanced Features

### Conditional Logic

Compositions can implement conditional resource creation:

```go
// In a Go composition function
if spec.Environment == "production" {
  // Add redundancy, backups, monitoring
} else {
  // Minimal setup for development
}
```

### Environment Configurations

Use environment configs to customize composition behavior:

```yaml
# Environment config for production
apiVersion: apiextensions.crossplane.io/v1beta1
kind: EnvironmentConfig
metadata:
  name: prod-config
data:
  backupEnabled: "true"
  replicationFactor: "3"
```

### Cross-resource Dependencies

Compositions automatically handle resource dependencies:

```yaml
# Reference another resource created in the composition
spec:
  forProvider:
    vpcId: ${vpc.status.atProvider.vpcId}
```

## Common Patterns

### The "T-Shirt" Pattern

Map user-friendly sizes to infrastructure:

```
small → t3.small, 20GB storage
medium → t3.medium, 50GB storage
large → t3.large, 200GB storage
```

### The "Opinionated Defaults" Pattern

Provide sensible defaults that users can override:

```yaml
spec:
  # User provides only what matters
  applicationName: my-app
  # Composition provides defaults for
  # region, backups, monitoring, security, etc.
```

### The "Quota and Limits" Pattern

Enforce organizational policies in composition:

```
Max storage: 1TB per user
Max compute: 4 vCPU per dev app
Max databases: 5 per team
```

## Getting Started

1. **Define your API** - Create an XRD with the parameters users need
2. **Write composition logic** - Start simple with templating, advance to functions
3. **Test thoroughly** - Test edge cases and error scenarios
4. **Document well** - Help users understand what your composition provides
5. **Iterate** - Gather feedback and improve over time

## See Also

- [System Model](../03-system-model.md) - Understand Composite Resources, Managed Resources
- [Key Concepts](../04-key-concepts.md) - Deep dive on Composition functions and patterns
- [Crossplane Documentation](https://docs.crossplane.io/latest/concepts/compositions/) - Official composition guide
