# Scaffolder Backend Module TeraSky Utils Plugin

The Scaffolder Backend Module TeraSky Utils plugin provides a collection of useful scaffolder actions for managing Kubernetes resources and Backstage entities. These actions enhance the template creation and management capabilities of Backstage.

## Features

- **Crossplane Claim Generation**: Convert parameters to Kubernetes YAML manifests
- **Catalog Info Cleanup**: Clean and format Backstage entity manifests
- **File System Management**: Organized file output handling
- **Template Integration**: Seamless integration with scaffolder templates

## Plugin Components

### Backend Plugin
The plugin provides backend actions for: 

- Manifest generation 
- Entity cleanup 
- File system operations 
- Template processing 

[Learn more about the backend plugin](./backend/about.md)

## Available Actions

### terasky:claim-template
Converts input parameters into Kubernetes YAML manifests: 

- Generates Crossplane claim manifests 
- Organizes by cluster/namespace/kind 
- Maintains consistent file structure 
- Handles parameter transformation 

### terasky:catalog-info-cleaner
Processes Backstage entity manifests: 

- Removes runtime information 
- Formats catalog-info.yaml files 
- Prepares for git-based management 
- Maintains entity structure 

## Documentation Structure
- [About](./backend/about.md)
- [Installation](./backend/install.md)

## Use Cases

### Crossplane Resource Management
1. Template parameter collection
2. Manifest generation
3. File system organization
4. Resource deployment

### Entity Management
1. Auto-ingested component cleanup
2. Git-based catalog preparation
3. Entity manifest formatting
4. Version control integration

## Getting Started

To get started with the Scaffolder Backend Module TeraSky Utils plugin:

1. Install the backend plugin
2. Configure scaffolder integration
3. Create templates using actions
4. Start managing resources

For detailed installation and configuration instructions, refer to the backend documentation linked above. 