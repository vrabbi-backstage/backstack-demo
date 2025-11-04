---
id: policy-types
title: Kyverno Policy Types
description: Comprehensive guide to all Kyverno policy types, their purposes, capabilities, and when to use each one
---

# Kyverno Policy Types

## Overview

Kyverno provides several policy resource types to address different operational and security requirements. Each policy type is optimized for specific use cases and offers different capabilities for managing resources, enforcing rules, and generating resources in Kubernetes clusters.

This guide covers all available policy types, their differences, capabilities, and guidance on when to use each type.

---

## ClusterPolicy

### What is a ClusterPolicy?

A `ClusterPolicy` is a cluster-scoped Kyverno resource that defines rules applicable across all Kubernetes namespaces. ClusterPolicies are evaluated for all resources matching the policy's match conditions unless explicitly excluded.

### Characteristics

- **Scope**: Cluster-wide (all namespaces)
- **Resource Kind**: `ClusterPolicy`
- **API Group**: `kyverno.io`
- **Admission Phase**: Can operate as webhook (admission controller) or background
- **Common Uses**:
  - Organization-wide security standards
  - Network policy enforcement
  - Resource naming conventions
  - Image validation and scanning
  - Security context standardization

### Key Features

#### Validation Rules

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-resource-limits
spec:
  validationFailureAction: audit
  rules:
    - name: validate-limits
      match:
        resources:
          kinds:
            - Pod
      validate:
        message: "CPU and memory limits required"
        pattern:
          spec:
            containers:
              - resources:
                  limits:
                    memory: "?*"
                    cpu: "?*"
```

#### Mutation Rules

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: add-default-labels
spec:
  rules:
    - name: add-labels
      match:
        resources:
          kinds:
            - Pod
      mutate:
        patchStrategicMerge:
          metadata:
            labels:
              app.kubernetes.io/managed-by: kyverno
```

#### Generation Rules

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: generate-network-policy
spec:
  rules:
    - name: create-network-policy
      match:
        resources:
          kinds:
            - Namespace
          selector:
            matchLabels:
              enforce-netpol: "true"
      generate:
        kind: NetworkPolicy
        name: default-deny
        namespace: "{{request.object.metadata.name}}"
        data:
          apiVersion: networking.k8s.io/v1
          kind: NetworkPolicy
          metadata:
            name: default-deny
          spec:
            podSelector: {}
            policyTypes:
              - Ingress
```

### When to Use ClusterPolicy

- **Organization-wide policies** that apply uniformly across teams
- **Security standards** like image scanning, network policies
- **Compliance requirements** that can't vary by team
- **Infrastructure constraints** like resource limits, storage classes
- **Audit policies** that need cluster visibility

### Limitations

- Cannot be limited to specific namespaces (namespace-level control uses `Policy`)
- May affect system namespaces if not properly scoped with `excludeResources`
- All cluster nodes must have sufficient capacity to run Kyverno webhooks

---

## Policy (Namespaced)

### What is a Policy?

A `Policy` is a namespace-scoped Kyverno resource defining rules specific to a single namespace. Policies are useful when teams manage their own namespaces and require local policy enforcement.

### Characteristics

- **Scope**: Single namespace
- **Resource Kind**: `Policy`
- **API Group**: `kyverno.io`
- **Admission Phase**: Can operate as webhook or background
- **Common Uses**:
  - Team-specific enforcement rules
  - Namespace-level compliance standards
  - Development environment controls
  - Multi-tenant isolation rules

### Key Features

#### Namespace-Scoped Validation

```yaml
apiVersion: kyverno.io/v1
kind: Policy
metadata:
  name: team-a-pod-security
  namespace: team-a
spec:
  validationFailureAction: enforce
  rules:
    - name: require-security-context
      match:
        resources:
          kinds:
            - Pod
      validate:
        message: "Security context required"
        pattern:
          spec:
            containers:
              - securityContext:
                  runAsNonRoot: true
