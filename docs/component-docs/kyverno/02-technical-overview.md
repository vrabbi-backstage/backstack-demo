---
id: technical-overview
title: Technical Overview
description: Technical overview of Kyverno architecture, components, and how policy evaluation works
---

## Purpose

Kyverno is a cloud native policy engine that applies policies to any JSON payload (primarily Kubernetes resources). It enables declarative, Git-friendly policy management without requiring users to learn a new language.

Kyverno was built on the principle that policies should be simple YAML resources, making them accessible to platform engineers and operators who already understand Kubernetes.

## Architecture

Kyverno operates through several integrated components working together to enforce policies across your infrastructure:

```
┌─────────────────────────────────────────────────────┐
│           Kubernetes API Server                     │
│  (Route: admission webhooks, events, resources)    │
└─────────────────────────────────────────────────────┘
              ↑                          ↓
              │                    Webhook Events
              │                         │
          Policy                        ↓
          Update                   ┌──────────────┐
              │                    │   Kyverno    │
              │                    │   Webhooks   │
              │                    └──────┬───────┘
              │                           │
              └──────────────────→ ┌──────┴───────────────────────┐
                                   │                              │
                        ┌──────────┴──────────┐    ┌─────────────┴──────────┐
                        ↓                     ↓    ↓                        ↓
                   ┌──────────┐      ┌──────────────────┐       ┌──────────────────┐
                   │  Engine  │      │  Background      │       │  Report          │
                   │          │      │  Controller      │       │  Controllers     │
                   └────┬─────┘      └──────┬───────────┘       └────────┬─────────┘
                        │                   │                            │
                        ├─→ Evaluate Policies
                        ├─→ Generate Results
                        │
                        ↓
              ┌──────────────────────┐
              │  Policy Reports      │
              │  & Events            │
              └──────────────────────┘
```

## Core Components

### 1. Webhook Server

The webhook server is the entry point for resource requests from the Kubernetes API server.

**Responsibilities**:

- Receives AdmissionReview requests from Kubernetes
- Handles mutating and validating webhooks
- Dynamically registers/updates webhooks based on deployed policies
- Routes requests to the policy engine

**Key features**:

- Certificate management for TLS
- Request/response handling
- Webhook configuration updates

### 2. Policy Engine

The core engine that evaluates policies against resources.

**Responsibilities**:

- Load and parse Kyverno policies
- Match resources against policy rules
- Evaluate policy conditions
- Generate policy results
- Apply mutations if configured

**Key operations**:

- **Match evaluation** - Determine if resource matches policy scope
- **Condition evaluation** - Check preconditions and deny rules
- **Rule execution** - Execute validate, mutate, generate, or verify rules
- **Result generation** - Produce pass/fail/skip results

### 3. Background Controller

Handles async policy operations on existing resources.

**Responsibilities**:

- Discover existing resources in the cluster
- Evaluate policies against existing resources
- Apply mutations to existing resources (if configured)
- Generate resources based on triggers
- Create policy reports

**Use cases**:

- Scan existing resources against newly deployed policies
- Mutate existing resources if policy changes
- Generate resources for existing triggers
- Maintain compliance scanning

### 4. Report Controllers

Manage creation and updates of policy reports.

**Types of reports**:

- **Admission Reports** - Results from admission requests
- **Background Scan Reports** - Results from background scanning
- **Policy Reports** - Aggregated reports per resource

**Responsibilities**:

- Aggregate policy evaluation results
- Create PolicyReport and ClusterPolicyReport resources
- Update reports as policies change
- Manage report lifecycle

### 5. Cert Renewer

Manages TLS certificates for the webhook server.

**Responsibilities**:

- Generate and renew webhook certificates
- Store certificates as Kubernetes Secrets
- Ensure certificate validity
- Rotate certificates before expiry

## Policy Evaluation Flow

When a resource is created or updated:

```
1. User/Controller submits resource to Kubernetes API
   ↓
2. Kubernetes routes through Kyverno webhooks
   ↓
3. Kyverno webhook receives AdmissionReview
   ↓
4. Engine evaluates resource against matching policies:
   a. Filter policies by resource kind, namespace, etc.
   b. For each matching policy:
      - Evaluate match/exclude conditions
      - Evaluate preconditions
      - Execute rule logic (validate/mutate/generate/verify)
   c. Collect results
   ↓
5. Kyverno returns AdmissionResponse to Kubernetes:
   - Allowed: true/false
   - Mutations: patches to apply
   - Message: explanation of denial
   ↓
6. Kubernetes applies result:
   - If denied: reject resource
   - If allowed: apply mutations (if any)
   - Create resource
   ↓
7. Kyverno creates events and policy reports
```

## Policy Rule Types

### Validate Rule

Checks if a resource matches expected configuration.

```
Input: Resource
  ↓
Check: Does resource match pattern?
  ↓
Output: Pass/Fail
```

Features:

- Pattern matching with wildcards
- Conditional logic (if-then-else)
- Deny rules for negative validation
- Message customization

### Mutate Rule

Modifies a resource before storage.

```
Input: Resource
  ↓
Transform: Apply patches
  ↓
Output: Modified resource
```

Features:

- Strategic merge patches
- JSON patches (RFC 6902)
- Overlay-style mutations
- Conditional mutation logic

### Generate Rule

Creates new resources based on triggers.

