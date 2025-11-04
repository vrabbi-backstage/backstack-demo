---
id: technical-overview
title: Technical Overview
description: Technical overview of Argo CD architecture, components, and how they work together
---

## Purpose

Argo CD is a Kubernetes controller that implements GitOps for continuous delivery. It was built to solve the problem of managing applications across multiple Kubernetes clusters while maintaining Git as the single source of truth.

At its core, Argo CD continuously watches Git repositories and Kubernetes clusters, comparing desired state (Git) with actual state (cluster), and automatically reconciling any differences.

## Architecture

Argo CD follows a controller-based architecture with several key components that work together:

```
┌─────────────────────────────────────────────────┐
│         Git Repositories                        │
│  (Source of Truth - Desired State)             │
└─────────────────────────────────────────────────┘
           ↑                          ↓
           │                    Webhook Events
           │                         │
      Monitor for                    ↓
      Changes                   ┌─────────────────┐
           │                    │   API Server    │
           │                    ├─────────────────┤
           │                    │ • Webhooks      │
           └──────────────────→│ • RBAC          │
                               │ • Auth          │
                               └────────┬────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ↓                   ↓                   ↓
          ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
          │ Repository Server│ │Application Ctrl  │ │  Web UI & CLI    │
          ├──────────────────┤ ├──────────────────┤ ├──────────────────┤
          │ • Git caching    │ │ • Compare state  │ │ • Dashboard      │
          │ • Manifest gen   │ │ • Sync apps      │ │ • Status view    │
          │ • Templating     │ │ • Monitor health │ │ • User portal    │
          └──────────────────┘ └─────────┬────────┘ └──────────────────┘
                                         │
                                         ↓
          ┌──────────────────────────────────────────────────┐
          │         Kubernetes Clusters                      │
          │  (Live State - Actual Running Applications)     │
          └──────────────────────────────────────────────────┘
```

## Core Components

### 1. API Server

The API server is the central hub for Argo CD operations:

**Responsibilities**:

- Provides gRPC and REST APIs consumed by Web UI, CLI, and external systems
- Manages Application resources (CRDs)
- Handles user authentication and authorization
- Enforces RBAC policies
- Receives and processes Git webhook events
- Manages repository and cluster credentials
- Provides access tokens for automation

**Security features**:

- OAuth2, OIDC, LDAP, SAML support
- Fine-grained RBAC for application access
- Session management and token generation
- Audit logging for compliance

### 2. Repository Server

The Repository Server handles Git repository interactions:

**Responsibilities**:

- Maintains a local cache of Git repositories
- Generates Kubernetes manifests from various tools (Helm, Kustomize, Jsonnet)
- Provides manifests to the Application Controller
- Handles templating and variable substitution
- Supports custom config management plugins

**Key operations**:

- Clone and update Git repos
- Cache manifest generation (performance optimization)
- Template rendering (Helm, Kustomize, etc.)
- Credential management for Git access

### 3. Application Controller

The Application Controller is the core reconciliation engine:

**Responsibilities**:

- Continuously monitors running applications (watches Application CRDs)
- Compares desired state (Git) with live state (cluster)
- Detects out-of-sync applications
- Triggers automatic syncs if configured
- Executes sync hooks (PreSync, Sync, PostSync)
- Reports application health and status
- Manages application lifecycle

**Key capabilities**:

- State reconciliation
- Automatic or manual sync triggering
- Lifecycle hooks for custom logic
- Multi-cluster support
- Health status assessment

### 4. Redis

Redis provides caching and session storage:

- Session caching
- Webhook event queuing
- Manifest caching (performance optimization)
- Temporary state storage

## Key Workflows

### Deployment Workflow

```
1. Developer commits to Git
   ↓
2. Webhook notifies Argo CD
   ↓
3. API Server processes webhook
   ↓
4. Application Controller triggered
   ↓
5. Repository Server generates manifests
   ↓
6. Controller compares desired vs actual state
   ↓
7. If out-of-sync and auto-sync enabled:
   → kubectl apply new manifests
   → Monitor resource creation
   → Update status
   ↓
8. Web UI and CLI show updated status
   ↓
9. Application deployed to Kubernetes
```

### Sync Process

When Argo CD syncs an application:

1. **Fetch manifests** - Repository Server generates manifests from Git
2. **Validate** - Validate manifests against Kubernetes schema
3. **Plan** - Determine what resources need to be created/updated/deleted
4. **PreSync hooks** - Execute any PreSync lifecycle hooks
5. **Apply** - kubectl apply manifests to cluster
6. **Sync hooks** - Execute any Sync lifecycle hooks
7. **Wait** - Wait for resources to reach healthy state
8. **PostSync hooks** - Execute any PostSync lifecycle hooks
9. **Update status** - Report sync result and new state

### Health Assessment

Argo CD assesses application health by:

- Monitoring resource status (Deployment replicas, Pod status, etc.)
- Checking custom health rules
- Aggregating health from all resources
- Comparing to desired state

Application states:

- **Healthy** - All resources healthy and in-sync
- **Progressing** - Deployment in progress
- **Degraded** - Some resources unhealthy
- **Unknown** - Cannot determine health

## Sync Status

Argo CD tracks two dimensions of status:

### Sync Status

- **Synced** - Live state matches desired state
- **OutOfSync** - Live state differs from desired state
- **Unknown** - Cannot determine sync status

### Health Status

- **Healthy** - Application resources are healthy
- **Progressing** - Application is deploying/updating
- **Degraded** - Application has unhealthy resources
- **Unknown** - Cannot determine health
- **Suspended** - Application is suspended

## Key Design Principles

- **Pull-based** - Argo CD pulls desired state from Git rather than requiring pushes
- **Continuous reconciliation** - Constantly monitors and corrects drift
- **Declarative** - Infrastructure and applications defined declaratively
- **GitOps** - Git is source of truth for all desired state
- **Multi-cluster** - Single Argo CD instance can manage multiple clusters
- **Self-healing** - Automatically corrects drift from desired state
- **Auditable** - All changes tracked in Git history
- **Extensible** - Supports custom tools via config management plugins

## High Availability

For production deployments, Argo CD supports high availability:

- Multiple replicas of API Server
- Multiple replicas of Application Controller
- Redis clustering
- Distributed repository caching
- Load balancing across instances

## Integration Points

### Git Repositories

- GitHub, GitLab, Gitea, Bitbucket
- SSH and HTTPS authentication
- Webhook support for push notifications
- Branch, tag, and commit tracking

### Kubernetes Clusters

- Local cluster (API server runs in)
- External clusters (registered as secrets)
- RBAC and service accounts
- Namespace-scoped deployments

### External Systems

- CI/CD pipelines (GitHub Actions, Jenkins, GitLab CI)
- Secret management (Sealed Secrets, External Secrets)
- Monitoring (Prometheus metrics exported)
- Authentication (OAuth2, OIDC, LDAP, SAML)
- Webhooks (GitHub, GitLab, Bitbucket)

## Operational Characteristics

### Resource Requirements

Typical deployment needs:

- API Server: 1 CPU, 512MB RAM
- Repository Server: 0.5 CPU, 256MB RAM
- Application Controller: 0.5 CPU, 256MB RAM
- Redis: minimal resources

### Scalability

- Repository Server can be horizontally scaled
- API Server can be horizontally scaled with load balancing
- Application Controller typically runs as single instance (with HA support)
- Supports 100+ applications per controller

### Performance Optimization

- Git manifest caching reduces API calls
- Webhook-driven updates (vs polling)
- Parallel resource reconciliation
- Repository server load balancing

## State Management

### Desired State

- Defined in Git repositories
- Tracked by branch, tag, or commit
- Stored as YAML manifests
- Templated by Helm, Kustomize, etc.

### Actual State

- Running Kubernetes resources
- Monitored by Application Controller
- Updated through kubectl apply
- Reflected in resource status

### Reconciliation

- Continuous comparison of states
- Automatic or manual sync
- Lifecycle hooks for custom logic
- Self-healing on drift

## Learning Path

To understand Argo CD deeply:

1. **[Core Concepts](./03-core-concepts.md)** - Understand key terminology
2. **[Key Features](./04-key-features.md)** - Explore Applications, ApplicationSets, sync
3. **[Official Documentation](https://argo-cd.readthedocs.io/)** - Complete reference