```

#### Team-Level Mutation

```yaml
apiVersion: kyverno.io/v1
kind: Policy
metadata:
  name: team-resources
  namespace: team-a
spec:
  rules:
    - name: inject-team-labels
      match:
        resources:
          kinds:
            - Pod
            - Service
            - Deployment
      mutate:
        patchStrategicMerge:
          metadata:
            labels:
              team: team-a
              cost-center: "1234"
```

### When to Use Policy

- **Multi-tenant environments** where teams have autonomy
- **Development environments** with specific team requirements
- **Sandbox namespaces** with temporary policies
- **Graduated policies** starting with audit before enforcement
- **Team-specific compliance** requirements

### Advantages over ClusterPolicy

- Teams can manage own rules without cluster admin involvement
- Scoped to specific namespace (reduces blast radius)
- Easier to test and validate before cluster-wide rollout
- Can be deployed by namespace operators (RBAC friendly)

---

## ValidatingPolicy (v1alpha2+)

### What is a ValidatingPolicy?

A `ValidatingPolicy` is a newer Kyverno resource type (v1alpha2) specifically optimized for validation-only enforcement. It provides improved performance and Kubernetes-native patterns for validation scenarios.

### Characteristics

- **Scope**: Cluster-wide (like ClusterPolicy)
- **Resource Kind**: `ValidatingPolicy`
- **API Group**: `kyverno.io`
- **Available Since**: Kyverno v1.13+
- **Optimization**: Streamlined for validation operations
- **Common Uses**:
  - Image validation and scanning
  - Compliance and regulatory checks
  - Schema validation
  - Security policy enforcement

### Key Features

#### CEL-Based Validation

```yaml
apiVersion: kyverno.io/v1alpha2
kind: ValidatingPolicy
metadata:
  name: validate-image-registry
spec:
  validationFailureAction: enforce
  rules:
    - name: require-approved-registry
      match:
        resources:
          kinds:
            - Pod
      validate:
        cel:
          expressions:
            - expression: |
                object.spec.containers.all(container,
                container.image.startsWith('registry.company.com/'))
              message: "Image must be from approved registry"
```

#### Pattern-Based Validation

```yaml
apiVersion: kyverno.io/v1alpha2
kind: ValidatingPolicy
metadata:
  name: validate-pod-resources
spec:
  validationFailureAction: audit
  rules:
    - name: check-requests
      match:
        resources:
          kinds:
            - Pod
      validate:
        pattern:
          spec:
            containers:
              - resources:
                  requests:
                    cpu: "?*"
                    memory: "?*"
```

### When to Use ValidatingPolicy

- **New deployments** of Kyverno (v1.13+)
- **Pure validation scenarios** without mutation
- **High-throughput environments** needing performance optimization
- **Modern CEL-based validation** rules
- **Kubernetes-native patterns** with policy resource types

### Advantages over ClusterPolicy

- Optimized performance for validation-only workloads
- Kubernetes v1.26+ ValidatingAdmissionPolicy compatibility
- Cleaner API specifically designed for validation
- Better performance under high load

---

## MutatingPolicy (v1alpha2+)

### What is a MutatingPolicy?

A `MutatingPolicy` is a Kyverno resource type specifically optimized for mutation operations. It provides streamlined mutation capabilities with improved performance for modification scenarios.

### Characteristics

- **Scope**: Cluster-wide (like ClusterPolicy)
- **Resource Kind**: `MutatingPolicy`
- **API Group**: `kyverno.io`
- **Available Since**: Kyverno v1.13+
- **Optimization**: Streamlined for mutation operations
- **Common Uses**:
  - Injecting sidecar containers
  - Adding labels and annotations
  - Modifying resource specifications
  - Standardizing container images

### Key Features

#### Strategic Merge Patch Mutation

```yaml
apiVersion: kyverno.io/v1alpha2
kind: MutatingPolicy
metadata:
  name: inject-sidecar
