---
id: policy-reporting-overview
title: Policy Reporting and Compliance
description: Understanding Kyverno policy reports, compliance tracking, and audit trails
---

# Policy Reporting and Compliance

## Overview

Kyverno's reporting capabilities provide comprehensive visibility into policy violations, compliance status, and audit trails. Policy Reports track validation failures, mutations, and policy execution across your Kubernetes clusters, enabling compliance tracking and security auditing.

---

## Policy Reports

### What are Policy Reports?

Policy Reports are Kubernetes custom resources that document policy violations and compliance data. Kyverno automatically generates reports when policies are evaluated, creating an audit trail of policy activity.

### Types of Reports

#### PolicyReport (Namespaced)

A namespaced report documenting violations for resources in that namespace:

```yaml
apiVersion: wgpolicyk8s.io/v1alpha2
kind: PolicyReport
metadata:
  name: polr-default
  namespace: default
results:
  - policy: require-resource-limits
    rule: validate-limits
    result: fail
    scored: true
    resources:
      - apiVersion: v1
        kind: Pod
        name: nginx-deploy-abc123
        namespace: default
    message: "CPU and memory limits required"
    timestamp:
      seconds: 1699564800
summary:
  pass: 5
  fail: 2
  warn: 0
  error: 0
  skip: 0
```

#### ClusterPolicyReport (Cluster-Scoped)

A cluster-wide report documenting violations for cluster-scoped resources:

```yaml
apiVersion: wgpolicyk8s.io/v1alpha2
kind: ClusterPolicyReport
metadata:
  name: clusterpolicyreport
results:
  - policy: require-pod-security
    rule: check-privileged
    result: fail
    scored: true
    resources:
      - apiVersion: v1
        kind: Pod
        name: privileged-pod
        namespace: kube-system
    message: "Privileged containers not allowed"
summary:
  pass: 152
  fail: 8
  warn: 3
  error: 0
  skip: 2
```

### Report Fields

| Field          | Description                                      |
| -------------- | ------------------------------------------------ |
| **policy**     | Name of the policy that generated the result     |
| **rule**       | Name of the rule within the policy               |
| **result**     | Outcome: pass, fail, warn, error, skip           |
| **scored**     | Whether violation counts toward compliance score |
| **resources**  | Affected Kubernetes resources                    |
| **message**    | Detailed violation message                       |
| **timestamp**  | When the violation was detected                  |
| **properties** | Custom metadata about the violation              |

### Report Results

#### Pass

Resource complies with policy rule:

```yaml
result: pass
message: "Pod has resource limits defined"
```

#### Fail

Resource violates policy rule (blocking):

```yaml
result: fail
message: "CPU limits required but not defined"
```

#### Warn

Resource violates advisory policy:

```yaml
result: warn
message: "Recommended to define resource requests"
```

#### Error

Policy evaluation error:

```yaml
result: error
message: "Unable to evaluate pattern: invalid CEL expression"
```

#### Skip

Policy skipped due to conditions:

```yaml
result: skip
message: "Policy excluded for system namespace"
```

---

## Compliance Tracking

### Compliance Scoring

Compliance scores measure policy adherence:

```
Compliance Score = (Pass + (Warn × 0.5)) / Total Scored Results × 100
```

Example calculation:

- Pass: 95 results
- Fail: 5 results
- Warn: 5 results
- Score: (95 + 2.5) / 105 × 100 = 92.6%

### Namespace-Level Compliance

Track compliance by namespace:

```yaml
# Get compliance summary for all namespaces
kubectl get policyreport -A -o json | jq '.items[] |
  {
    namespace: .metadata.namespace,
    pass: .summary.pass,
    fail: .summary.fail,
    compliance: (.summary.pass / (.summary.pass + .summary.fail) * 100)
  }'
```

### Cluster-Wide Compliance

Aggregate compliance across entire cluster:

```bash
# Calculate total compliance
kubectl get clusterpolicyreport -o json | jq '.items[0].summary as $s |
  {
    total_pass: ($s.pass),
    total_fail: ($s.fail),
    compliance: ($s.pass / ($s.pass + $s.fail) * 100)
  }'
```

### Policy-Level Compliance

Track which policies have highest violation rates:

```bash
# Identify most-violated policies
kubectl get policyreport -A -o json | jq -r '.items[].results[] |
  select(.result == "fail") | .policy' | sort | uniq -c | sort -rn
```

---

## Audit Trail Generation

### Enabling Audit Logging

