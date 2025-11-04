---
id: system-model
title: System Model
description: Documentation on Crossplane's System Model and core abstractions
---

We believe that a strong shared understanding and terminology around infrastructure and resources leads to a better Crossplane experience.

Crossplane defines a clear system model with specific abstractions that allow teams to think consistently about infrastructure automation and cloud resource management.

## Core Abstractions

Crossplane's system model consists of five core abstractions:

- **Composite Resource Definitions (XRDs)** - Define the schema for custom infrastructure APIs
- **Composite Resources (XRs)** - Instances of infrastructure APIs created by users
- **Claims (Claims)** - Multi-tenant abstractions of composite resources
- **Compositions** - Define how composite resources are realized into managed resources
- **Managed Resources (MRs)** - Kubernetes representations of cloud provider resources

## Composite Resource Definitions (XRD)

An XRD defines a custom infrastructure API. It specifies:

- The schema (input parameters) users provide when requesting infrastructure
- The names and structure of the resource
- Validation rules for inputs
- Whether claims are supported for multi-tenancy

**Example**: A `Database` XRD might define that users can request a database by specifying:

- `engine` (postgres, mysql, mariadb)
- `version` (5.7, 8.0, etc.)
- `size` (small, medium, large)
- `backupRetentionDays`

### Cluster vs. Namespaced XRDs

XRDs can be defined at two scopes:

- **Cluster-scoped** - The composite resource is visible cluster-wide. Used for infrastructure that belongs to nobody specifically.
- **Namespaced** - The composite resource exists within a namespace. Used for infrastructure provisioned by a team or application.

## Composite Resources (XR)

A Composite Resource is an instance of an XRD. When a user creates a composite resource, they're requesting infrastructure following the schema defined by the XRD.

Key characteristics of composite resources:

- **Declarative** - Stored in YAML, version controlled in Git
- **Managed** - Created by users, managed/reconciled by the composition pipeline
- **Stateful** - Track provisioning status, ready conditions, and resource details
- **Cross-cutting** - Can span multiple cloud providers or services
- **Owned resources** - Own all the managed resources they create through compositions

**Example**: Creating a `Database` composite resource:

```yaml
apiVersion: database.example.com/v1
kind: Database
metadata:
  name: production-db
spec:
  engine: postgres
  version: "14"
  size: large
  backupRetentionDays: 30
```

## Claims (CompositeResourceClaims)

Claims are a multi-tenant abstraction of composite resources. They allow team members to request infrastructure without needing cluster-level visibility.

Key characteristics:

- **Namespaced** - Exist within a namespace, providing isolation
- **Delegated** - An XRD automatically creates a claim resource type
- **Reference** - Point to and reference the underlying composite resource
- **RBAC-friendly** - Easy to grant permissions per namespace/team

When a user creates a claim, Crossplane automatically creates a corresponding composite resource. The claim becomes the user-facing interface to the infrastructure.

**Relationships**:

- One XRD can have one claim type
- Multiple claims can reference the same composite resource (but typically 1:1)
- Claims provide namespace-scoped access to infrastructure

## Compositions

A Composition defines how a Composite Resource is realized into Managed Resources. It's the "recipe" for infrastructure.

Key elements of a Composition:

- **Selector** - Matches which composite resources this composition applies to
- **Resources** - List of managed resources to create
- **Patches** - Transform data from the composite resource to the managed resources
- **Functions** - Pipeline of logic to generate desired resource states
- **Readiness checks** - Define when the composition is ready

### Composition with Functions

Modern Crossplane uses composition functions instead of simple templating:

- **Functions receive** the composite resource and generate managed resources
- **Functions can** implement complex business logic, conditionals, loops
- **Functions compose** - output from one function feeds to the next
- **Functions support** Go, Python, template-based approaches

**Example**: A database composition function might:

- Take the requested `size` and map it to provider-specific instance types
- Create a database instance with the specified configuration
- Create a backup policy based on retention days
- Create a security group with appropriate access rules
- Create a subnet for database networking

## Managed Resources (MR)

Managed Resources are Kubernetes representations of cloud provider resources. They represent actual cloud resources like:

- EC2 instances, RDS databases, load balancers (AWS)
- Virtual machines, databases, storage accounts (Azure)
- Compute instances, Cloud SQL, load balancers (GCP)
- And many more across 20+ providers

### Managed Resource Characteristics

- **Provider-specific** - Each cloud provider has their own Managed Resource types (ProviderConfig)
- **Stateful** - Track actual cloud resource state through status fields
- **Observed state** - Report back to Crossplane what actually exists
- **Reconciliation** - Controllers work to keep the resource in the desired state
- **Ownership** - Managed resources reference their composites (owner reference)

### Managed Resource Lifecycle

1. **Creation** - Composition creates a managed resource
2. **Provisioning** - Provider controller creates the cloud resource
3. **Ready** - Cloud resource becomes ready, status is reported
4. **Steady state** - Controller monitors for drift
5. **Patching** - If drift detected, controller applies patches
6. **Deletion** - When composite is deleted, managed resources are cleaned up

## Relationships and Dependencies

### Composite to Managed Resources

```
Composite Resource (XR)
    ↓ (created by composition)
Managed Resources (MRs)
    ↓ (represent)
Cloud Resources (EC2, RDS, etc.)
```

### With Claims

```
User creates → Claim (ClaimXR)
              ↓ (automatically creates)
              Composite Resource (XR)
              ↓ (composition creates)
              Managed Resources (MRs)
              ↓ (represent)
              Cloud Resources
```

## Multi-cloud Composition

One of Crossplane's key strengths is supporting multi-cloud compositions:

- A single composite resource can coordinate resources across AWS, Azure, and GCP
- Composition functions implement cross-provider logic
- Managed resources automatically adapt to provider-specific APIs
- User doesn't need to know about provider differences

**Example**: A web application composition might:

- Create a database on AWS RDS
- Create a cache cluster on Azure (for cost/compliance reasons)
- Create a DNS record on Google Cloud DNS
- Create network peering between all resources

All coordinated by a single composition, presented through a unified API.

## Status and Conditions

Resources in the Crossplane system model expose status through:

- **Conditions** - Boolean states (Ready, Synced, Creating, Deleting, etc.)
- **State** - Current phase (Active, Pending, Deleting)
- **Message** - Human-readable description of current state
- **Observed Generation** - Tracks when resource was last reconciled

This allows operators to understand resource health at a glance and provides hooks for automation.

## Summary

The Crossplane system model provides a clean abstraction from complexity:

| Layer                      | Component                          | Role                         |
| -------------------------- | ---------------------------------- | ---------------------------- |
| User-facing                | XRDs + Compositions                | Define infrastructure APIs   |
| Infrastructure abstraction | Composite Resources (XRs) / Claims | Users request infrastructure |
| Resource management        | Managed Resources                  | Represent cloud resources    |
| Cloud providers            | AWS, Azure, GCP, etc.              | Actual infrastructure        |

This layered approach allows platform teams to build sophisticated, multi-cloud infrastructure platforms while keeping the user experience simple and consistent.