spec:
  rules:
    - name: inject-logging-sidecar
      match:
        resources:
          kinds:
            - Pod
          selector:
            matchLabels:
              logging-enabled: "true"
      mutate:
        patchStrategicMerge:
          spec:
            containers:
              - name: logging-agent
                image: logging-agent:latest
                volumeMounts:
                  - name: logs
                    mountPath: /var/log
            volumes:
              - name: logs
                emptyDir: {}
```

#### JSON Patch Mutation

```yaml
apiVersion: kyverno.io/v1alpha2
kind: MutatingPolicy
metadata:
  name: enforce-pod-priority
spec:
  rules:
    - name: set-priority-class
      match:
        resources:
          kinds:
            - Pod
      mutate:
        patchesJson6902: |
          - op: add
            path: /spec/priorityClassName
            value: high-priority
```

### When to Use MutatingPolicy

- **New deployments** of Kyverno (v1.13+)
- **Mutation-focused scenarios** without validation
- **Sidecar injection** and container modifications
- **Standardizing resource attributes** across clusters
- **Performance-critical environments** needing optimized mutation

### Advantages over ClusterPolicy

- Optimized performance for mutation-only workloads
- Cleaner API specifically designed for mutation
- Better resource utilization in mutation-heavy environments
- Compatible with future Kubernetes mutation webhooks

---

## GeneratingPolicy

### What is a GeneratingPolicy?

A `GeneratingPolicy` (used within ClusterPolicy or Policy with generation rules) automatically creates Kubernetes resources based on trigger events. The primary use case is automatic resource generation when new namespaces are created.

### Characteristics

- **Trigger Events**: Namespace creation, label changes
- **Generated Resources**: Any Kubernetes resource type
- **Scope**: Cluster-wide or namespace-specific (depends on parent policy)
- **Common Uses**:
  - Default NetworkPolicy creation
  - RBAC role generation
  - ResourceQuota creation
  - ServiceAccount generation

### Key Features

#### Namespace-Triggered Generation

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: create-namespace-defaults
spec:
  rules:
    - name: create-network-policy
      match:
        resources:
          kinds:
            - Namespace
      generate:
        kind: NetworkPolicy
        name: default-deny-ingress
        namespace: "{{request.object.metadata.name}}"
        data:
          apiVersion: networking.k8s.io/v1
          kind: NetworkPolicy
          metadata:
            name: default-deny-ingress
          spec:
            podSelector: {}
            policyTypes:
              - Ingress

    - name: create-resource-quota
      match:
        resources:
          kinds:
            - Namespace
          selector:
            matchLabels:
              enforce-quota: "true"
      generate:
        kind: ResourceQuota
        name: default-quota
        namespace: "{{request.object.metadata.name}}"
        data:
          apiVersion: v1
          kind: ResourceQuota
          metadata:
            name: default-quota
          spec:
            hard:
              requests.cpu: "10"
              requests.memory: "20Gi"
              limits.cpu: "20"
              limits.memory: "40Gi"
```

#### RBAC Role Generation

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: create-default-roles
spec:
  rules:
    - name: create-view-role
      match:
        resources:
          kinds:
            - Namespace
      generate:
        kind: Role
        name: default-viewer
        namespace: "{{request.object.metadata.name}}"
        data:
          apiVersion: rbac.authorization.k8s.io/v1
          kind: Role
          metadata:
            name: default-viewer
          rules:
            - apiGroups: [""]
              resources: ["pods", "services"]
              verbs: ["get", "list"]
