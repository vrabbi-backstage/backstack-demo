---
id: validation-mutation-patterns
title: Validation and Mutation Patterns
description: Common patterns and examples for Kyverno validation and mutation policies
---

# Validation and Mutation Patterns

## Overview

Validation and mutation are the two core mechanisms for policy enforcement in Kyverno. This guide explores common patterns, best practices, and real-world examples for implementing both validation rules (which block non-compliant resources) and mutation rules (which modify resources to meet standards).

---

## Validation Patterns

### Pattern 1: Image Registry Validation

**Requirement**: Only allow images from approved registries

#### Using Pattern Matching

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: approved-registries
spec:
  validationFailureAction: enforce
  rules:
    - name: validate-image-registry
      match:
        resources:
          kinds:
            - Pod
      validate:
        message: "Image must be from approved registry"
        pattern:
          spec:
            containers:
              - image: "gcr.io/* | registry.company.com/* | docker.io/library/*"
```

#### Using CEL Expression

```yaml
apiVersion: kyverno.io/v1alpha2
kind: ValidatingPolicy
metadata:
  name: approved-registries-cel
spec:
  validationFailureAction: enforce
  rules:
    - name: validate-image-registry
      match:
        resources:
          kinds:
            - Pod
      validate:
        cel:
          expressions:
            - expression: |
                object.spec.containers.all(container,
                container.image.startsWith('gcr.io/') ||
                container.image.startsWith('registry.company.com/') ||
                container.image.startsWith('docker.io/library/'))
              message: "Only approved registries allowed"
```

### Pattern 2: Resource Limits Validation

**Requirement**: Enforce CPU and memory limits on all containers

#### Using Pattern Matching

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-resource-limits
spec:
  validationFailureAction: enforce
  rules:
    - name: validate-resources
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
                  requests:
                    memory: "?*"
                    cpu: "?*"
```

#### Using CEL for Detailed Validation

```yaml
apiVersion: kyverno.io/v1alpha2
kind: ValidatingPolicy
metadata:
  name: require-resource-limits-cel
spec:
  validationFailureAction: enforce
  rules:
    - name: validate-resources
      match:
        resources:
          kinds:
            - Pod
      validate:
        cel:
          expressions:
            - expression: |
                object.spec.containers.all(container,
                has(container.resources) &&
                has(container.resources.limits) &&
                has(container.resources.limits.cpu) &&
                has(container.resources.limits.memory) &&
                container.resources.limits.cpu != "" &&
                container.resources.limits.memory != "")
              message: "CPU and memory limits are required"
            - expression: |
                object.spec.containers.all(container,
                container.resources.limits.memory.getBytes('Mi') <= 2048 &&
                container.resources.limits.cpu.getQuantity('m') <= 1000)
              message: "Limits exceed maximum allowed values"
```

### Pattern 3: Security Context Validation

**Requirement**: Enforce security best practices

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: pod-security-standards
spec:
  validationFailureAction: enforce
  rules:
    - name: validate-security-context
      match:
        resources:
          kinds:
            - Pod
      validate:
        message: "Pod must adhere to security standards"
        pattern:
          spec:
            containers:
              - securityContext:
                  runAsNonRoot: true
                  runAsUser: "?*"
                  allowPrivilegeEscalation: false
                  capabilities:
                    drop:
                      - ALL
            securityContext:
              fsGroup: "?*"
```

### Pattern 4: Deny Rules (Deny-List Pattern)

**Requirement**: Block specific configurations

#### Preventing Privileged Containers

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: deny-privileged-containers
spec:
  validationFailureAction: enforce
  rules:
    - name: deny-privileged
      match:
        resources:
          kinds:
            - Pod
      validate:
        message: "Privileged containers are not allowed"
        deny:
          conditions:
            any:
              - key: "{{request.object.spec.containers[*].securityContext.privileged}}"
                operator: AnyTrue
              - key: "{{request.object.spec.containers[*].securityContext.hostNetwork}}"
                operator: AnyTrue
              - key: "{{request.object.spec.containers[*].securityContext.hostPID}}"
                operator: AnyTrue
```

#### Blocking Specific Image Tags

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: deny-latest-tag
spec:
  validationFailureAction: enforce
  rules:
    - name: deny-latest-images
      match:
        resources:
          kinds:
            - Pod
      validate:
        message: "Image must specify explicit version tag"
        deny:
          conditions:
            any:
              - key: "{{request.object.spec.containers[*].image}}"
                operator: Match
                value: "*:latest"
              - key: "{{request.object.spec.containers[*].image}}"
                operator: Match
                value: "*"
                # Image without tag defaults to latest
