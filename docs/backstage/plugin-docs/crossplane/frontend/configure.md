# Configuring the Crossplane Resources Frontend Plugin

This guide covers the configuration options and best practices for the Crossplane Resources frontend plugin.

## New Frontend System Configuration (Alpha)

When using the new frontend system through the `/alpha` export, the plugin is configured automatically with sensible defaults. The configuration in `app-config.yaml` is still respected:

```yaml
crossplane:
  enablePermissions: false # Whether to enable permission checks for the crossplane plugin
```

The plugin will be automatically integrated into the appropriate entity pages without requiring manual route configuration.

## Configuration Options

### Basic Configuration

Add the following to your `app-config.yaml`:

```yaml
crossplane:
  enablePermissions: false # Whether to enable permission checks for the crossplane plugin
```

### Permission Framework Integration

When `enablePermissions` is set to `true`, the plugin integrates with Backstage's permission framework. The following permissions are available:

#### Resource Access Permissions
- `crossplane.claims.list`
- `crossplane.claims.view-yaml`
- `crossplane.claims.show-events`
- `crossplane.composite-resources.list`
- `crossplane.composite-resources.view-yaml`
- `crossplane.composite-resources.show-events`
- `crossplane.managed-resources.list`
- `crossplane.managed-resources.view-yaml`
- `crossplane.managed-resources.show-events`

#### Additional Resource Permissions
- `crossplane.additional-resources.list`
- `crossplane.additional-resources.view-yaml`
- `crossplane.additional-resources.show-events`
- `crossplane.resource-graph.show`

### Permission-Aware Components

The plugin provides several permission-aware components that automatically handle access control:

```typescript
// Permission Hooks
useResourcesListAvailable()
useResourceGraphAvailable()

// Wrapper Components
<IfCrossplaneOverviewAvailable>
<IfCrossplaneResourceGraphAvailable>
<IfCrossplaneResourcesListAvailable>
```

## UI Customization

### Component Placement

You can customize where and how the Crossplane components appear in your Backstage instance:

1. **Overview Card**: Can be placed anywhere in the entity overview page
2. **Resource Table**: Typically placed in a dedicated tab
3. **Resource Graph**: Usually in its own tab for better visibility

Example custom placement:

```typescript
// Custom overview layout
const customOverviewContent = (
  <Grid container spacing={3}>
    <Grid item xs={12} md={6}>
      <IfCrossplaneOverviewAvailable>
        <CrossplaneOverviewCardSelector />
      </IfCrossplaneOverviewAvailable>
    </Grid>
    {/* Add other cards/components */}
  </Grid>
);

// Custom tab arrangement
<EntityLayout>
  <EntityLayout.Route 
    path="/resources" 
    title="All Resources"
    if={isResourcesListAvailable}
  >
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <IfCrossplaneResourcesListAvailable>
          <CrossplaneResourcesTableSelector />
        </IfCrossplaneResourcesListAvailable>
      </Grid>
      <Grid item xs={12}>
        <IfCrossplaneResourceGraphAvailable>
          <CrossplaneResourceGraphSelector />
        </IfCrossplaneResourceGraphAvailable>
      </Grid>
    </Grid>
  </EntityLayout.Route>
</EntityLayout>
```

## Integration with Other Plugins

### Kubernetes Ingestor Integration

The plugin relies on annotations from the Kubernetes Ingestor. Ensure proper configuration:

1. The Kubernetes Ingestor must be configured to watch Crossplane resources
2. Annotations must be properly set on your Crossplane resources
3. The correct entity types must be defined in your catalog

### Permission Backend Integration

When using the permission framework:

1. Install and configure the Crossplane Permissions backend plugin
2. Enable permissions in the frontend configuration
3. Configure the permission policies in your backend

## Best Practices

1. **Permission Management**
    - Start with permissions disabled during initial setup
    - Enable permissions once basic functionality is verified
    - Configure granular permissions based on user roles

2. **Performance Optimization**
    - Place resource-intensive components (like graphs) in separate tabs
    - Use permission checks to conditionally render components
    - Consider pagination for large resource sets

3. **Error Handling**
    - Implement proper error boundaries around components
    - Provide meaningful error messages to users
    - Handle permission denied scenarios gracefully

4. **UI/UX Considerations**
    - Group related resources logically
    - Provide clear navigation between different views
    - Include helpful tooltips and documentation links