```

### When to Use Generating Policies

- **Standardizing new namespaces** with required resources
- **Automated RBAC management** across namespaces
- **Default security postures** for new environments
- **Ensuring consistent resource quotas** and limits
- **Automatic team onboarding** infrastructure

### Considerations

- Generated resources are owned by the policy
- Changes to generated resources may be reverted by Kyverno
- Cannot generate resources in system namespaces without explicit configuration
- Generation is one-time operation (updates not automatically applied)

---

## DeletingPolicy

### What is a DeletingPolicy?

A `DeletingPolicy` (implemented via `kind: ClusterPolicy` with deletion configuration) enables automatic deletion of resources matching specific criteria. This is useful for cleanup and compliance enforcement.

### Characteristics

- **Trigger**: Resource deletion requests
- **Action**: Allow, deny, or audit deletion attempts
- **Scope**: Cluster-wide or namespace-specific
- **Common Uses**:
  - Preventing critical resource deletion
  - Enforcing backup before deletion
  - Compliance-driven resource retention

### Key Features

#### Preventing Resource Deletion

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: prevent-pvc-deletion
spec:
  validationFailureAction: enforce
  rules:
    - name: prevent-pvc-delete
      match:
        resources:
          kinds:
            - PersistentVolumeClaim
          selector:
            matchLabels:
              protected: "true"
      validate:
        message: "Protected PVCs cannot be deleted"
        deny:
          conditions:
            all:
              - key: "{{request.operation}}"
                operator: Equals
                value: DELETE
```

#### Audit Deletion Attempts

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: audit-secret-deletion
spec:
  validationFailureAction: audit
  rules:
    - name: audit-secret-delete
      match:
        resources:
          kinds:
            - Secret
      validate:
        message: "Secret deletion attempt"
        deny:
          conditions:
            all:
              - key: "{{request.operation}}"
                operator: Equals
                value: DELETE
```

### When to Use Deletion Controls

- **Critical infrastructure** that shouldn't be accidentally deleted
- **Data retention policies** requiring deletion approval
- **Compliance requirements** for audit trails
- **Protecting PVCs** and persistent data

---

## ImageValidatingPolicy

### What is an ImageValidatingPolicy?

An `ImageValidatingPolicy` is a specialized policy type for container image validation. It provides optimized image scanning, signature verification, and registry validation capabilities.

### Characteristics

- **Focus**: Container image validation
- **Capabilities**: Image scanning, signature verification, registry validation
- **Scope**: Cluster-wide
- **Integration**: Cosign, image scanning services
- **Common Uses**:
  - Image signature verification
  - Registry validation
  - Image scanning integration
  - Supply chain security

### Key Features

#### Image Signature Verification

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: verify-image-signatures
spec:
  validationFailureAction: enforce
  rules:
    - name: verify-signatures
      match:
        resources:
          kinds:
            - Pod
      verifyImages:
        - imageReferences:
            - "gcr.io/mycompany/*"
          attestors:
            - name: verify-attestation
              attestationProvider:
                name: github-actions
            - name: verify-signature
              attestationProvider:
                name: cosign-pub
```

#### Registry Validation

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: restrict-image-registries
spec:
  validationFailureAction: enforce
  rules:
    - name: approved-registries
      match:
        resources:
          kinds:
            - Pod
      validate:
        message: "Only approved registries allowed"
        pattern:
          spec:
            containers:
              - image: "gcr.io/mycompany/* | docker.io/library/*"