```

### Pattern 5: Conditional Validation

**Requirement**: Apply different rules based on conditions

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: conditional-validation
spec:
  validationFailureAction: enforce
  rules:
    - name: production-strict-validation
      match:
        resources:
          kinds:
            - Pod
          namespaceSelector:
            matchLabels:
              environment: production
      validate:
        message: "Production pods require strict security"
        pattern:
          spec:
            securityContext:
              fsGroup: "?*"
              securityContext:
                runAsNonRoot: true

    - name: development-relaxed-validation
      match:
        resources:
          kinds:
            - Pod
          namespaceSelector:
            matchLabels:
              environment: development
      validate:
        message: "Development pods have basic requirements"
        pattern:
          spec:
            containers:
              - resources:
                  requests:
                    cpu: "?*"
```

### Pattern 6: Multi-Resource Validation

**Requirement**: Enforce policy across multiple resource types

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-labels
spec:
  validationFailureAction: enforce
  rules:
    - name: require-standard-labels
      match:
        resources:
          kinds:
            - Pod
            - Deployment
            - StatefulSet
            - DaemonSet
      validate:
        message: "Standard labels required: app, team, environment"
        pattern:
          metadata:
            labels:
              app: "?*"
              team: "?*"
              environment: "?*"
```

---

## Mutation Patterns

### Pattern 1: Add Labels and Annotations

**Requirement**: Automatically add organization labels to all resources

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: add-organization-labels
spec:
  rules:
    - name: add-labels
      match:
        resources:
          kinds:
            - Pod
            - Deployment
            - Service
      mutate:
        patchStrategicMerge:
          metadata:
            labels:
              managed-by: kyverno
              org: acme-corp
            annotations:
              mutation-timestamp: "{{request.object.metadata.creationTimestamp}}"
              created-by: "{{request.userInfo.username}}"
```

### Pattern 2: Inject Sidecar Container

**Requirement**: Automatically add monitoring sidecar to deployments

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: inject-monitoring-sidecar
spec:
  rules:
    - name: inject-sidecar
      match:
        resources:
          kinds:
            - Pod
          selector:
            matchLabels:
              monitoring: "true"
      mutate:
        patchesJson6902: |
          - op: add
            path: /spec/containers/1
            value:
              name: monitoring-agent
              image: monitoring-agent:v1.2
              resources:
                limits:
                  cpu: 100m
                  memory: 128Mi
                requests:
                  cpu: 50m
                  memory: 64Mi
              volumeMounts:
              - name: metrics
                mountPath: /metrics
          - op: add
            path: /spec/volumes/0
            value:
              name: metrics
              emptyDir: {}
```

### Pattern 3: Enforce Default Resources

**Requirement**: Set default resource limits when not specified

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: set-default-resources
spec:
  rules:
    - name: set-resource-defaults
      match:
        resources:
          kinds:
            - Pod
      mutate:
        patchStrategicMerge:
          spec:
            containers:
              - resources:
                  requests:
                    cpu: 100m
                    memory: 128Mi
                  limits:
                    cpu: 500m
                    memory: 512Mi
```

### Pattern 4: Standardize Container Images

**Requirement**: Rewrite image paths to use approved registry

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: rewrite-image-registry
spec:
  rules:
    - name: rewrite-images
      match:
        resources:
          kinds:
            - Pod
      mutate:
        patchesJson6902: |
          - op: replace
            path: /spec/containers/0/image
            value: "registry.company.com/{{request.object.spec.containers[0].image}}"
```

### Pattern 5: Inject Environment Variables

**Requirement**: Add required environment variables to all containers

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: inject-environment-variables
spec:
  rules:
    - name: inject-env
      match:
        resources:
          kinds:
            - Pod
      mutate:
        patchStrategicMerge:
          spec:
            containers:
              - env:
                  - name: COMPANY_ENV
                    value: production
                  - name: LOG_LEVEL
                    value: info
                  - name: METRICS_PORT
                    value: "8080"
```

### Pattern 6: Add Storage Limits

**Requirement**: Enforce ephemeral storage limits

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: add-storage-limits
spec:
  rules:
    - name: add-ephemeral-storage
      match:
        resources:
          kinds:
            - Pod
      mutate:
        patchStrategicMerge:
          spec:
            containers:
              - resources:
                  limits:
                    ephemeral-storage: 1Gi
                  requests:
                    ephemeral-storage: 100Mi
```

### Pattern 7: Enforce Network Policies

**Requirement**: Auto-create default deny network policies

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: auto-create-network-policy
spec:
  rules:
    - name: create-default-deny
      match:
        resources:
          kinds:
            - Namespace
          selector:
            matchLabels:
              enforce-netpol: "true"
      generate:
        kind: NetworkPolicy
        name: default-deny-all
        namespace: "{{request.object.metadata.name}}"
        data:
          apiVersion: networking.k8s.io/v1
          kind: NetworkPolicy
          metadata:
            name: default-deny-all
          spec:
            podSelector: {}
            policyTypes:
              - Ingress
              - Egress
```

---

## Combined Validation + Mutation Patterns

### Pattern 1: Enforce with Automatic Remediation

