import { DEFAULTS, type t } from './common.ts';

/**
 * A vite [defineConfig] function invoked within a server [deno test]
 * child-process especially for unit-testing/mocking purposes.
 */
export const defineHandler: t.TestViteDefineConfigHandler = (_ctx, mutate) => {
  const outDir = Deno.env.get('VITE_OUTDIR') ?? DEFAULTS.outDir;
  const build = mutate.build || (mutate.build = {});
  build.outDir = outDir;
};
