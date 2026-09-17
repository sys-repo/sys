import { R2 } from '@sys/driver-cloudflare/r2';

import type { t } from './common.ts';
import { createApp } from './app/u.app.ts';
import { credentialsFrom } from './app/u.credentials.ts';
import { readData } from './app/u.data.ts';
import { artifactFrom, configFrom } from './app/u.selection.ts';

/**
 * Load package-local data. Local startup supplies a dotenv reader; hosting uses process env.
 */
export const main = (async (_ctx, env: t.EnvReader = Deno.env) => {
  const config = configFrom(await readData(new URL('../config.json', import.meta.url)));
  const artifact = artifactFrom(await readData(new URL('../artifact.json', import.meta.url)));
  const service = R2.Service.create({
    accountId: config.accountId,
    credentials: credentialsFrom(config.credentials, env),
  });
  return createApp({ config, artifact, bucket: service.bucket(config.bucket) });
}) satisfies t.DenoEntry.Main;
