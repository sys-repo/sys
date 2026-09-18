import { R2 } from '@sys/driver-cloudflare/r2';

import type { t } from './common.ts';
import { createApp } from './m.app/mod.ts';
import { credentialsFrom } from './m.app/u.credentials.ts';
import { readInputs } from './m.app/u.data.ts';
import { snapshotInputs } from './m.app/u.selection.ts';

/** Resolve credentials for captured inputs, then bootstrap without opening a listener. */
export function appFrom(inputs: t.AppInputs, env: t.EnvReader = Deno.env, signal?: AbortSignal) {
  const captured = snapshotInputs(inputs.config, inputs.pin);
  const { config } = captured;
  const service = R2.Service.create({
    accountId: config.accountId,
    credentials: credentialsFrom(config.credentials, env),
  });
  return createApp({ ...captured, bucket: service.bucket(config.bucket), signal });
}

/** Load package-local inputs once; hosting uses process env unless a reader is supplied. */
export const main = (async (_ctx, env: t.EnvReader = Deno.env) => {
  return await appFrom(await readInputs(), env);
}) satisfies t.DenoEntry.Main;
