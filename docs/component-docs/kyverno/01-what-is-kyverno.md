---
id: what-is-kyverno
title: What is Kyverno?
description: Kyverno is a cloud native policy engine that enables policy-as-code for Kubernetes and beyond with declarative YAML-based policies.
---

[Kyverno](https://kyverno.io/) (Greek for "govern") is a cloud native policy engine designed for Kubernetes and extending to policy management outside of Kubernetes. It enables platform engineers and operators to automate security, compliance, and best practices validation at scale.

Kyverno allows you to write policies as simple YAML resources with no new language to learn, making policy-as-code accessible and maintainable across your organization.

## Key Philosophy

**Kyverno believes that policies should be:**

- **Simple** - Written in familiar YAML, not a new DSL
- **Declarative** - Treat policies like code stored in Git
- **Powerful** - Support complex validations and mutations
- **Flexible** - Enforce, audit, or generate policy violations
- **Accessible** - Require no special language knowledge

## What Problems Does Kyverno Solve?

### Security and Compliance

Without Kyverno, security teams struggle to:

- ❌ Enforce consistent security standards across clusters
- ❌ Prevent insecure container images from running
- ❌ Validate resource configurations match organizational standards
- ❌ Audit policy violations and track compliance

With Kyverno:

- ✅ Declaratively define security policies as YAML
- ✅ Automatically validate and block non-compliant resources
- ✅ Verify container images and supply chain security
- ✅ Generate compliance reports showing policy adherence

### Best Practices Enforcement

Without Kyverno:

- ❌ No consistent resource labeling across teams
- ❌ Difficult to enforce naming conventions
- ❌ Manual verification of resource configurations
- ❌ Inconsistent configurations across environments

With Kyverno:

- ✅ Automatically add required labels to resources
- ✅ Enforce naming patterns and conventions
- ✅ Automatically inject or patch resources
- ✅ Consistent configurations across all deployments

### Operational Safety

Without Kyverno:

- ❌ Applications can run with excessive privileges
- ❌ No control over resource requests and limits
- ❌ Difficult to enforce resource quotas
- ❌ Manual cleanup of resources

With Kyverno:

- ✅ Require resource requests and limits
- ✅ Prevent privilege escalation
- ✅ Automatically generate required resources
- ✅ Clean up resources automatically

## Core Capabilities

Kyverno provides four main policy functions:

### Validate

Ensure resources conform to standards. Policies can audit violations or enforce them immediately.

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-requests-limits
spec:
  validationFailureAction: enforce
  rules:
    - name: validate-resources
      match:
        resources:
          kinds:
            - Pod
      validate:
        message: "CPU and memory requests are required"
        pattern:
          spec:
            containers:
              - resources:
                  requests:
                    memory: "?*"
                    cpu: "?*"
```

### Mutate

Automatically modify resources to add required configurations, labels, or defaults.

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: add-network-policy
spec:
  rules:
    - name: add-network-policy-label
      match:
        resources:
          kinds:
            - Pod
      mutate:
        patchStrategicMerge:
          metadata:
            labels:
              network-policy: "restricted"
```

### Generate

Automatically create resources based on triggers. Common use case: generate network policies, role bindings, etc.

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: generate-networkpolicy
spec:
  rules:
    - name: create-network-policy
      match:
        resources:
          kinds:
            - Namespace
      generate:
        kind: NetworkPolicy
        name: default-deny
        namespace: "{{request.object.metadata.name}}"
        data:
          spec:
            podSelector: {}
            policyTypes:
              - Ingress
```

### Verify Images

Verify container images are signed and come from trusted registries.

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: verify-images
spec:
  validationFailureAction: enforce
  rules:
    - name: verify-signature
      match:
        resources:
          kinds:
            - Pod
      verifyImages:
        - imageReferences:
            - "gcr.io/mycompany/*"
          attestors:
            - count: 1
              entries:
                - keys:
                    publicKeys: |
                      -----BEGIN PUBLIC KEY-----
                      ...
                      -----END PUBLIC KEY-----
```

## Deployment Modes

Kyverno policies enforce through multiple mechanisms:

### Admission Controller

- **When**: At resource creation/update time
- **Effect**: Block or audit policy violations in real-time
- **Best for**: Preventing non-compliant resources immediately

### Background Scanner

- **When**: Continuously scanning existing resources
- **Effect**: Detect violations in existing clusters
- **Best for**: Compliance auditing and reporting

### CLI

- **When**: Local development or CI/CD pipeline
- **Effect**: Validate resources before submission
- **Best for**: Testing and validation early

### Web Service

- **When**: External policy evaluation
- **Effect**: Evaluate policies outside cluster
- **Best for**: Multi-cluster or non-Kubernetes workloads

## Policy Types

Kyverno supports multiple policy types for different use cases:

### ClusterPolicy

Cluster-scoped policies applying to all namespaces

- Security standards
- Platform requirements
- Cluster-wide compliance

### Policy

Namespace-scoped policies

- Team-specific rules
- Development environment customizations
- Namespace isolation

### ValidatingPolicy (Alpha)

CEL-based validation policies (Kubernetes native extension)

- Complex validations
- Advanced conditional logic
- Integration with Kubernetes API

### MutatingPolicy (Alpha)

CEL-based mutation policies (Kubernetes native extension)

- Complex mutations
- Advanced conditional logic
- Integration with Kubernetes API

## Policy Actions

Control how policy violations are handled:

### Enforce

Block violating resources immediately. Violations are not created.

```yaml
spec:
  validationFailureAction: enforce
```

### Audit

Allow violating resources but record violations in policy reports.

```yaml
spec:
  validationFailureAction: audit
```

## Reporting and Visibility

Kyverno automatically generates policy reports using the CNCF Policy Working Group format:

- **PolicyReport** - Namespace-scoped reports of violations
- **ClusterPolicyReport** - Cluster-scoped reports of violations
- **Real-time events** - Kubernetes events for immediate visibility
- **Metrics** - Prometheus metrics for monitoring policy behavior

Reports show:

- ✅ Pass/fail results for each resource
- 📊 Policy execution metrics
- 🏷️ Resource categorization and severity
- 📝 Detailed messages for each violation

## Policy Exceptions

Create fine-grained exceptions to policies for special cases:

```yaml
apiVersion: kyverno.io/v2
kind: PolicyException
metadata:
  name: legacy-tool-exception
  namespace: tools
spec:
  exceptions:
    - policyName: disallow-privileged
      ruleNames:
        - require-non-root
  match:
    resources:
      kinds:
        - Pod
      names:
        - legacy-tool*
```

## Use Cases

### Platform Teams

- Enforce infrastructure standards across the organization
- Ensure consistent resource naming and tagging
- Prevent security vulnerabilities at admission

### DevOps/SRE

- Automate compliance scanning
- Generate required resources automatically
- Monitor policy violations in production

### Security Teams

- Enforce image validation and supply chain security
- Prevent privilege escalation
- Audit resource configurations

### Development Teams

- Validate resources locally before submission
- Understand organizational requirements
- Get early feedback on resource configurations

## Integration with the Ecosystem

Kyverno integrates with:

- **Kubernetes** - Native admission controller
- **CI/CD** - CLI for pipeline integration (GitHub Actions, GitLab CI, Jenkins)
- **ArgoCD** - Pre-sync validation
- **GitOps** - Policies stored and versioned in Git
- **Policy Reporters** - Extended reporting and visualization
- **Supply Chain Security** - Container image verification
- **Observability** - Prometheus metrics and events

## Getting Started

To learn more about Kyverno:

- **[Technical Overview](./02-technical-overview.md)** - Understand Kyverno architecture and design
- **[Core Concepts](./03-core-concepts.md)** - Learn key terminology and concepts
- **[Policy Types](./04-policy-types.md)** - Explore different policy types and capabilities

For installation and quick start, see the [Kyverno documentation](https://kyverno.io/docs/).
