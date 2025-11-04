---
id: core-concepts
title: Core Concepts
description: Essential Kyverno concepts and terminology for understanding policy-as-code
---

Before writing and deploying Kyverno policies, it's important to understand the core concepts and terminology that define how Kyverno operates.

## Policy

A **Policy** is a Kubernetes custom resource that defines rules for validating, mutating, or generating resources.

**Characteristics**:

- **Declarative** - Defined in YAML, stored in Git
- **Reusable** - Can be applied to many resources
- **Versioned** - Policy changes tracked in Git history
- **Enforceable** - Applied automatically to all matching resources

Policies have two scope options:

- **Policy** - Namespace-scoped, applies within a namespace
- **ClusterPolicy** - Cluster-scoped, applies to all namespaces

## Rule

A **Rule** is a single policy guideline within a Policy resource.

**Key components**:

- **Name** - Identifier for the rule
- **Match** - Conditions for which resources the rule applies
- **Type** - What action the rule performs (validate, mutate, generate, verify)
- **Action** - What happens when the rule is applied

Multiple rules can exist in a single policy:

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: security-policies
spec:
  rules:
    - name: require-labels # Rule 1
      match: ...
      validate: ...

    - name: add-network-policy # Rule 2
      match: ...
      generate: ...
```

## Match and Exclude

**Match** defines which resources a rule applies to.

### Match Criteria

Resources are selected using:

```yaml
match:
  resources:
    kinds: # Kubernetes resource types
      - Pod
      - Deployment
    namespaces: # Namespaces
      - production
      - staging
    names: # Resource names (wildcards)
      - app-*
    selector: # Label selectors
      matchLabels:
        app: critical
    annotations: # Annotation matching
      team: platform
  operations: # Admission operations
    - CREATE
    - UPDATE
  subjects: # Service accounts
    - name: deployer
```

### Exclude Criteria

Resources can be excluded from rules:

```yaml
exclude:
  resources:
    namespaces:
      - kyverno
      - kube-system
    names:
      - kyverno-*
      - system-*
```

Logical operators:

- **any** - Match if any condition is true (OR)
- **all** - Match if all conditions are true (AND)

## Preconditions

**Preconditions** are checks performed before a rule executes.

```yaml
preconditions:
  any:
    - key: "{{ request.object.metadata.labels.environment }}"
      operator: Equals
      value: production
```

Common operators:

- **Equals** - Exact match
- **NotEquals** - Inverse match
- **In** - Value in list
- **NotIn** - Value not in list
- **AnyIn** - Any value in list

Preconditions are evaluated before resource creation/update, allowing early exit if conditions aren't met.

## Validation Rules

A **Validation Rule** checks if a resource matches expected patterns.

### Pattern Matching

Patterns define expected structure:

```yaml
validate:
  pattern:
    spec:
      containers:
        - resources:
            requests:
              memory: "?*" # Must have memory request
              cpu: "?*" # Must have cpu request
```

Pattern operators:

- `?*` - Optional (must be present if specified)
- `?` - Optional value
- `*` - Any value
- `X | Y` - One of multiple values

### Anchors

Anchors modify pattern matching behavior:

```yaml
spec:
  =(hostNetwork): "false" # Disallow hostNetwork=true
  =(containers): # Exactly these fields
    - name: "*"
```

Anchor types:

- `=` - Equality anchor (exact match)
- `^` - Negation anchor (must not match)
- `>` - Wild card anchor (at least one)
- `<` - Wildcard anchor (arbitrary depth)

### Deny Rules

Negative validation - explicitly deny certain configurations:

```yaml
deny:
  conditions:
    any:
      - key: "{{ request.object.spec.securityContext.privileged }}"
        operator: Equals
        value: "true"
```

## Mutation Rules

A **Mutation Rule** modifies a resource before it's stored.

### Strategic Merge Patches

Overlay-based mutations:

```yaml
mutate:
  patchStrategicMerge:
    metadata:
      labels:
        managed-by: kyverno
    spec:
      template:
        spec:
          serviceAccountName: default
```

### JSON Patches

RFC 6902 JSON Patch format:

```yaml
mutate:
  patchesJson6902:
    - op: add
      path: /metadata/labels/version
      value: v1.0.0
    - op: replace
      path: /spec/replicas
      value: 3
```

JSON Patch operations:

- **add** - Add a value
- **remove** - Remove a value
- **replace** - Change a value
- **move** - Move a value
- **copy** - Copy a value
- **test** - Test a value

## Generation Rules

A **Generation Rule** creates new resources based on triggers.

```yaml
generate:
  kind: NetworkPolicy
  name: default-network-policy
  namespace: "{{ request.object.metadata.name }}"
  data:
    spec:
      podSelector: {}
      policyTypes:
        - Ingress
        - Egress
