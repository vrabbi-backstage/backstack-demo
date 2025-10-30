# MCP Server Capabilities

This document describes the Model Context Protocol (MCP) server capabilities exposed by the Backstage instance in the BACKStack Kubecon 2025 NA Demo environment.

## What is MCP?

The Model Context Protocol (MCP) is an open protocol developed by Anthropic that standardizes how AI assistants (like Claude, Cursor, and other AI coding tools) can connect to external data sources and tools. MCP enables AI assistants to:

- **Discover available tools**: Automatically learn what actions and operations are available
- **Invoke tools programmatically**: Execute operations on behalf of the user through structured API calls
- **Access context**: Retrieve relevant information to provide better assistance

## Backstage as an MCP Server

The BACKStack demo environment exposes Backstage as an MCP server through the `@backstage/plugin-mcp-actions-backend` plugin. This allows AI coding assistants to:

1. **Discover Backstage provided actions**
2. **Execute actions**
3. **Query the catalog**

## Exposed Actions

The MCP server exposes actions from the following plugin sources, as configured in `app-config.local.yaml`:

```yaml
backend:
  actions:
    pluginSources:
      - 'catalog'
      - 'crossplane'
      - 'kyverno'
```

### Catalog Actions

Actions for managing the software catalog:
- **Entity Queries**: Search and retrieve entity information
- **Validation**: Validate entity definitions against schemas

### Crossplane Actions

Actions for managing Crossplane resources and infrastructure:

- **Crossplane Resource Graph Retrieval**: Retrieves the resource graph for the crossplane resources based on the related backstage entity
- **Crossplane Resources Data**: Retrieve all Crossplane resource data related to an entity in Backstage.
- **Get Kubernetes Events For Crossplane Resources**: Retrieves all active Kubernetes Events related to Crossplane resources related to an entity in Backstage.

### Kyverno Actions

Actions for working with Kyverno policies and reports:

- **Get Kyverno Policy Reports**: Retrieves Policy Reports related to a Backstage entities connected Kubernetes or Crossplane specific resources
- **Get Kyverno Policy**: Retrieves Policy details of a specific Kyverno policy

## Authentication Configuration

The MCP server supports two authentication methods:

### 1. Static Token Authentication

The demo environment uses static token authentication for simplicity:

```yaml
backend:
  auth:
    externalAccess:
      - type: static
        options:
          token: k9lPknGFOGEiHSVuxo1PxKZ+8EfKXBkz
          subject: mcp-clients
```

**Key Points:**
- Token is configured in `app-config.local.yaml`
- Client must include the token in the `Authorization` header: `Bearer k9lPknGFOGEiHSVuxo1PxKZ+8EfKXBkz`
- Subject is identified as `mcp-clients` in audit logs
- Suitable for development and testing environments

**Security Considerations:**
- Tokens should be rotated regularly
- Use environment variables in production instead of hardcoding
- Consider this a temporary solution until dynamic client registration matures

### 2. Experimental Dynamic Client Registration

The environment has experimental support for OAuth2 Dynamic Client Registration enabled:

```yaml
auth:
  experimentalDynamicClientRegistration:
    enabled: true
```

**How It Works:**
1. MCP client requests a token from the Backstage backend
2. Backstage opens an authentication popup in the user's browser
3. User approves the client registration through the `@backstage/plugin-auth` frontend plugin
4. Client receives a token for future requests

**Benefits:**
- No need to manually configure tokens
- User-controlled authorization
- Better audit trail (actions tied to specific users)

**Limitations:**
- Highly experimental feature
- Requires the new Backstage frontend system
- Currently supported by limited MCP clients

## Connecting MCP Clients

### Protocol Support

The Backstage MCP server supports two protocols:

1. **Streamable HTTP** (Recommended): `http://localhost:7007/api/mcp-actions/v1`
2. **Server-Sent Events (SSE)** (Deprecated): `http://localhost:7007/api/mcp-actions/v1/sse`

### Configuration Examples

#### Cursor IDE

Add to your Cursor settings (`.cursor/config.json` or global settings):

```json
{
  "mcpServers": {
    "backstage-actions": {
      "url": "http://localhost:7007/api/mcp-actions/v1",
      "headers": {
        "Authorization": "Bearer k9lPknGFOGEiHSVuxo1PxKZ+8EfKXBkz"
      }
    }
  }
}
```

#### Claude Desktop

Add to Claude Desktop configuration:

```json
{
  "mcpServers": {
    "backstage": {
      "command": "npx",
      "args": ["-y", "mcp-http-client", "http://localhost:7007/api/mcp-actions/v1"],
      "env": {
        "AUTHORIZATION": "Bearer k9lPknGFOGEiHSVuxo1PxKZ+8EfKXBkz"
      }
    }
  }
}
```

## Security Considerations

### Access Control

1. **Static Tokens**: 
   - Store tokens as environment variables
   - Rotate tokens regularly (minimum quarterly)
   - Use separate tokens for different environments

2. **Dynamic Registration**:
   - User approval required for each client
   - Tokens are time-limited
   - Can revoke access per client

### Network Security

1. **In Production**:
   - Use HTTPS for all communication: `https://backstage.example.com/api/mcp-actions/v1`
   - Configure proper CORS policies
   - Use API gateways for additional security layers

2. **Firewall Rules**:
   - Restrict MCP endpoint access to authorized networks
   - Consider VPN or private networking for production access

### Action Permissions

Currently, permissions are disabled in the demo environment:

```yaml
permission:
  enabled: false
crossplane:
  enablePermissions: false
kyverno:
  enablePermissions: false
```

**For Production**:
- Enable the Backstage permissions system
- Define role-based access control (RBAC)
- Restrict sensitive actions to authorized users/clients
- Implement approval workflows for destructive operations

## Limitations

### Current Limitations

1. **Action Scope**: Only actions from registered plugin sources are exposed
2. **Permissions**: Permission system is disabled in demo environment
3. **Rate Limiting**: No rate limiting configured
4. **Audit**: Basic audit logging only

### Experimental Features

1. **Dynamic Client Registration**: Still in experimental phase
2. **Protocol Support**: SSE protocol is deprecated and will be removed

## Future Enhancements

Potential improvements to the MCP capabilities:

1. **Enhanced Discovery**: Better tool descriptions and parameter documentation
2. **Streaming Support**: Long-running actions with progress updates
3. **Resource Queries**: Direct catalog queries as MCP resources, not just actions

## Related Documentation

- [MCP Actions Plugin Documentation](./plugin-docs/mcp-actions/overview.md)
- [Auth Plugin Documentation](./plugin-docs/auth/overview.md)
- [Application Configuration Overview](./05-app-config-overview.md)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)

## Getting Help

If you encounter issues with the MCP server:

1. Check the Backstage backend logs for error messages
2. Verify your authentication token is correct
3. Ensure the MCP client is using the correct protocol and URL
4. Review the action registry configuration in `app-config.local.yaml`
5. Join the [Backstage Discord](https://discord.gg/backstage-687207715902193673) for community support

