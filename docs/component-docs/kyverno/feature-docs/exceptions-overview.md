---
id: exceptions-overview
title: Policy Exceptions and Exemptions
description: Managing policy exceptions, exemptions, and fine-grained policy exclusions in Kyverno
---

# Policy Exceptions and Exemptions

## Overview

Policy Exceptions provide a mechanism to selectively exempt resources from policy enforcement. Rather than disabling policies entirely or using broad exclusions, exceptions enable fine-grained control over which specific resources bypass policy checks while maintaining security enforcement for the rest of your cluster.

---

## Understanding Exceptions

### What are Exceptions?

Exceptions are Kubernetes resources that specify which resources should be excluded from policy evaluation. They provide:

- **Fine-grained exemptions** for specific resources
- **Temporary exceptions** with time-based controls
- **Audit trail** of all exemptions
- **Clear justification** for exceptions
- **Team-friendly** management of exceptions

### Exception Anatomy

```yaml
apiVersion: kyverno.io/v1
kind: PolicyException
metadata:
  name: allow-legacy-app-privileged
  namespace: production
spec:
  exceptions:
    - ruleNames:
        - check-privileged-container
        - check-host-network
      policyName: pod-security-standard
  match:
    resources:
      kinds:
        - Pod
      selector:
        matchLabels:
          app: legacy-billing-app
```

---

## Exception Types

### Resource-Based Exceptions

Exempt specific resources by name or label:

```yaml
apiVersion: kyverno.io/v1
kind: PolicyException
metadata:
  name: exception-old-jenkins
  namespace: ci-cd
spec:
  exceptions:
    - ruleNames:
        - validate-image-registry
      policyName: image-policy
  match:
    resources:
      kinds:
        - Pod
      names:
        - jenkins-master-*
```

### Namespace-Wide Exceptions

Exempt all resources in specific namespaces:

```yaml
apiVersion: kyverno.io/v1
kind: PolicyException
metadata:
  name: dev-environment-exemption
  namespace: kyverno # Cluster-level exception
spec:
  exceptions:
    - ruleNames:
        - validate-security-context
        - enforce-resource-limits
      policyName: pod-security-standard
  match:
    resources:
      kinds:
        - Pod
      namespaceSelector:
        matchLabels:
          environment: development
```

### Label-Selector Exceptions

Exempt resources matching specific labels:

```yaml
apiVersion: kyverno.io/v1
kind: PolicyException
metadata:
  name: exception-third-party-app
spec:
  exceptions:
    - ruleNames:
        - check-image-signature
      policyName: supply-chain-security
  match:
    resources:
      kinds:
        - Pod
      selector:
        matchLabels:
          vendor: third-party
          exception-approved: "true"
```

### User-Based Exceptions

Exempt resources created by specific users:

```yaml
apiVersion: kyverno.io/v1
kind: PolicyException
metadata:
  name: exception-system-admin
  namespace: kyverno
spec:
  exceptions:
    - ruleNames:
        - enforce-all-rules
      policyName: security-baseline
  match:
    subjects:
      - kind: User
        name: system:admin
      - kind: ServiceAccount
        name: kyverno-admin
        namespace: kyverno
```

### Time-Limited Exceptions

Create exceptions that automatically expire:

```yaml
apiVersion: kyverno.io/v1
kind: PolicyException
metadata:
  name: temp-exception-migration
  namespace: production
  annotations:
    expires-at: "2024-12-31T23:59:59Z"
    reason: "Database migration window"
spec:
  exceptions:
    - ruleNames:
        - require-pod-security
      policyName: pod-security-standard
  match:
    resources:
      kinds:
        - Pod
      selector:
        matchLabels:
          component: database-migration
```

### Rule-Specific Exceptions

Exempt only specific rules within a policy:

```yaml
apiVersion: kyverno.io/v1
kind: PolicyException
metadata:
  name: exception-mutation-rules-only
spec:
  exceptions:
    - ruleNames:
        - add-default-network-policy # Only this rule
        - inject-monitoring-sidecar # Only this rule
      policyName: infrastructure-policy
  match:
    resources:
      kinds:
        - Pod
      namespaceSelector:
        matchLabels:
          legacy: "true"
```

---

## Exception Configuration

### Creating Exceptions

#### Basic Exception

```yaml
apiVersion: kyverno.io/v1
kind: PolicyException
metadata:
  name: allow-privileged-jenkins
  namespace: ci-cd
spec:
  exceptions:
    - ruleNames:
        - check-privileged-container
      policyName: pod-security
  match:
    resources:
      kinds:
        - Pod
      names:
        - jenkins-*
```

