# Installing the Scaffolder Backend Module TeraSky Utils Backend Plugin

This guide will help you install and set up the Scaffolder Backend Module TeraSky Utils backend plugin in your Backstage instance.

## Prerequisites

Before installing the plugin, ensure you have:

1. A working Backstage backend instance
2. The Scaffolder plugin installed and configured
3. Access to Kubernetes clusters (for claim templates)
4. Git repository access (for entity publishing)

## Installation Steps

### 1. Add the Package

Install the plugin package using yarn:

```bash
yarn --cwd packages/backend add @terasky/backstage-plugin-scaffolder-backend-module-terasky-utils
```

### 2. Add to Backend

Modify your backend in `packages/backend/src/index.ts`:

```typescript
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// Add the TeraSky Utils module
backend.add(import('@terasky/backstage-plugin-scaffolder-backend-module-terasky-utils'));

// Add required scaffolder modules for template publishing
backend.add(import('@backstage/plugin-scaffolder-backend-module-github'));
backend.add(import('@backstage/plugin-scaffolder-backend-module-gitlab'));
backend.add(import('@backstage/plugin-scaffolder-backend-module-bitbucket'));

backend.start();
```

## Verification

After installation, verify that:

1. The plugin appears in your package.json dependencies
2. The backend starts without errors
3. Templates are registered correctly
4. Actions are available in the scaffolder
5. File generation works as expected

## Troubleshooting

Common issues and solutions:

1. **Action Not Found**
    - Check plugin installation
    - Verify backend configuration
    - Review module imports
    - Check action registration

2. **File Generation Issues**
    - Check file permissions
    - Verify template syntax
    - Review input parameters
    - Check output paths

3. **Git Integration Problems**
    - Verify tokens
    - Check repository access
    - Review publishing configuration
    - Check error messages