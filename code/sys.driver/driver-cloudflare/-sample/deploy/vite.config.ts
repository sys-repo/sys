import { Vite } from '@sys/driver-vite';

/** HTML entry shared by the build task and Vite config. */
export const APP_ENTRY = './src/ui/index.html';

export default Vite.Config.define(async () => {
  const config = await Vite.Config.app({
    paths: Vite.Config.paths({ app: { entry: APP_ENTRY } }),
  });
  return {
    ...config,
    worker: {
      ...config.worker,
      // Workers require a separate delivery policy.
      plugins: () => [{
        name: 'sample-no-workers',
        buildStart() {
          throw new Error('The R2 sample does not admit worker outputs.');
        },
      }],
    },
  };
});