```
Input: Trigger resource (e.g., Namespace)
  ↓
Generate: Create derived resource
  ↓
Output: New resource created
```

Features:

- Template-based generation
- Namespace/cluster scoped
- Automatic cleanup
- Sync with trigger

### Verify Images Rule

Validates container images and signatures.

```
Input: Resource with image references
  ↓
Verify: Check signatures and attestations
  ↓
Output: Pass/Fail based on verification
```

Features:

- Image signature verification
- Attestation checking
- Registry validation
- Supply chain security

## Failure Actions

Control how policy violations are handled:

### Enforce

- **Effect**: Block resource immediately
- **Use case**: Security policies
- **Report**: No entry (resource blocked)

### Audit

- **Effect**: Allow resource, report violation
- **Use case**: Compliance monitoring
- **Report**: Entry in PolicyReport

### Skip

- **Effect**: Allow and ignore policy
- **Use case**: Testing/temporary
- **Report**: Skipped entry in PolicyReport

## Match and Exclude

Fine-grained resource matching:

```yaml
match:
  - resources:
      kinds:
        - Pod
      namespaces:
        - production
      selector:
        matchLabels:
          environment: prod

exclude:
  - resources:
      names:
        - kyverno-*
        - kube-system-*
```

Matching options:

- **kinds** - Resource types
- **name** - Resource name (wildcards supported)
- **namespaces** - Namespace names
- **selector** - Label selectors
- **annotations** - Annotation matching
- **operations** - Webhook operations (CREATE, UPDATE, DELETE, etc.)

## Conditions and Context

### Preconditions

Evaluated before rule execution:

```yaml
preconditions:
  any:
    - key: "{{ request.object.metadata.labels.deployment }}"
      operator: Equals
      value: "canary"
```

### Deny Rules

Negative validation:

```yaml
deny:
  conditions:
    any:
      - key: "{{ request.object.spec.privileged }}"
        operator: Equals
        value: "true"
```

### Context

External data for policy evaluation:

```yaml
context:
  - name: imageRegistry
    apiCall:
      urlPath: "/api/v1/images"
      jmesPath: "images[?name=='{{ request.object.spec.image }}']"
```

## CEL Expressions

Kyverno v1.13+ supports CEL (Common Expression Language) for advanced policy logic:

```yaml
validate:
  message: "Image must be from approved registry"
  expression: >
    object.spec.containers.all(c, 
      c.image.startsWith('gcr.io/mycompany/') ||
      c.image.startsWith('docker.io/library/')
    )
```

## High Availability

Kyverno supports HA deployments:

- **Multiple webhook replicas** - Load balancing admission requests
- **Multiple background controller replicas** - Parallel scanning
- **Shared Redis** - State sharing (optional)
- **Leader election** - Coordination between replicas

Configuration for HA:

```yaml
replicas: 3 # Multiple webhook instances
resources:
  requests:
    cpu: "100m"
    memory: "256Mi"
```

## Performance Optimization

### Caching

- Policy rules cached to avoid re-evaluation
- Results cached when applicable
- Configurable cache TTL

### Webhook Optimization

- Only register webhooks for relevant resources
- Early filtering based on match criteria
- Parallel evaluation where possible

### Background Scanning

- Configurable scan intervals
- Selective namespace scanning
- Priority-based scanning

## State Management

### Policy Storage

- Policies stored as Kubernetes CRDs
- Versioned in etcd
- RBAC controlled access

### Report Storage

- PolicyReports stored in namespaces
- ClusterPolicyReports cluster-scoped
- Automatic cleanup of old reports

### Webhook Configuration

- ValidatingWebhookConfiguration
- MutatingWebhookConfiguration
- Dynamically updated based on policies

## Security Characteristics

### Authentication & Authorization

- Leverages Kubernetes RBAC
- Webhook authentication via service account
- API access controlled by RBAC

### Network Security

- TLS for all webhook communication
- Service-to-service authentication
- Network policies can restrict traffic

### Policy Auditing

- All policy changes logged to etcd
- Kubernetes audit log records all actions
- Policy reports provide compliance audit trail

## Integration Points

### Kubernetes API

- Webhook admission control
- Event generation
- Resource status updates

### Observability

- **Prometheus metrics** - Policy execution times, pass/fail counts
- **Structured logging** - JSON logs for aggregation
- **Kubernetes events** - Real-time notification

### External Systems

- Webhooks for external notifications
- Policy reports accessible via API
- CLI integration for testing

## Scalability Characteristics

### Cluster Size

- Tested on large clusters (1000+ nodes)
- Performance scales with cluster size
- Background scanning configurable

### Policy Count

- Hundreds of policies supported
- Performance depends on policy complexity
- Webhook optimization for large policy sets

### Request Rate

- Handles high admission request rates
- Parallel policy evaluation
- Webhook timeouts configurable (1-30 seconds)

## Design Principles

- **Kubernetes native** - Uses Kubernetes patterns and APIs
- **No external DSL** - Pure YAML policies
- **Declarative** - Git-friendly, version controllable
- **Flexible** - Support multiple rule types
- **Extensible** - Support custom conditions and logic
- **Observable** - Metrics, events, and reports

## Learning Path

To understand Kyverno deeply:

1. **[Core Concepts](./03-core-concepts.md)** - Understand key terminology
2. **[Policy Types](./04-policy-types.md)** - Explore different policy types
3. **[Official Documentation](https://kyverno.io/docs/)** - Complete reference