```

### When to Use Image Validation

- **Supply chain security** requirements
- **Image scanning** integration
- **Registry enforcement** for approved sources
- **Signature verification** workflows
- **Container provenance** tracking

---

## Policy Type Comparison Matrix

| Feature               | ClusterPolicy | Policy    | ValidatingPolicy | MutatingPolicy | Generating | Image Validating |
| --------------------- | ------------- | --------- | ---------------- | -------------- | ---------- | ---------------- |
| **Scope**             | Cluster-wide  | Namespace | Cluster-wide     | Cluster-wide   | Cluster/NS | Cluster-wide     |
| **Available Since**   | v1.0          | v1.0      | v1.13            | v1.13          | v1.0       | v1.6             |
| **Validation Rules**  | Yes           | Yes       | Yes              | No             | N/A        | Yes              |
| **Mutation Rules**    | Yes           | Yes       | No               | Yes            | N/A        | No               |
| **Generation Rules**  | Yes           | Yes       | No               | No             | Yes        | No               |
| **CEL Support**       | Limited       | Limited   | Yes              | Limited        | No         | Yes              |
| **Performance**       | Standard      | Standard  | Optimized        | Optimized      | Standard   | Optimized        |
| **Team Autonomy**     | No            | Yes       | No               | No             | No         | No               |
| **Admission Webhook** | Yes           | Yes       | Yes              | Yes            | No         | Yes              |
| **Background Rules**  | Yes           | Yes       | No               | No             | Yes        | No               |

---

## Selection Guide: Choosing the Right Policy Type

### For Validation-Only Scenarios

- **New deployments (v1.13+)**: Use `ValidatingPolicy`
- **Existing deployments**: Use `ClusterPolicy` with validation rules only

### For Mutation-Only Scenarios

- **New deployments (v1.13+)**: Use `MutatingPolicy`
- **Existing deployments**: Use `ClusterPolicy` with mutation rules only

### For Generation Scenarios

- **Cluster-wide generation**: Use `ClusterPolicy` with generation rules
- **Namespace-scoped generation**: Use `Policy` with generation rules

### For Image Validation

- **Always**: Use specialized image validation rules within policy type
- **For signatures**: Use image verification fields

### For Namespace-Scoped Enforcement

- **Team autonomy required**: Use `Policy`
- **Cluster-wide enforcement**: Use `ClusterPolicy`

### For Compliance/Audit

- **Organizational standards**: Use `ClusterPolicy`
- **Team-specific standards**: Use `Policy`
- **Image supply chain**: Use image validation rules

---

## Best Practices

### 1. Start with Audit Mode

Begin with `validationFailureAction: audit` before switching to `enforce`:

```yaml
spec:
  validationFailureAction: audit # Start here
  # Later, move to:
  # validationFailureAction: enforce
```

### 2. Use Policy for Team Autonomy

Empower teams with namespace-scoped `Policy` resources:

```yaml
apiVersion: kyverno.io/v1
kind: Policy
metadata:
  namespace: team-a
```

### 3. Leverage ValidatingPolicy for Performance

In high-throughput environments, separate validation from mutation:

```yaml
apiVersion: kyverno.io/v1alpha2
kind: ValidatingPolicy # Optimized validation
---
apiVersion: kyverno.io/v1alpha2
kind: MutatingPolicy # Optimized mutation
```

### 4. Exclude System Namespaces

Prevent policies from affecting Kyverno itself:

```yaml
spec:
  rules:
    - name: my-rule
      exclude:
        resources:
          namespaces:
            - kyverno
            - kube-system
            - kube-node-lease
```

### 5. Use Generation for Defaults

Automate creation of required resources:

```yaml
- name: create-defaults
  match:
    resources:
      kinds:
        - Namespace
  generate:
    kind: NetworkPolicy
    # Auto-creates NetworkPolicy for each new namespace
```

### 6. Combine Policy Types for Layered Security

Use multiple policies for defense-in-depth:

```yaml
# First: Validate compliance
kind: ValidatingPolicy
name: compliance-check
---
# Second: Mutate for standards
kind: MutatingPolicy
name: enforce-standards
---
# Third: Generate required resources
kind: ClusterPolicy
name: create-defaults
```

---

## Summary

Kyverno provides flexible policy types to match different operational needs:

- **ClusterPolicy**: Universal, all-purpose cluster-wide enforcement
- **Policy**: Namespace-scoped for team autonomy
- **ValidatingPolicy**: Optimized validation for high performance
- **MutatingPolicy**: Optimized mutation for infrastructure standards
- **Generation**: Automatic resource creation for defaults
- **Image Validation**: Container image security and compliance

Choose the right policy type based on scope, operation type, and performance requirements to build a secure, compliant, and maintainable Kubernetes environment.
