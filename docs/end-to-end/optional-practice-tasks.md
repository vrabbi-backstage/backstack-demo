# Optional Practice Tasks - BACKStack Workshop

After completing the end-to-end lab guide, use these optional tasks to deepen your understanding of the BACKStack ecosystem. Each task builds on the concepts you've learned and requires thoughtful application of multiple platform components.

---

## Task 1: Create a Multi-Tier Service Offering with Composition Variants

**Objective:** Extend the platform with a new service abstraction that offers multiple deployment options.

**Scenario:** Your organization needs a "CachedAPI" service that includes a backend API deployment and an optional Redis cache. Create:

1. **An XRD** (`crossplane/04-xrds/cached-api/xrd.yaml`) with:
   - Required: `image` (container image)
   - Required: `port` (service port)
   - Optional: `cacheEnabled` (boolean, default false)
   - Optional: `cacheSize` (enum: small, medium, large)

2. **Two Compositions** that implement the XRD:
   - `cached-api-basic`: Deploys only the API without cache
   - `cached-api-with-redis`: Deploys API + Redis deployment and service

3. **Test the Setup:**
   - Apply both to the cluster
   - Create two CachedAPI instances in Backstage—one with caching disabled and one with caching enabled
   - Verify ArgoCD creates both applications
   - Confirm Backstage discovers both instances and templates are available

**Success Criteria:**
- Both compositions are valid and discoverable
- Backstage shows the dynamic form with conditional fields based on `cacheEnabled`
- Both instances provision successfully and appear in the catalog

**Hint:** Use the Kubernetes ingestor to verify the resources were created, and check the Crossplane plugin to see the resource relationships.

---

## Task 2: Enforce Multi-Level Policy Compliance with Progressive Severity

**Objective:** Create a tiered policy system that communicates different levels of concern to platform users.

**Scenario:** Create three Kyverno policies for the CachedAPI service from Task 1 with increasing severity:

1. **Low Severity (Audit):** `cached-api-resources-minimum`
   - Requires minimum CPU request (e.g., 50m)
   - Action: Audit mode

2. **Medium Severity (Audit):** `cached-api-replicas-recommendation`
   - Warns if replicas < 2 for production readiness
   - Action: Audit mode
   - Uses a custom message explaining production best practices

3. **High Severity (Enforce):** `cached-api-image-policy`
   - Requires images from approved registries or with specific tags (e.g., must contain "stable" or "v1.x.x" format)
   - Action: Enforce mode (blocks deployment)

**Test the Setup:**
- Create a CachedAPI instance that violates all three policies
- Verify it deploys but shows audit violations in Backstage
- Update the instance to comply and verify violations clear
- Try to deploy one that violates the high-severity policy—it should be blocked

**Success Criteria:**
- All three policies are applied correctly
- Backstage displays violations with appropriate severity levels
- Audit violations don't block creation; enforce violation does
- Policy messages clearly guide users on remediation

**Hint:** Review the existing Kyverno policies in the repo for syntax and patterns. Use the Policy Viewer in Backstage to debug policy logic.

---

## Task 3: Create a Deprecation & Migration Path for an Existing Service

**Objective:** Practice platform evolution by deprecating old service versions and guiding users through migration.

**Scenario:** The original App XRD now supports new deployment strategies. You need to:

1. **Extend the App XRD** (`crossplane/04-xrds/basic-app/namespaced.yaml`):
   - Add a new field `deploymentStrategy` with enum: `stateless`, `stateful`, `sidecar-injected`
   - Set default to `stateless` (backward compatible)

2. **Create a Deprecation Policy** (`kyverno/app-strategy-deprecation.yaml`):
   - Warns users of Apps still using default deploymentStrategy
   - Message: "Please explicitly choose a deployment strategy. 'stateless' is no longer the default in v2.0. See docs for guidance."
   - Audit mode with clear messaging

3. **Update an Existing App** (use one from the catalog or create one):
   - Navigate to the app in Backstage
   - Use Entity Scaffolder to update its manifest
   - Change from default strategy to an explicit one
   - Verify the policy violation clears after sync

**Success Criteria:**
- XRD update doesn't break existing apps
- Deprecation policy appears on apps using old patterns
- Users can update via Entity Scaffolder form with new field available
- Policy clears after compliance

**Hint:** Backward compatibility is key—default values in schemas ensure existing resources work. Use the GitOps Manifest Updater to modify the app.

---

## Task 4: Implement Cross-Resource Validation with Kyverno API Calls

