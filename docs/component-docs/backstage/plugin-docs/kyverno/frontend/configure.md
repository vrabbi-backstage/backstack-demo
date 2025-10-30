# Configuring the Kyverno Policy Reports Frontend Plugin

This guide covers the configuration options for the Kyverno Policy Reports frontend plugin.

## New Frontend System Configuration (Alpha)

When using the new frontend system through the `/alpha` export, the plugin is configured automatically with sensible defaults. The configuration in `app-config.yaml` is still respected:

```yaml
kyverno:
  enablePermissions: false  # Whether to enable permission checks for the kyverno plugin
```

The plugin will be automatically integrated into the appropriate entity pages without requiring manual route configuration.

## Basic Configuration

Add the following to your `app-config.yaml`:

```yaml
kyverno:
  enablePermissions: false  # Whether to enable permission checks for the kyverno plugin
```

## Configuration Options

### Permission Framework Integration

When `enablePermissions` is set to `true`, the plugin integrates with Backstage's permission framework. The following permissions are available:  
- `kyverno.overview.view`: Access to overview policy report data  
- `kyverno.reports.view`: Access to detailed policy report data  
- `kyverno.policy.view-yaml`: Access to view the YAML manifest of Kyverno policies  

## Component Customization

### Overview Card Placement

You can customize where the Kyverno overview card appears in your entity overview page:

```typescript
<Grid container spacing={3} alignItems="stretch">
  <EntitySwitch>
    <EntitySwitch.Case if={isKubernetesAvailable}>
      <Grid item md={6} xs={12}>  // Adjust size as needed
        <KyvernoOverviewCard />
      </Grid>
    </EntitySwitch.Case>
  </EntitySwitch>
</Grid>
```

### Policy Reports Table Customization

The policy reports table can be placed in a dedicated tab:

```typescript
<EntityLayout>
  <EntityLayout.Route 
    path="/kyverno-policy-reports" 
    title="Kyverno Policy Reports"
  >
    <KyvernoPolicyReportsTable />
  </EntityLayout.Route>
</EntityLayout>
```

### Crossplane Integration

For Crossplane resources, use the dedicated components:

```typescript
// Overview Card
<KyvernoCrossplaneOverviewCard />

// Policy Reports Table
<KyvernoCrossplanePolicyReportsTable />
```

## Best Practices

1. **Permission Management**
    - Start with permissions disabled during initial setup
    - Enable permissions once basic functionality is verified
    - Configure granular permissions based on user roles

2. **Component Placement**
    - Place the overview card where it's easily visible
    - Group policy-related components together
    - Consider the relationship with other security tools

3. **User Experience**
    - Provide clear access to policy details
    - Ensure consistent placement across different entity types
    - Consider adding documentation links for policy understanding