Configure policy audit mode for non-blocking violations:

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: audit-pod-security
spec:
  validationFailureAction: audit # Non-blocking
  rules:
    - name: check-privileges
      match:
        resources:
          kinds:
            - Pod
      validate:
        message: "Privileged containers not recommended"
        pattern:
          spec:
            containers:
              - securityContext:
                  privileged: false
```

When `audit` mode is set, violations are recorded but not blocked. Reports show violations that would be blocked in `enforce` mode.

### Audit Report Format

Audit reports in PolicyReport show failures that didn't block admission:

```yaml
results:
  - policy: pod-security-audit
    rule: check-host-network
    result: fail
    scored: false
    resources:
      - apiVersion: v1
        kind: Pod
        name: network-pod
        namespace: production
    message: "Host network not allowed (audit mode)"
```

### Querying Audit Reports

```bash
# Find all failed audits
kubectl get policyreport -A -o json | jq '.items[].results[] |
  select(.result == "fail")'

# Audit failures by policy
kubectl get policyreport -A -o json | jq '.items[].results[] |
  select(.result == "fail") | {policy, rule, resource: .resources[0].name}'
```

---

## Report Generation Configuration

### Background Scan Configuration

Configure how frequently Kyverno scans existing resources:

```yaml
# In Kyverno Helm values or ConfigMap
kyverno:
  config:
    webhooks:
      - admissionReviewVersions:
          - v1
        clientConfig:
          url: https://kyverno-svc.kyverno:443/validate
        failurePolicy: fail
        name: validate.kyverno.io
        rules:
          - apiGroups:
              - "*"
            apiVersions:
              - "*"
            operations:
              - CREATE
              - UPDATE
            resources:
              - "*"
    background:
      maxQueuedEvents: 1000
      scanInterval: 1h # Rescan existing resources hourly
```

### Report Retention

Kyverno keeps reports indefinitely by default. Configure retention:

```bash
# Configure report TTL (Time-To-Live)
kubectl patch configmap kyverno -n kyverno --type merge -p \
  '{
    "data": {
      "webhooks": "{\"ttlSecondsAfterFinished\": 86400}"
    }
  }'
```

---

## Common Reporting Patterns

### Pattern 1: Compliance Dashboard Query

Create a custom script to generate compliance dashboard:

```bash
#!/bin/bash

echo "=== Kyverno Compliance Dashboard ==="
echo ""

# Cluster-wide summary
echo "Cluster Summary:"
kubectl get clusterpolicyreport -o json | jq '.items[0].summary'

echo ""
echo "Namespace Compliance:"
kubectl get policyreport -A -o json | jq -r '.items[] |
  "\(.metadata.namespace): \(.summary.pass) pass, \(.summary.fail) fail"'

echo ""
echo "Top Violated Policies:"
kubectl get policyreport -A -o json | jq -r '.items[].results[] |
  select(.result == "fail") | .policy' | sort | uniq -c | sort -rn | head -10
```

### Pattern 2: Export Reports to External System

Export violations to compliance tracking system:

```bash
#!/bin/bash

# Export to JSON file
kubectl get policyreport -A -o json > compliance-report.json

# Export violations only
kubectl get policyreport -A -o json | jq '.items[].results[] |
  select(.result == "fail")' > violations.json

# Export to CSV
kubectl get policyreport -A -o json | jq -r '.items[] |
  .results[] | select(.result == "fail") |
  [.policy, .rule, .resources[0].name, .message] | @csv' > violations.csv
```

### Pattern 3: Alert on Policy Violations

Set up monitoring alerts for new violations:

```bash
#!/bin/bash

# Monitor for new failures
watch -n 5 'kubectl get policyreport -A -o json | \
  jq ".items[].results[] | select(.result == \"fail\")" | wc -l'
```

### Pattern 4: Compliance Trending

Track compliance metrics over time:

```bash
#!/bin/bash

# Generate daily compliance snapshot
TIMESTAMP=$(date +%Y-%m-%d-%H:%M:%S)
kubectl get clusterpolicyreport -o json | \
  jq '.items[0].summary' > compliance-$TIMESTAMP.json

# Calculate trend (requires multiple snapshots)
jq -s 'map(.fail) | . as $fails |
  ($fails | length) as $days |
  {
    current_fails: $fails[-1],
    previous_fails: $fails[-2],
    trend: (if $fails[-1] > $fails[-2] then "worsening" else "improving" end)
  }' compliance-*.json
