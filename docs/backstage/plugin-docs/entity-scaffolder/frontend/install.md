# Installing the Entity Scaffolder Content Frontend Plugin

This guide will help you install and set up the Entity Scaffolder Content frontend plugin in your Backstage instance.

## Prerequisites

Before installing the plugin, ensure you have:

1. A working Backstage instance
2. The Scaffolder plugin installed and configured
3. Access to entity pages where you want to embed templates

## Installation Steps

### 1. Add the Package

Install the plugin package using yarn:

```bash
yarn --cwd packages/app add @terasky/backstage-plugin-entity-scaffolder-content
```

### 2. Add to Entity Page

Modify your entity page configuration in `packages/app/src/components/catalog/EntityPage.tsx`:

```typescript
import { EntityScaffolderContent } from '@terasky/backstage-plugin-entity-scaffolder-content';

// Example for system entity page
const systemPage = (
  <EntityLayout>
    {/* ... other routes ... */}
    
    <EntityLayout.Route path="/scaffolder" title="Templates">
      <EntityScaffolderContent
        templateGroupFilters={[
          {
            title: 'System Templates',
            filter: (entity, template) =>
              template.metadata?.labels?.forEntity === 'system' &&
              entity.spec?.type === 'kubernetes-namespace',
          },
        ]}
        buildInitialState={entity => ({
          namespace: entity.metadata.name,
          // Add other initial state mappings
        })}
      />
    </EntityLayout.Route>
  </EntityLayout>
);

// Add similar configurations for other entity pages as needed
```

## New Frontend System Support (Alpha)

The plugin now supports the new frontend system available in the `/alpha` export. To use this:

```typescript
import { createApp } from '@backstage/frontend-defaults';
import { entityScaffolderContentPlugin } from '@terasky/backstage-plugin-entity-scaffolder-content/alpha';

export default createApp({
  features: [
    ...
    entityScaffolderContentPlugin,
    ...
  ],
});
```

This replaces the need for manual route configuration in `EntityPage.tsx` and other files. The plugin will be automatically integrated into the appropriate entity pages.

## Verification

After installation, verify that:

1. The plugin appears in your package.json dependencies
2. The templates tab appears on configured entity pages
3. Templates are properly filtered based on entity context
4. Template forms are pre-populated with entity data

## Troubleshooting

Common issues and solutions:

1. **Templates Tab Not Showing**
    - Verify EntityLayout.Route configuration
    - Check component import path
    - Ensure entity page configuration is applied

2. **Templates Not Filtered**
    - Review templateGroupFilters configuration
    - Check template metadata and labels
    - Verify entity type matching

3. **Form Pre-population Issues**
    - Check buildInitialState function
    - Verify entity data access
    - Review data transformation logic

For configuration options and customization, proceed to the [Configuration Guide](./configure.md). 