```

### Generation Triggers

Rules trigger on:

- **Namespace creation** - Generate resources in new namespaces
- **Deployment creation** - Generate associated resources
- **Custom triggers** - Any resource kind

### Generation Synchronization

Generated resources can be:

- **Synchronized** - Kept in sync with policy updates
- **Independent** - Not updated after generation

## Failure Action

**Failure Action** determines what happens when a validation rule fails.

### Enforce

Resource creation is blocked:

```yaml
validationFailureAction: enforce
```

- ❌ Non-compliant resources rejected
- 📛 Violation appears as blocked event
- ⏹️ No policy report entry (blocked before creation)

### Audit

Resource is allowed, violation is reported:

```yaml
validationFailureAction: audit
```

- ✅ Non-compliant resources allowed
- 📊 Violation recorded in PolicyReport
- 📈 Violations tracked for compliance

## Policy Reports

**Policy Reports** are Kubernetes resources that record policy evaluation results.

### Report Types

- **PolicyReport** - Namespace-scoped, contains violations in that namespace
- **ClusterPolicyReport** - Cluster-scoped, contains cluster resource violations

### Report Contents

```yaml
apiVersion: wgpolicyk8s.io/v1alpha2
kind: PolicyReport
metadata:
  name: pod-report
  namespace: default
results:
  - policy: require-labels
    rule: check-labels
    result: fail # pass, fail, skip, warn, error
    message: "label required"
    severity: medium
    category: "Security"
    scored: true # Affects policy score
summary:
  pass: 10
  fail: 2
  skip: 0
  warn: 0
  error: 0
```

Result types:

- **pass** - Resource complies with rule
- **fail** - Resource violates rule
- **skip** - Rule not evaluated (precondition failed)
- **warn** - Resource partially complies
- **error** - Error evaluating rule

## Policy Exceptions

A **PolicyException** is a resource that exempts specific resources from policy rules.

```yaml
apiVersion: kyverno.io/v2
kind: PolicyException
metadata:
  name: legacy-app-exception
  namespace: default
spec:
  exceptions:
    - policyName: require-requests-limits
      ruleNames:
        - validate-resources
  match:
    resources:
      kinds:
        - Pod
      names:
        - legacy-app*
```

Exception components:

- **policyName** - Which policy to except
- **ruleNames** - Which rules to except
- **match** - Which resources are excepted
- **conditions** - Optional conditions for exception

## Context

**Context** provides external data for policy evaluation.

### Kubernetes Context

Automatically available:

```yaml
{{ request.object }}              # The resource being admitted
{{ request.oldObject }}           # Previous resource (on UPDATE)
{{ request.operation }}           # Operation (CREATE, UPDATE, etc)
{{ request.userInfo }}            # User information
{{ request.namespace }}           # Target namespace
{{ serviceAccountName }}          # Service account creating resource
```

### External Context

Query external APIs or Kubernetes resources:

```yaml
context:
  - name: deployment
    apiCall:
      urlPath: "/api/v1/namespaces/{{ request.namespace }}/deployments/{{ request.object.metadata.name }}"
      jmesPath: "spec.replicas"
```

### Dynamic References

Use context in rules:

```yaml
pattern:
  spec:
    replicas: "{{ deployment.spec.replicas }}"
```

## Conditions

**Conditions** evaluate true/false expressions for rule execution.

### Comparison Operators

```yaml
- key: "{{ request.operation }}"
  operator: In
  value:
    - CREATE
    - UPDATE

- key: "{{ request.object.spec.replicas }}"
  operator: GreaterThan
  value: 3

- key: "{{ request.object.metadata.namespace }}"
  operator: NotEqual
  value: default
```

Operators:

- **Equals / NotEquals** - Exact match
- **In / NotIn** - Value in set
- **GreaterThan / LessThan** - Numeric comparison
- **AnyIn / AllIn** - Set operations
- **DenyWildcard** - Wildcard patterns

## Severity

**Severity** indicates the importance of a policy violation.

Levels:

- **critical** - Security or compliance critical
- **high** - Significant issues
- **medium** - Important but not critical
- **low** - Minor issues
- **info** - Informational

```yaml
rules:
  - name: critical-security
    severity: critical

  - name: best-practice
    severity: low
```

## Category

**Category** groups related rules:

```yaml
rules:
  - name: pod-security
    category: "Pod Security Standards"

  - name: image-security
    category: "Image Security"
```

Common categories:

- Pod Security Standards
- Image Security
- Resource Management
- Best Practices
- Compliance

## Autogeneration

Kyverno can automatically generate pod-level rules from rules written for pod controllers.

```yaml
rules:
  - name: require-labels
    match:
      resources:
        kinds:
          - Deployment # Rule written for Deployment
          - StatefulSet
    validate: ...
    # Kyverno auto-generates rules for:
    # - Pod (the actual pod created by Deployment)
    # - ReplicaSet (intermediate controller)
```

Auto-generated rules are prefixed with `autogen-`.

## Summary

Core concepts work together:

| Concept            | Purpose                             |
| ------------------ | ----------------------------------- |
| **Policy**         | Container for rules                 |
| **Rule**           | Single policy guideline             |
| **Match**          | Which resources the rule applies to |
| **Precondition**   | Pre-flight checks before evaluation |
| **Validate**       | Check resource matches pattern      |
| **Mutate**         | Modify resource                     |
| **Generate**       | Create resources                    |
| **Verify**         | Check signatures                    |
| **Failure Action** | What happens on violation           |
| **Report**         | Records of policy evaluation        |
| **Exception**      | Override for specific resources     |
| **Context**        | External data for evaluation        |
| **Condition**      | Expression evaluation               |

## See Also

- [What is Kyverno](./01-what-is-kyverno.md) - Introduction
- [Technical Overview](./02-technical-overview.md) - Architecture and design
- [Policy Types](./04-policy-types.md) - Different policy types
