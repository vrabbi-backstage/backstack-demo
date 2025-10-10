import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import { navModule } from './modules/nav';
import kubernetesPlugin from '@backstage/plugin-kubernetes/alpha';
import { createFrontendModule, githubAuthApiRef, SignInPageBlueprint } from '@backstage/frontend-plugin-api';
import { SignInPage } from '@backstage/core-components';
import { kyvernoPolicyReportsPlugin } from '@terasky/backstage-plugin-kyverno-policy-reports/alpha'
import {entityScaffolderContentPlugin} from '@terasky/backstage-plugin-entity-scaffolder-content/alpha'
import {gitopsManifestUpdaterPlugin} from '@terasky/backstage-plugin-gitops-manifest-updater/alpha'
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


export default createApp({
  features: [
    createFrontendModule({
      pluginId: 'app',
      extensions: [signInPage],
    }),
    catalogPlugin,
    navModule,
    kubernetesPlugin,
    kyvernoPolicyReportsPlugin,
    entityScaffolderContentPlugin,
    gitopsManifestUpdaterPlugin,
  ],
});