Validate requirement, then mutate if missing:

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-and-mutate-seccontext
spec:
  validationFailureAction: audit # Audit first
  rules:
    # Mutation rule - runs first
    - name: add-security-context
      match:
        resources:
          kinds:
            - Pod
      mutate:
        patchStrategicMerge:
          spec:
            containers:
              - securityContext:
                  runAsNonRoot: true
                  allowPrivilegeEscalation: false

    # Validation rule - enforces standards
    - name: validate-security-context
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
                  allowPrivilegeEscalation: false
```

### Pattern 2: Progressive Enforcement

Different rules for different scenarios:

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: progressive-enforcement
spec:
  rules:
    # Step 1: Auto-add labels for easy tracking
    - name: mutate-add-labels
      match:
        resources:
          kinds:
            - Pod
      mutate:
        patchStrategicMerge:
          metadata:
            labels:
              audit-timestamp: "{{now}}"

    # Step 2: Audit non-compliant configurations
    - name: validate-audit
      match:
        resources:
          kinds:
            - Pod
      validationFailureAction: audit
      validate:
        message: "Should follow security standards"
        pattern:
          spec:
            securityContext:
              runAsNonRoot: true

  # Step 3: Eventually enforce (after audit period)
  # - name: validate-enforce
  #   match:
  #     resources:
  #       kinds:
  #       - Pod
  #   validationFailureAction: enforce
  #   validate:
  #     message: "Must follow security standards"
  #     pattern:
  #       spec:
  #         securityContext:
  #           runAsNonRoot: true
```

---

## Performance Optimization Patterns

### Pattern 1: Exclude System Namespaces

Avoid unnecessary policy evaluation:

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: optimized-policy
spec:
  rules:
    - name: my-rule
      match:
        resources:
          kinds:
            - Pod
      exclude:
        resources:
          namespaces:
            - kyverno
            - kube-system
            - kube-node-lease
            - kube-public
      validate:
        message: "Policy rule"
        pattern:
          spec:
            containers:
              - resources:
                  limits:
                    cpu: "?*"
```

### Pattern 2: Use Preconditions

Only evaluate when necessary:

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: conditional-evaluation
spec:
  rules:
    - name: validate-with-precondition
      match:
        resources:
          kinds:
            - Pod
      preconditions:
        all:
          - key: "{{request.operation}}"
            operator: In
            values:
              - CREATE
              - UPDATE
          - key: "{{request.object.metadata.namespace}}"
            operator: NotEqual
            value: kyverno
      validate:
        message: "Policy applies only on CREATE/UPDATE in non-system namespaces"
        pattern:
          spec:
            containers:
              - resources: {}
```

### Pattern 3: Early Exit with CEL

Optimize CEL expressions:

```yaml
apiVersion: kyverno.io/v1alpha2
kind: ValidatingPolicy
metadata:
  name: optimized-cel
spec:
  rules:
    - name: validate-with-early-exit
      match:
        resources:
          kinds:
            - Pod
      validate:
        cel:
          expressions:
            - expression: |
                !has(object.spec.containers[0].securityContext) ||
                object.spec.containers[0].securityContext.runAsNonRoot == true
              message: "Containers must run as non-root"
```

---

## Testing Patterns

### Testing Validations

```bash
#!/bin/bash

# Test 1: Should pass
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: valid-pod
spec:
  containers:
  - name: app
    image: nginx:latest
    resources:
      limits:
        cpu: 100m
        memory: 128Mi
EOF

# Test 2: Should fail
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: invalid-pod
spec:
  containers:
  - name: app
    image: nginx:latest
    # Missing resource limits
EOF
```

### Testing Mutations

```bash
#!/bin/bash

# Apply without label
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: test-mutation
spec:
  containers:
  - name: app
    image: nginx
EOF

# Check if mutation was applied
kubectl get pod test-mutation -o yaml | grep -A 2 labels:
```

---

## Best Practices

### 1. Start with Audit Mode

```yaml
validationFailureAction: audit # Start here
# Then move to: enforce
```

### 2. Use Specific Selectors

```yaml
match:
  resources:
    kinds:
      - Pod
    namespaceSelector:
      matchLabels:
        enforce: "true" # Specific scope
```

### 3. Document Policies

```yaml
metadata:
  annotations:
    description: "Enforce security standards for production workloads"
    owner: "security-team"
    tickets: "INFRA-1234,SEC-5678"
```

### 4. Use CEL for Complex Logic

```yaml
validate:
  cel:
    expressions:
      - expression: |
          # More readable for complex conditions
          object.spec.containers.all(c, c.resources.limits.cpu != null)
```

### 5. Layer Policies

Combine validation, mutation, and generation for comprehensive enforcement.

---

## Summary

Master these patterns to build effective Kyverno policies:

- **Validation**: Block non-compliant resources
- **Mutation**: Auto-remediate resource configurations
- **Combination**: Validate with automatic fixes
- **Performance**: Optimize evaluation with exclusions and conditions
- **Testing**: Verify policies work as expected

Use these patterns as templates for your specific requirements.
