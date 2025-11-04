---
id: what-is-crossplane
title: What is Crossplane?
description: Crossplane is a control plane framework for platform engineering that lets you build control planes to manage cloud native software and define custom APIs for your infrastructure.
---

[Crossplane](https://www.crossplane.io/) is a control plane framework for platform engineering. It lets you build control planes to manage your cloud native software and design the APIs and abstractions that your users use to interact with your infrastructure.

Crossplane extends Kubernetes with custom resources that allow you to build sophisticated infrastructure automation without writing custom controllers. It provides a declarative, GitOps-friendly approach to managing cloud resources across multiple providers.

## What is a Control Plane?

A control plane is software that controls other software. Control planes expose an API where you define your _desired state_ of infrastructure and services. The control plane configures your infrastructure to match that desired state, then continuously monitors and reconciles any drift automatically.

Crossplane enables you to build control planes directly on top of Kubernetes, leveraging its declarative model and ecosystem of tools.

## Key Value Proposition

**Crossplane's key value is that it unlocks the benefits of building your own Kubernetes custom resources without having to write controllers for them.**

With Crossplane, you define declarative pipelines of functions that generate the configuration your infrastructure should have. You get all the benefits of a Kubernetes controller without the complexity of implementing one.

## Core Components

Crossplane includes the following core components:

- **[Composition](./feature-docs/composition-overview.md)** - Build custom APIs by composing Kubernetes resources and defining how they work together
- **[Managed Resources](./feature-docs/managed-resources-overview.md)** - Manage cloud resources from AWS, Azure, GCP, and other providers as Kubernetes objects
- **[Operations](./feature-docs/operations-overview.md)** - Automate operational tasks on cloud resources with CronOperations and WatchOperations
- **[Package Manager](./feature-docs/package-manager-overview.md)** - Distribute and manage Crossplane configurations and functions as packages

## Why Use Crossplane?

### For Platform Engineers

- **Reduce boilerplate**: Define infrastructure APIs without implementing controllers
- **Multi-cloud support**: Manage resources across AWS, Azure, GCP, and more with a unified interface
- **GitOps-friendly**: Infrastructure as code stored in Git with declarative Kubernetes manifests
- **Extensible**: Build custom logic using composition functions in Go, Python, or templating languages

### For Infrastructure Teams

- **Self-service**: Provide developers with self-service infrastructure provisioning through custom APIs
- **Standardization**: Enforce organizational policies and best practices through abstract APIs
- **Visibility**: Monitor and manage all infrastructure resources through a single Kubernetes API
- **Portability**: Move applications and infrastructure between clouds without code changes

### For DevOps Teams

- **Familiar tooling**: Use kubectl, GitOps operators, and existing Kubernetes ecosystem
- **Operational consistency**: Treat cloud infrastructure the same as Kubernetes applications
- **Automation**: Automate infrastructure provisioning, updates, and cleanup
- **Cost management**: Track and manage resource provisioning with Kubernetes resource limits

## Crossplane in the Cloud Native Ecosystem

Crossplane integrates with and complements other cloud native tools and projects:

- **Kubernetes** - Crossplane extends Kubernetes with infrastructure abstractions
- **GitOps** - Works seamlessly with Argo CD, Flux, and other GitOps operators
- **Service Mesh** - Complements service meshes like Istio for complete application networking
- **Policy Engines** - Integrates with Kyverno, OPA, and other policy frameworks
- **Observability** - Exports metrics and can be observed with Prometheus, Grafana, and other tools

## Getting Started

To learn more about Crossplane:

- **[Technical Overview](./02-technical-overview.md)** - Understand how Crossplane works and its architecture
- **[System Model](./03-system-model.md)** - Learn about Crossplane's core concepts and abstractions
- **[Key Concepts](./04-key-concepts.md)** - Deep dive into Composition, Managed Resources, and Operations

For installation and getting started, see the [Crossplane documentation](https://docs.crossplane.io/latest/getting-started/).
