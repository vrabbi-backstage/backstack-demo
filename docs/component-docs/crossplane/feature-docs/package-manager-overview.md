---
id: package-manager-overview
title: Package Manager
description: Distribute and manage Crossplane configurations, functions, and providers using the Package Manager
---

The Crossplane Package Manager enables you to distribute, version, and manage configurations, composition functions, and providers. It brings package management best practices to infrastructure automation.

## What is Package Management?

Package management in Crossplane allows you to:

- **Distribute** infrastructure configurations and functions
- **Version** your infrastructure APIs and logic
- **Reuse** common patterns across teams and organizations
- **Manage dependencies** between configurations
- **Track changes** through semantic versioning

## Package Types

### Configuration Packages

Configuration packages bundle infrastructure definitions:

- **Composite Resource Definitions (XRDs)** - API schemas
- **Compositions** - Implementation logic
- **Managed Resource Providers** - Cloud provider packages
- **Documentation** - API guides and examples

**Use cases**:

- Publish database API to internal registry
- Share Kubernetes cluster provisioning configuration
- Distribute microservice infrastructure templates

### Function Packages

Function packages distribute composition functions:

- **Go functions** - Performance-optimized logic
- **Python functions** - Easier development
- **Templating functions** - Declarative transformations

**Use cases**:

- Share company-specific validation logic
- Distribute cost optimization functions
- Share multi-cloud routing functions

### Provider Packages

Provider packages contain cloud provider integrations:

- AWS Provider - EC2, RDS, S3, and 100+ resource types
- Azure Provider - Virtual Machines, SQL, Storage
- GCP Provider - Compute, Cloud SQL, Storage
- And 20+ more cloud and SaaS providers

## Package Structure

### Configuration Package Layout

```
my-infrastructure-package/
├── README.md
├── LICENSE
├── crossplane.yaml              # Package metadata
├── chart/
│   └── Chart.yaml              # Helm chart metadata
├── crds/
│   ├── xrd-database.yaml       # Composite Resource Definition
│   ├── xrd-app.yaml
│   └── ...
├── compositions/
│   ├── database-aws.yaml       # Compositions
│   ├── database-azure.yaml
│   └── ...
├── examples/
│   ├── example-database.yaml
│   └── example-app.yaml
└── docs/
    ├── api.md                  # API documentation
    └── usage.md                # Usage guide
```

### Function Package Layout

```
my-function-package/
├── README.md
├── crossplane.yaml
├── main.go                     # Function implementation
└── input/
    └── v1beta1/
        └── main.go             # Input schema
```

## Package Discovery

### Registry Sources

Packages are discovered from:

- **Upbound Marketplace** - Official Crossplane community packages
- **Private registries** - Enterprise package repositories
- **GitHub repositories** - Git-based package distribution
- **OCI registries** - Container registries (Docker Hub, Quay, etc.)

### Searching for Packages

```bash
# Search Upbound marketplace
crossplane package search postgresql

# List available packages
crossplane package list

# Describe package
crossplane package describe xpkg.upbound.io/upbound/provider-aws:latest
```

## Installation and Consumption

### Install a Configuration Package

```yaml
apiVersion: pkg.crossplane.io/v1
kind: Configuration
metadata:
  name: my-company-infrastructure
spec:
  package: xpkg.upbound.io/mycompany/infrastructure:v1.2.3
  packagePullPolicy: IfNotPresent
  revisionHistoryLimit: 5
```

### Install a Function Package

```yaml
apiVersion: pkg.crossplane.io/v1beta1
kind: Function
metadata:
  name: composition-validator
spec:
  package: myregistry.azurecr.io/company/validators:v1.0.0
  packagePullPolicy: IfNotPresent
```

### Install Providers

```yaml
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: provider-aws
spec:
  package: xpkg.upbound.io/upbound/provider-aws:v0.33.0
  controllerConfigRef:
    name: aws-config
```

## Publishing Packages

### Build a Configuration Package

```bash
# Create package directory
mkdir my-infrastructure-package
cd my-infrastructure-package

# Create crossplane.yaml
cat > crossplane.yaml << EOF
apiVersion: meta.pkg.crossplane.io/v1
kind: Configuration
metaspec:
  crossplaneVersion: ">=v1.13.0"
  name: my-infrastructure
  description: Infrastructure APIs for my organization
  mainline: true
  version: v1.0.0
  license: Apache-2.0
  readme: README.md

  # Dependencies
  dependsOn:
    - provider: xpkg.upbound.io/upbound/provider-aws:v0.33.0

  # Keywords for discovery
  keywords:
    - aws
    - infrastructure
    - database
EOF

# Add your compositions and XRDs
```

### Build Package

