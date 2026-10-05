import type { t } from './common.ts';
import { appFrom, readInputs } from './m.deployment/mod.ts';

/**
 * Load package-local inputs once; use process env unless a reader is supplied.
 */
export const main = (async (_ctx, env: t.EnvReader = Deno.env) => {
  return await appFrom(await readInputs(), env);
}) satisfies t.DenoEntry.Main;
