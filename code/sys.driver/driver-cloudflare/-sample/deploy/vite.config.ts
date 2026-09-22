import { Vite } from '@sys/driver-vite';
import { isPublicBase } from './src/m.app/u.selection.ts';

/** Non-secret, process-local handoff from the build task to Vite's config-loading child. */
export const BUILD_BASE_ENV = 'SYS_SAMPLE_R2_PUBLIC_ASSET_BASE';

export default Vite.Config.define(async () => {
  const base = Deno.env.get(BUILD_BASE_ENV);
  if (!isPublicBase(base)) throw new Error('Run deno task build to capture the public asset base.');
  const config = await Vite.Config.app({
    paths: Vite.Config.paths({ app: { entry: './src/ui/index.html', base } }),
  });
  return {
    ...config,
    worker: {
      ...config.worker,
      // A worker is a new delivery role, not another anonymous public build asset.
      plugins: () => [{
        name: 'sample-no-workers',
        buildStart() {
          throw new Error('The R2 sample does not admit worker outputs.');
        },
      }],
    },
  };
});