```bash
# Build the OCI image
crossplane xpkg build \
  --name=my-infrastructure \
  --output=my-infrastructure-v1.0.0.xpkg

# Tag for registry
docker tag my-infrastructure-v1.0.0.xpkg myregistry.azurecr.io/company/infrastructure:v1.0.0

# Push to registry
docker push myregistry.azurecr.io/company/infrastructure:v1.0.0

# Or use crossplane CLI
crossplane xpkg push \
  --name=my-infrastructure \
  myregistry.azurecr.io/company/infrastructure:v1.0.0
```

## Versioning Strategy

### Semantic Versioning

Use semantic versioning for packages:

```
MAJOR.MINOR.PATCH
1.0.0

MAJOR - Breaking API changes
MINOR - New features, backward compatible
PATCH - Bug fixes, backward compatible
```

### Version Constraints

Specify version requirements in your package:

```yaml
spec:
  dependsOn:
    # Exact version
    - provider: provider-aws:v0.33.0

    # Minimum version
    - provider: provider-aws:>=v0.33.0

    # Version range
    - provider: provider-aws:>=v0.33.0,<v1.0.0

    # Latest compatible
    - provider: provider-aws:~v0.33.0 # Allows v0.33.1, v0.33.2, etc.
```

## Package Lifecycle

### Development

```
1. Create configuration locally
2. Test with local Crossplane
3. Verify compositions work
4. Document API and usage
```

### Release

```
1. Update version in crossplane.yaml
2. Build package
3. Tag and push to registry
4. Create release notes
5. Announce availability
```

### Updates

```
1. Make changes to configurations/functions
2. Test thoroughly
3. Increment version appropriately
4. Build and push new version
5. Users can upgrade when ready
```

### Deprecation

```
1. Announce deprecation in release notes
2. Mark as deprecated in package metadata
3. Provide migration path
4. Remove after grace period
```

## Common Package Patterns

### Platform API Package

Create a package for your organization's infrastructure API:

```
platform-infrastructure:
├── postgres-database XRD
├── mysql-database XRD
├── redis-cache XRD
├── web-app XRD
└── Compositions for each (multi-cloud)
```

### Provider Configuration Package

Create a package pre-configuring providers:

```
company-aws-providers:
├── AWS ProviderConfig (with company IAM roles)
├── Networking defaults (VPCs, subnets)
└── Security policies (security groups, IAM)
```

### Function Utilities Package

Package reusable composition functions:

```
company-functions:
├── Validation functions
├── Cost optimization functions
├── Security hardening functions
└── Compliance checking functions
```

## Best Practices

### 1. Clear Documentation

Include comprehensive documentation:

```yaml
metadata:
  annotations:
    description: "Database provisioning API for PostgreSQL and MySQL"
    support: "https://github.com/mycompany/infrastructure/issues"
    website: "https://internal.wiki/infrastructure"
```

### 2. Backward Compatibility

Maintain backward compatibility in minor/patch versions:

```yaml
# Version 1.0.0
spec:
  databaseEngine: postgres  # Users specify

# Version 1.1.0 (backward compatible)
spec:
  database:           # New structure
    engine: postgres
  databaseEngine: postgres  # Still accept old field
```

### 3. Test Packages

Test package installation and updates:

```bash
# Test in isolation
kind create cluster
crossplane install configuration xpkg.upbound.io/mycompany/infrastructure:v1.0.0
kubectl apply -f examples/

# Test upgrades
crossplane install configuration xpkg.upbound.io/mycompany/infrastructure:v1.1.0
```

### 4. Version Dependencies Carefully

Specify dependency versions appropriately:

```yaml
# Too loose - may break with new versions
dependsOn:
  - provider: provider-aws

# Too tight - can't update dependency
dependsOn:
  - provider: provider-aws:v0.33.0

# Just right - allows security patches
dependsOn:
  - provider: provider-aws:>=v0.33.0,<v1.0.0
```

### 5. Provide Examples

Include working examples with packages:

```yaml
# examples/basic-database.yaml
apiVersion: database.mycompany.io/v1
kind: Database
metadata:
  name: example-db
spec:
  engine: postgres
  size: small
```

## Package Distribution Models

### Internal Only

Distribute within your organization:

```
Private container registry → Install from internal registry
```

### Community Sharing

Share packages with broader community:

```
Upbound Marketplace → Public availability → Community contributions
```

### Hybrid

Distribute both internally and publicly:

```
Private: core company infrastructure
Public: generic infrastructure patterns
```

## See Also

- [System Model](../03-system-model.md) - Understand packages' role
- [Composition Overview](./composition-overview.md) - What goes in a configuration package
- [Official Package Docs](https://docs.crossplane.io/latest/concepts/packages/) - Detailed package reference
- [Upbound Marketplace](https://marketplace.upbound.io/) - Browse community packages