#### Comprehensive Exception

```yaml
apiVersion: kyverno.io/v1
kind: PolicyException
metadata:
  name: data-processing-exception
  namespace: data-team
  labels:
    team: data-processing
    urgency: high
  annotations:
    requested-by: "data-team-lead"
    business-justification: "Real-time data ingestion requires high-performance settings"
    review-date: "2024-06-30"
    exception-id: "EXC-2024-0152"
spec:
  exceptions:
    - ruleNames:
        - validate-resource-limits
        - check-security-context
        - verify-image-signature
      policyNames:
        - pod-security
        - security-baseline
  match:
    resources:
      kinds:
        - Pod
        - Deployment
      selector:
        matchLabels:
          workload: data-processing
          approved-exception: "true"
    namespaceSelector:
      matchLabels:
        team: data-processing
  conditions:
    all:
      - key: "{{request.operation}}"
        operator: In
        value:
          - CREATE
          - UPDATE
```

### Exception Scope

#### Namespaced Exception

Managed by team, applies to their namespace:

```yaml
apiVersion: kyverno.io/v1
kind: PolicyException
metadata:
  namespace: team-a # Team-scoped
  name: team-a-exceptions
```

#### Cluster-Wide Exception

Managed by cluster admin, applies across cluster:

```yaml
apiVersion: kyverno.io/v1
kind: PolicyException
metadata:
  namespace: kyverno # Cluster-scoped convention
  name: cluster-exceptions
```

---

## Exception Management

### Listing Exceptions

```bash
# List exceptions in namespace
kubectl get policyexceptions -n production

# List all exceptions
kubectl get policyexceptions -A

# Show exception details
kubectl describe policyexception allow-privileged-jenkins -n ci-cd

# Export exceptions
kubectl get policyexceptions -A -o yaml > exceptions-backup.yaml
```

### Modifying Exceptions

```bash
# Edit exception
kubectl edit policyexception allow-privileged-jenkins -n ci-cd

# Add label
kubectl label policyexception allow-privileged-jenkins -n ci-cd status=approved

# Add annotation with review date
kubectl annotate policyexception allow-privileged-jenkins -n ci-cd \
  reviewed-at="2024-03-15" --overwrite

# Patch to add rules
kubectl patch policyexception allow-privileged-jenkins -n ci-cd --type merge -p \
  '{"spec":{"exceptions":[{"ruleNames":["additional-rule"],"policyName":"pod-security"}]}}'
```

### Deleting Exceptions

```bash
# Delete single exception
kubectl delete policyexception allow-privileged-jenkins -n ci-cd

# Delete all exceptions in namespace
kubectl delete policyexceptions -n ci-cd

# Delete exceptions by label
kubectl delete policyexceptions -A -l team=deprecated-service
```

---

## Exception Use Cases

### Use Case 1: Legacy Application Exemption

A legacy application doesn't support security best practices:

```yaml
apiVersion: kyverno.io/v1
kind: PolicyException
metadata:
  name: legacy-app-exemption
  namespace: production
  annotations:
    reason: "Legacy application incompatible with security policies"
    planned-retirement: "2025-Q2"
    owner: "platform-team"
spec:
  exceptions:
    - ruleNames:
        - require-non-root
        - require-resource-limits
        - verify-image-source
      policyName: pod-security-standard
  match:
    resources:
      kinds:
        - Pod
        - Deployment
      selector:
        matchLabels:
          app: legacy-billing
```

### Use Case 2: Third-Party Service Exemption

Third-party services don't meet all security standards:

```yaml
apiVersion: kyverno.io/v1
kind: PolicyException
metadata:
  name: datadog-exemption
  namespace: kyverno
  annotations:
    service: "Datadog Monitoring"
    why: "Third-party SaaS doesn't support custom security context"
spec:
  exceptions:
    - ruleNames:
        - enforce-security-context
        - require-pod-service-account
      policyName: pod-security-standard
  match:
    resources:
      kinds:
        - Pod
      selector:
        matchLabels:
          app: datadog-agent
```

### Use Case 3: Migration Window Exemption

Temporary exemption during system migration:

