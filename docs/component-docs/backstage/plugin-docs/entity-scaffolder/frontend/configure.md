# Configuring the Entity Scaffolder Content Frontend Plugin

This guide covers the configuration options available for the Entity Scaffolder Content frontend plugin.

## New Frontend System Configuration (Alpha)

When using the new frontend system through the `/alpha` export, the plugin is configured automatically with sensible defaults. The configuration options described below are still available and can be customized through the app configuration.

## Component Configuration

### EntityScaffolderContent Props

The main component accepts the following configuration props:

```typescript
interface EntityScaffolderContentProps {
  // Define template filtering and grouping
  templateGroupFilters: Array<{
    title: string;
    filter: (entity: Entity, template: Template) => boolean;
  }>;
  
  // Map entity data to template fields
  buildInitialState?: (entity: Entity) => Record<string, unknown>;
  
  // Scaffolder Field Extensions Support
  ScaffolderFieldExtensions?: ReactNode;  

  // Default template category
  defaultCategory?: string;
}
```

### Template Group Filters

Configure how templates are filtered and grouped based on entity context:

```typescript
const templateGroupFilters = [
  {
    title: 'Kubernetes Resources',
    filter: (entity, template) =>
      template.metadata?.labels?.type === 'kubernetes' &&
      entity.spec?.type === 'kubernetes-namespace',
  },
  {
    title: 'Application Templates',
    filter: (entity, template) =>
      template.metadata?.labels?.type === 'application' &&
      entity.spec?.type === 'service',
  },
];
```

### Initial State Builder

Define how entity data maps to template form fields:

```typescript
const buildInitialState = (entity: Entity) => ({
  // Basic metadata mapping
  name: entity.metadata.name,
  namespace: entity.metadata.namespace,
  
  // Extract from annotations
  cluster: entity.metadata?.annotations?.['backstage.io/managed-by-location']?.split(": ")[1],
  
  // Custom transformations
  labels: Object.entries(entity.metadata.labels || {}).map(
    ([key, value]) => `${key}=${value}`
  ),
});
```

### Field Extensions Support

Add field extensions support:

```typescript
import { ScaffolderFieldExtensions } from '@backstage/plugin-scaffolder-react';
import { EntityPickerFieldExtension, RepoUrlPickerFieldExtension } from '@backstage/plugin-scaffolder';

ScaffolderFieldExtensions={
  <ScaffolderFieldExtensions>
    <RepoUrlPickerFieldExtension />
    <EntityPickerFieldExtension />
  </ScaffolderFieldExtensions>
}
```

## Entity Page Integration

### Basic Integration

Add the plugin to an entity page:

```typescript
import { EntityScaffolderContent } from '@terasky/backstage-plugin-entity-scaffolder-content';
import { GitOpsManifestUpdaterExtension } from '@terasky/backstage-plugin-gitops-manifest-updater';
import { ScaffolderFieldExtensions } from '@backstage/plugin-scaffolder-react';
import { EntityPickerFieldExtension, RepoUrlPickerFieldExtension } from '@backstage/plugin-scaffolder';

const entityPage = (
  <EntityLayout>
    <EntityLayout.Route 
      path="/scaffolder" 
      title="Templates"
    >
      <EntityScaffolderContent
        templateGroupFilters={templateGroupFilters}
        buildInitialState={buildInitialState}
        ScaffolderFieldExtensions={
          <ScaffolderFieldExtensions>
            <RepoUrlPickerFieldExtension />
            <EntityPickerFieldExtension />
            <GitOpsManifestUpdaterExtension />
          </ScaffolderFieldExtensions>
        }
      />
    </EntityLayout.Route>
  </EntityLayout>
);
```

### Advanced Integration

Configure for multiple entity types:

```typescript
const serviceEntityPage = (
  <EntityLayout>
    <EntityLayout.Route 
      path="/scaffolder" 
      title="Service Templates"
    >
      <EntityScaffolderContent
        templateGroupFilters={[
          {
            title: 'Service Templates',
            filter: (entity, template) =>
              template.metadata?.labels?.type === 'service' &&
              entity.spec?.type === 'service',
          },
        ]}
        buildInitialState={entity => ({
          serviceName: entity.metadata.name,
          owner: entity.spec?.owner,
          type: entity.spec?.type,
        })}
        defaultCategory="Service Templates"
      />
    </EntityLayout.Route>
  </EntityLayout>
);

const systemEntityPage = (
  <EntityLayout>
    <EntityLayout.Route 
      path="/scaffolder" 
      title="System Templates"
    >
      <EntityScaffolderContent
        templateGroupFilters={[
          {
            title: 'System Resources',
            filter: (entity, template) =>
              template.metadata?.labels?.type === 'system' &&
              entity.spec?.type === 'system',
          },
        ]}
        buildInitialState={entity => ({
          systemName: entity.metadata.name,
          environment: entity.spec?.environment,
        })}
        defaultCategory="System Resources"
      />
    </EntityLayout.Route>
  </EntityLayout>
);
```

## Best Practices

1. **Template Filtering**
    - Use clear, descriptive group titles
    - Keep filter conditions simple and maintainable
    - Consider template metadata structure
    - Handle edge cases gracefully

2. **Data Mapping**
    - Validate entity data before mapping
    - Provide sensible defaults
    - Document data transformations
    - Handle missing data gracefully

3. **Entity Integration**
    - Use consistent route paths
    - Group related templates logically
    - Consider user workflow
    - Maintain clear navigation

For installation instructions, refer to the [Installation Guide](./install.md). 