**Objective:** Create a policy that validates relationships between resources across the platform.

**Scenario:** WebApp instances should have unique FQDNs. However, you also need to prevent FQDN conflicts with external services. Create:

1. **An External Service Registry** (ConfigMap):
   - Create a ConfigMap in the `kyverno` namespace named `reserved-domains`
   - Include a list of reserved FQDNs (e.g., `admin.example.com`, `api.example.com`)

2. **A Kyverno Policy** (`kyverno/webapps-reserved-domain-check.yaml`):
   - Validates WebApp instances against the reserved domains
   - Uses API call to query the ConfigMap
   - Audit mode with message: "FQDN conflicts with reserved external service"

3. **Test the Setup:**
   - Create a WebApp with a reserved FQDN—should show policy violation
   - Create a WebApp with a non-reserved FQDN—should pass
   - Update the ConfigMap with a new reserved domain
   - Create a new WebApp with the newly reserved FQDN—should show violation

**Success Criteria:**
- Policy correctly queries external ConfigMap
- Violations appear in Backstage for conflicting FQDNs
- Non-conflicting apps show no violations
- Policy logic is dynamic and respects ConfigMap updates

**Hint:** Review the existing `unique-ingress-host` policy in the repo—it uses similar API call patterns. Kyverno context rules can reference ConfigMap data.

---

## Task 5: Build an End-to-End Developer Journey with Template Scaffolding & AI Tools

**Objective:** Create a comprehensive template that leverages multiple platform capabilities and MCP tools.

**Scenario:** Design a "Complete Web Platform" template that:

1. **Template Requirements:**
   - Asks for: app name, namespace, base image, domain, and team owner
   - Creates a WebApp Crossplane claim
   - Generates a Backstage catalog entity (catalog-info.yaml)
   - Publishes to GitOps repo via ArgoCD ApplicationSet pattern

2. **MCP Tool Integration:**
   - After template execution, have the AI describe:
     - The Crossplane resources that will be created
     - The Kyverno policies that apply to this WebApp
     - The ArgoCD application status

3. **Journey Verification:**
   - Execute the template through Backstage
   - Merge the resulting PR
   - Use Copilot chat with MCP tools to query:
     - "Get the newly created [entity-name] and show me its Crossplane resources"
     - "Check if there are any policy violations on this entity"

**Success Criteria:**
- Template execution creates valid Crossplane + catalog entity
- GitOps workflow succeeds (PR created, resources synced)
- MCP tools correctly retrieve and display resource information
- Full journey completes from creation to AI-driven visualization

**Hint:** Study the existing templates in `backstage/source/examples/template/`. Review the MCP JSON config and Backstage backend plugin actions to understand available tools. Test MCP tool queries in the Copilot chat with Agent mode enabled.

---

## Quick Reference

| Task | Components | Difficulty | Time |
|------|-----------|-----------|------|
| 1 | Crossplane XRD, Compositions | Intermediate | 30-45 min |
| 2 | Kyverno Policies, Audit/Enforce modes | Intermediate | 45-60 min |
| 3 | XRD Updates, Deprecation, GitOps | Intermediate | 40-50 min |
| 4 | Kyverno API Calls, ConfigMap | Advanced | 50-60 min |
| 5 | Templates, MCP Tools, AI Integration | Advanced | 60-90 min |

---

## Tips for Success

- **Start with the simpler tasks** (1-3) to reinforce core concepts
- **Use `kubectl get`** to verify resources are created correctly
- **Check Backstage logs** via `kubectl logs -n backstage` if templates fail
- **Review existing configurations** in the repo—they're excellent references
- **Test incrementally**—apply, verify, then troubleshoot
- **Use the Kyverno plugin** in Backstage to debug policy logic
- **Leverage the Crossplane plugin** to visualize resource relationships

---

## Resources

- [Crossplane Documentation](https://docs.crossplane.io/)
- [Kyverno Documentation](https://kyverno.io/docs/)
- [Backstage Software Templates](https://backstage.io/docs/features/software-templates/overview)
- [ArgoCD ApplicationSet Generators](https://argo-cd.readthedocs.io/en/stable/user-guide/application-set/Generators-Git/)
- [MCP Specification](https://modelcontextprotocol.io/introduction)

---

## Need Help?

- Check the `/docs/component-docs/` directory for detailed component documentation
- Review the lab guide for similar examples
- Use `kubectl describe` to inspect resource conditions and events
- Check pod logs for deployment issues: `kubectl logs -n <namespace> <pod-name>`