```yaml
apiVersion: kyverno.io/v1
kind: PolicyException
metadata:
  name: database-migration-window
  namespace: production
  annotations:
    ticket: "INFRA-5432"
    duration: "24 hours"
    contact: "database-team@company.com"
    expires: "2024-03-16T18:00:00Z"
spec:
  exceptions:
    - ruleNames:
        - check-pod-priority
        - enforce-disruption-budget
      policyName: availability-policy
  match:
    resources:
      kinds:
        - Pod
      selector:
        matchLabels:
          migration: database-v8-upgrade
```

### Use Case 4: Development Environment Exemption

Development environments have relaxed policies:

```yaml
apiVersion: kyverno.io/v1
kind: PolicyException
metadata:
  name: dev-namespace-exemption
  namespace: kyverno
  annotations:
    environment: development
    purpose: "Allow rapid iteration and experimentation"
spec:
  exceptions:
    - ruleNames:
        - enforce-all-rules
      policyName: pod-security-standard
  match:
    resources:
      kinds:
        - Pod
        - Deployment
        - StatefulSet
      namespaceSelector:
        matchLabels:
          environment: development
```

### Use Case 5: Emergency Incident Exemption

Temporary exception for incident response:

```yaml
apiVersion: kyverno.io/v1
kind: PolicyException
metadata:
  name: incident-response-exception
  namespace: kyverno
  labels:
    incident-id: "INC-20240315-001"
    severity: critical
  annotations:
    incident-started: "2024-03-15T14:30:00Z"
    approved-by: "security-oncall"
    expires-at: "2024-03-16T02:30:00Z"
spec:
  exceptions:
    - ruleNames:
        - all # All rules exempted
      policyNames:
        - pod-security-standard
        - network-policy
  match:
    resources:
      kinds:
        - Pod
      selector:
        matchLabels:
          incident-response: INC-20240315-001
```

---

## Exception Review and Governance

### Exception Approval Workflow

```yaml
# Step 1: Team creates exception
apiVersion: kyverno.io/v1
kind: PolicyException
metadata:
  name: new-service-exception
  namespace: production
  labels:
    status: pending-approval
  annotations:
    requested-by: "team-lead"
    reason: "New service requires elevated privileges during startup"
    requested-date: "2024-03-15"
spec:
  exceptions:
  - ruleNames:
    - validate-security-context
    policyName: pod-security-standard
  match:
    resources:
      kinds:
      - Pod
      selector:
        matchLabels:
          app: new-service

# Step 2: Security team reviews and approves
kubectl annotate policyexception new-service-exception \
  -n production \
  "approval-status=approved" \
  "reviewed-by=security-team" \
  "review-date=2024-03-15" \
  --overwrite

# Step 3: Set expiration for periodic review
kubectl annotate policyexception new-service-exception \
  -n production \
  "expires-at=2024-06-15" \
  "review-frequency=quarterly" \
  --overwrite
```

### Exception Audit Trail

Track all exception changes:

```bash
# View exception audit logs
kubectl get events -n production --field-selector involvedObject.kind=PolicyException

# View exception creation history
kubectl get policyexception new-service-exception -n production -o jsonpath='{.metadata.creationTimestamp}'

# Export exception audit trail
kubectl describe policyexception new-service-exception -n production | grep -E "(Age|Events|Reason)"
```

### Exception Reporting

Generate exception report:

```bash
#!/bin/bash

echo "=== Kyverno Policy Exceptions Report ==="
echo "Generated: $(date)"
echo ""

echo "Exception Summary:"
kubectl get policyexceptions -A -o json | jq '.items | length'

echo ""
echo "Exceptions by Namespace:"
kubectl get policyexceptions -A -o json | jq -r '.items[] | .metadata.namespace' | sort | uniq -c

echo ""
echo "Exceptions by Policy:"
kubectl get policyexceptions -A -o json | jq -r '.items[].spec.exceptions[].policyName' | sort | uniq -c

echo ""
echo "Expiring Exceptions (next 30 days):"
CUTOFF=$(date -d "+30 days" +%s)
kubectl get policyexceptions -A -o json | jq -r '.items[] |
  select(.metadata.annotations["expires-at"] |
  fromdate <= '${CUTOFF}') |
  "\(.metadata.namespace): \(.metadata.name) - expires: \(.metadata.annotations["expires-at"])"'

echo ""
echo "High-Risk Exceptions (exempting security rules):"
kubectl get policyexceptions -A -o json | jq -r '.items[] |
  select(.spec.exceptions[].ruleNames[] | contains("security") or contains("privileged")) |
  "\(.metadata.namespace): \(.metadata.name) - rules: \(.spec.exceptions[].ruleNames[])"'
```

---

## Best Practices

