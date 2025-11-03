import { createApp } from '@backstage/frontend-defaults';
import { navModule } from './modules/nav';
import { createFrontendModule, githubAuthApiRef, SignInPageBlueprint } from '@backstage/frontend-plugin-api';
import { SignInPage } from '@backstage/core-components';
import { argocdPlugin, ArgocdDeploymentLifecycle, ArgocdDeploymentSummary, isArgocdConfigured } from '@backstage-community/plugin-redhat-argocd';
import { convertLegacyPlugin } from '@backstage/core-compat-api';
import { convertLegacyEntityContentExtension, convertLegacyEntityCardExtension } from '@backstage/plugin-catalog-react/alpha';

const signInPage = SignInPageBlueprint.make({
  params: {
    loader: async () => props =>
      (
        <SignInPage
          {...props}
          providers={[
            'guest',
            {
              id: 'github-auth-provider',
              title: 'GitHub',
              message: 'Sign in using GitHub',
              apiRef: githubAuthApiRef,
            }
          ]}
        />
      ),
  },
});

const convertedArgoCDPlugin = convertLegacyPlugin(argocdPlugin, {
  extensions: [
    convertLegacyEntityCardExtension(ArgocdDeploymentSummary, {
      filter: isArgocdConfigured,
      type: 'info'
    }),
    convertLegacyEntityContentExtension(ArgocdDeploymentLifecycle, {
      name: "argocd",
      path: "/argocd",
      filter: isArgocdConfigured
    })
  ],
});



export default createApp({
  features: [
    createFrontendModule({
      pluginId: 'app',
      extensions: [signInPage],
    }),
    navModule,
    convertedArgoCDPlugin,
  ],
});
