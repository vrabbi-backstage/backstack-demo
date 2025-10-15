import { createApp } from '@backstage/frontend-defaults';
import { navModule } from './modules/nav';
import { createFrontendModule, githubAuthApiRef, SignInPageBlueprint } from '@backstage/frontend-plugin-api';
import { SignInPage } from '@backstage/core-components';
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
    navModule,
  ],
});