### 1. Use Exceptions Sparingly

Create exceptions only when necessary:

```yaml
# GOOD: Specific exception for known requirement
apiVersion: kyverno.io/v1
kind: PolicyException
metadata:
  name: datadog-agent-exception
spec:
  exceptions:
    - ruleNames:
        - check-host-network
      policyName: pod-security-standard
  match:
    resources:
      kinds:
        - DaemonSet
      selector:
        matchLabels:
          app: datadog-agent
```

### 2. Document Everything

Include comprehensive annotations:

```yaml
metadata:
  annotations:
    requested-by: "team-lead@company.com"
    business-justification: "Service requires host network for performance"
    approval-ticket: "INFRA-4521"
    expires-at: "2024-06-30"
    review-frequency: "quarterly"
    owner: "platform-team"
```

### 3. Set Expiration Dates

Temporary exceptions should auto-review:

```yaml
metadata:
  annotations:
    expires-at: "2024-06-30T23:59:59Z"
    review-frequency: "monthly"
```

### 4. Use Labels for Organization

Tag exceptions for easy discovery:

```yaml
metadata:
  labels:
    risk-level: medium
    team: database-platform
    environment: production
    exemption-type: legacy-app
```

### 5. Implement Approval Process

Require security review:

```bash
# Only Security team can create exceptions
kubectl create role policy-exception-creator \
  --verb=create --resource=policyexceptions

# Require annotation for approval before enforcement
# Use admission webhook to enforce this
```

### 6. Regular Exception Audits

Periodically review and clean up:

```bash
#!/bin/bash

# Find unused exceptions (no matching resources)
for pex in $(kubectl get policyexceptions -A -o name); do
  matches=$(kubectl get pods -A -l $(kubectl get $pex -o jsonpath='{.spec.match.resources.selector.matchLabels}' | jq -r 'to_entries | map("\(.key)=\(.value)") | join(",")') 2>/dev/null | wc -l)
  if [ $matches -eq 1 ]; then
    echo "Unused: $pex"
  fi
done
```

---

## Common Exception Scenarios

### Scenario 1: Jenkins Pipeline Needs Root

```yaml
apiVersion: kyverno.io/v1
kind: PolicyException
metadata:
  name: jenkins-root-exception
  namespace: ci-cd
spec:
  exceptions:
    - ruleNames:
        - require-non-root
      policyName: pod-security-standard
  match:
    resources:
      kinds:
        - Pod
      selector:
        matchLabels:
          jenkins-agent: "true"
```

### Scenario 2: Database Backup Needs Host Storage

```yaml
apiVersion: kyverno.io/v1
kind: PolicyException
metadata:
  name: backup-host-storage
  namespace: databases
spec:
  exceptions:
    - ruleNames:
        - validate-volume-types
      policyName: storage-policy
  match:
    resources:
      kinds:
        - Pod
      names:
        - backup-*
```

### Scenario 3: GPU Workload Needs Privileged Mode

```yaml
apiVersion: kyverno.io/v1
kind: PolicyException
metadata:
  name: gpu-workload-privileged
  namespace: ml-team
spec:
  exceptions:
    - ruleNames:
        - check-privileged
      policyName: pod-security-standard
  match:
    resources:
      kinds:
        - Pod
      selector:
        matchLabels:
          workload: gpu-compute
```

---

## Troubleshooting Exceptions

### Exception Not Being Applied

**Problem**: Exception created but policy still blocks resource

**Causes**:

- Exception namespace doesn't match
- Selector labels don't match
- Policy name misspelled

**Solution**:

```bash
# Verify exception exists
kubectl get policyexceptions -A

# Check exception details
kubectl describe policyexception my-exception

# Test matching manually
kubectl get pods -l app=my-app --all-namespaces
```

### Exception Blocking Too Much

**Problem**: Exception exempts more than intended

**Solution**:

```bash
# Make exception more specific with additional selectors
kubectl patch policyexception my-exception --type merge -p \
  '{"spec":{"match":{"resources":{"selector":{"matchLabels":{"component":"specific-component"}}}}}}'
```

---

## Summary

Policy Exceptions provide fine-grained control over policy enforcement:

- **Resource-specific exemptions**: Target exact resources
- **Time-limited exceptions**: Temporary exemptions with expiration
- **Governance tracking**: Audit and approval trails
- **Flexible matching**: Label, name, namespace, and user-based
- **Best practices**: Document, expire, and review regularly

Use exceptions strategically to balance security enforcement with operational flexibility.
