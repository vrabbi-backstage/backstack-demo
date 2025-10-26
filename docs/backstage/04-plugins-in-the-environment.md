# Plugins Overview
In this demo environment we have preconfigured multiple plugins to provide as an example implementation for the BACKStack deployment.
Let's go over a quick overview of these plugins and see what they provide and how we installed then.

## Kubernetes Ingestor 
Automatically create catalog entities from Kubernetes resources, with support for custom GVKs, Crossplane claims, and KRO resources. It also create GitOps friendly Software Templates for Crossplane Claims/Composites, CRDs, and KRO Instances.  

[Plugin Docs](./plugin-docs/kubernetes-ingestor/overview.md)

## Crossplane Resources
The Crossplane plugins for Backstage provide a comprehensive solution for managing and visualizing Crossplane resources within your Backstage instance. These plugins enable teams to effectively monitor and control their cloud resources provisioned through Crossplane, with support for both Crossplane v1.x and v2.x APIs.  

[Plugin Docs](./plugin-docs/crossplane/overview.md)

## Kyverno Policy Reports
The Kyverno plugins for Backstage provide comprehensive integration with Kyverno policy reports, enabling teams to monitor and manage their Kubernetes policy compliance directly within the Backstage interface.

[Plugin Docs](./plugin-docs/kyverno/overview.md)

## TeraSky Scaffolder Utils Backend Plugin
The Scaffolder Backend Module TeraSky Utils plugin provides a collection of useful scaffolder actions for managing Kubernetes resources and Backstage entities. These actions enhance the template creation and management capabilities of Backstage.  

[Plugin Docs](./plugin-docs/scaffolder-actions/overview.md)

## Entity Scaffolder Content Frontend Plugin
The Entity Scaffolder Content plugin for Backstage enables you to embed scaffolder templates directly within entity pages. This powerful feature allows you to contextualize templates based on the entity they're being accessed from, making template discovery and usage more intuitive.  

[Plugin Docs](./plugin-docs/entity-scaffolder/overview.md)

## GitOps Manifest Updater Frontend Plugin
The GitOps Manifest Updater plugin provides a powerful form component for updating Kubernetes manifests in Git repositories. It dynamically generates forms based on OpenAPI schemas from Custom Resource Definitions (CRDs), making it easy to update manifest specifications while maintaining GitOps best practices.  

[Plugin Docs](./plugin-docs/gitops-manifest-updater/overview.md)

## MCP Actions Backend Plugin
This plugin exposes Backstage actions as MCP (Model Context Protocol) tools, allowing AI clients to discover and invoke registered actions in your Backstage backend.  

[Plugin Docs](./plugin-docs/mcp-actions/overview.md)

## Auth Frontend Plugin
This plugin is a new plugin in the main Backstage repo which is meant to work together with the MCP Actions backend plugin to enable dynamic client registration which allows for using the OIDC flow in your Backstage based MCP server.  

[Plugin Docs](./plugin-docs/auth/overview.md)

## Scaffolder Regex Module Backend Plugin
This plugin provides Backstage template actions for RegExp. this allows you to do relavent parsing in software templates by performing regex based string replacements.  

[Plugin Docs](./plugin-docs/regex-module/overview.md)

## GitHub Auth Backend Plugin
This module provides an GitHub auth provider implementation for @backstage/plugin-auth-backend.

[Plugin Docs](./plugin-docs/github-auth/overview.md)

