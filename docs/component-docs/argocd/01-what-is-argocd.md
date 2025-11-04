---
id: what-is-argocd
title: What is Argo CD?
description: Argo CD is a declarative, GitOps continuous delivery tool for Kubernetes that enables automated and auditable application deployments.
---

[Argo CD](https://argoproj.github.io/cd/) is a declarative, GitOps continuous delivery tool for Kubernetes. It follows the GitOps pattern of using Git repositories as the source of truth for defining the desired state of applications.

Argo CD automates the deployment of applications to specified target Kubernetes environments. It continuously monitors running applications and automatically syncs them to match the desired state defined in your Git repository.

## What is GitOps?

GitOps is an operational framework that takes DevOps best practices used for application development—such as version control, code review, and CI/CD—and applies them to infrastructure automation and application deployment.

With GitOps:

- **Git is the source of truth** - All desired state is stored in Git
- **Everything is declarative** - Infrastructure and applications defined in version-controlled manifests
- **Changes are auditable** - Every change goes through Git history and code review
- **Reconciliation is automatic** - The system continuously works to achieve the desired state

Argo CD implements GitOps for Kubernetes by continuously comparing the desired state (in Git) with the actual state (in your Kubernetes cluster) and automatically reconciling any differences.

## Key Value Proposition

**Argo CD simplifies continuous delivery for Kubernetes by making Git your single source of truth for application definitions and deployments.**

Benefits:
✅ **Declarative and version-controlled** - All application definitions stored and version-controlled in Git
✅ **Automated deployments** - Push to Git, Argo CD automatically deploys changes
✅ **Auditable** - Complete audit trail of all changes through Git history
✅ **Multi-cluster ready** - Deploy to multiple Kubernetes clusters from a single Git repository
✅ **Self-healing** - Automatically reconciles drift if applications deviate from desired state
✅ **Easy rollback** - Revert to any previous Git commit
✅ **Visibility** - Real-time dashboard showing application status and deployment history
✅ **Flexible templating** - Supports Helm, Kustomize, Jsonnet, and plain YAML

## Core Concepts

Argo CD operates around several key concepts:

- **Application** - A group of Kubernetes resources defined by manifests in Git
- **Target State** - The desired state of an application, as defined in Git
- **Live State** - The actual state of applications running in Kubernetes clusters
- **Sync** - The process of making live state match target state (deploying changes)
- **Repository** - A Git repository containing application manifests
- **Project** - A logical grouping of applications with RBAC policies

## How Argo CD Works

### The GitOps Flow

1. **Developer commits code** - Push application manifests to Git repository
2. **Git becomes source of truth** - Desired application state stored in version control
3. **Argo CD watches repository** - Continuously monitors Git for changes
4. **Comparison** - Argo CD compares desired state (Git) with actual state (cluster)
5. **Synchronization** - If states differ, Argo CD automatically syncs the application
6. **Monitoring** - Argo CD continuously monitors application health and status
7. **Reporting** - Provides visibility through UI, CLI, and webhooks

### Templating Support

Argo CD supports multiple templating tools for generating Kubernetes manifests:

- **Helm** - Package manager for Kubernetes with templating
- **Kustomize** - Template-free customization
- **Jsonnet** - Data templating language
- **Plain YAML** - Simple manifest files
- **Config Management Plugins** - Custom templating tools

## Argo CD in the Ecosystem

Argo CD complements other tools in the cloud native ecosystem:

- **Kubernetes** - Argo CD extends Kubernetes with GitOps declarative deployments
- **CI/CD Systems** - Works alongside Jenkins, GitHub Actions, GitLab CI for full CI/CD pipeline
- **Git Repositories** - GitHub, GitLab, Bitbucket supported as manifest sources
- **Secret Management** - Integrates with Sealed Secrets, External Secrets for secure configuration
- **Observability** - Works with Prometheus, Grafana, and other monitoring tools
- **Policy Engines** - Integrates with Kyverno, OPA for policy enforcement
- **OIDC/SSO** - Supports OAuth2, OIDC, LDAP, SAML for enterprise authentication

## Multi-cluster Deployment

Argo CD enables a hub-and-spoke model for managing applications across multiple clusters:

```
Git Repository (Single Source of Truth)
    ↓
Argo CD Controller (Hub)
    ↓
├─ Dev Cluster
├─ Staging Cluster
├─ Production Cluster
└─ On-premises Cluster
```

Deploy the same application to multiple environments with environment-specific customizations, all stored in Git.

## Deployment Strategies

Argo CD supports various deployment strategies:

- **Automated sync** - Changes automatically deployed when Git changes
- **Manual sync** - Approve deployments before applying
- **Progressive deployment** - Canary, blue-green deployments with preview environments
- **Selective sync** - Deploy specific resources instead of entire application
- **Synchronization windows** - Deploy only during specified maintenance windows

## Who Uses Argo CD?

### Platform Engineers

- Standardize deployment processes across teams
- Implement self-service application deployment
- Enforce organizational policies and security

### DevOps/SRE Teams

- Automate and audit application deployments
- Manage multi-cluster applications
- Implement disaster recovery and GitOps workflows

### Application Teams

- Deploy applications with single Git push
- Access deployment history and status in real-time
- Easy rollback and application management

### Organizations

- Single source of truth for application state
- Complete audit trail of all changes
- Reduced deployment errors and increased reliability

## Key Features

- **Automated Deployment** - Automatically deploy applications when Git changes
- **Application Tracking** - Track application changes by branch, tag, or commit
- **Multi-cluster Support** - Deploy to multiple Kubernetes clusters
- **Web UI** - Real-time visualization of application status
- **CLI** - Command-line interface for automation
- **RBAC** - Fine-grained access control per application or project
- **Health Status** - Monitor application resource health
- **Rollback/Roll-anywhere** - Deploy any Git commit to any cluster
- **Webhook Integration** - GitHub, GitLab, Bitbucket webhook support
- **SSO Integration** - OIDC, OAuth2, LDAP, SAML support
- **ApplicationSet** - Declaratively manage multiple applications

## Getting Started

To learn more about Argo CD:

- **[Technical Overview](./02-technical-overview.md)** - Understand Argo CD architecture and components
- **[Core Concepts](./03-core-concepts.md)** - Learn Argo CD terminology and concepts
- **[Key Features](./04-key-features.md)** - Deep dive into Applications, ApplicationSets, and sync

For installation and quick start, see the [Argo CD documentation](https://argo-cd.readthedocs.io/en/stable/getting_started/).