```

---

## Integration with Compliance Tools

### Prometheus Metrics

Export Kyverno metrics for monitoring:

```yaml
# ServiceMonitor for Prometheus
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: kyverno
  namespace: kyverno
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: kyverno
  endpoints:
    - port: metrics
      interval: 30s
```

Key metrics:

- `kyverno_policy_execution_duration_seconds`: Policy evaluation time
- `kyverno_policy_results_total`: Total policy results
- `kyverno_policy_results_fail`: Failed validation count

### Falco Integration

Use Falco for policy violation alerting:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: falco-rules
data:
  kyverno-alerts.yaml: |
    - rule: Kyverno Policy Violation
      desc: Detect Kyverno policy violations
      condition: >
        ka.verb in (CREATE, UPDATE) and 
        response.code = 400 and
        container.image contains "kyverno"
      output: >
        Kyverno policy violation detected
        (user=%user.name verb=%ka.verb resource=%ka.target.resource)
      priority: WARNING
```

### SIEM Integration

Send policy violations to SIEM:

```bash
#!/bin/bash

# Stream violations to syslog
kubectl get policyreport -A -w -o custom-columns=\
NAMESPACE:.metadata.namespace,\
POLICY:.results[0].policy,\
RESULT:.results[0].result | \
while read line; do
  echo "$line" | logger -t kyverno-policy
done
```

---

## Best Practices

### 1. Enable Background Scans

Ensure background scan is enabled to detect violations in existing resources:

```bash
# Verify background scan is enabled
kubectl get configmap kyverno -n kyverno -o yaml | grep -i background
```

### 2. Use Audit Mode for Validation

Test policies in audit mode before enforcement:

```yaml
spec:
  validationFailureAction: audit
```

### 3. Monitor Report Growth

Keep track of report sizes to prevent bloat:

```bash
# Check PolicyReport size
kubectl get policyreport -A -o json | jq '.items | length'
```

### 4. Export Reports Regularly

Create automated backups:

```bash
# Scheduled export
0 2 * * * kubectl get policyreport,clusterpolicyreport -A -o yaml > /backups/kyverno-reports-$(date +\%Y-\%m-\%d).yaml
```

### 5. Create Compliance Baselines

Establish baseline compliance metrics:

```bash
# Initial baseline
kubectl get clusterpolicyreport -o json | jq '.items[0].summary' > baseline.json
```

### 6. Dashboard with Kubernetes Dashboard

Create a custom Kubernetes dashboard view:

```bash
# Install Kubernetes Dashboard with policy report visualization
helm repo add kubernetes-dashboard https://kubernetes.github.io/dashboard/
helm install kubernetes-dashboard kubernetes-dashboard/kubernetes-dashboard
```

---

## Troubleshooting Report Issues

### No Reports Being Generated

**Problem**: PolicyReports are empty

**Causes**:

- Policies in audit mode but not in enforce
- Background scan disabled
- Policies don't match resources

**Solution**:

```bash
# Check policy status
kubectl describe clusterpolicy my-policy

# Enable background scan
kubectl patch configmap kyverno -n kyverno --type merge -p \
  '{
    "data": {
      "webhooks": "{\"background\": \"true\"}"
    }
  }'
```

### Reports Not Updating

**Problem**: Reports show stale data

**Causes**:

- Background scan interval too long
- Reports TTL expired
- Kyverno unable to reconcile

**Solution**:

```bash
# Trigger immediate scan
kubectl delete policyreport --all -A
kubectl delete clusterpolicyreport --all

# Force background controller restart
kubectl rollout restart deployment kyverno-background-controller -n kyverno
```

### Report Size Growing Too Large

**Problem**: Reports consuming excessive storage

**Solution**:

```bash
# Implement TTL for old reports
kubectl patch configmap kyverno -n kyverno --type merge -p \
  '{
    "data": {
      "webhooks": "{\"reportTTL\": \"30d\"}"
    }
  }'
```

---

## Summary

Kyverno's reporting capabilities provide essential compliance tracking:

- **PolicyReport/ClusterPolicyReport**: Automatic violation documentation
- **Compliance Scoring**: Quantify policy adherence
- **Audit Trails**: Track enforcement history
- **External Integration**: Export to compliance and monitoring systems
- **Compliance Dashboards**: Visualize policy status
- **Trending**: Monitor compliance over time

Implement comprehensive reporting to maintain visibility into security posture and compliance status across your Kubernetes infrastructure.
