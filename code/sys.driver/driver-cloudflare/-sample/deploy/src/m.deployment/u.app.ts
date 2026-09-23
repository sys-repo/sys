import { R2 } from '@sys/driver-cloudflare/r2';
import { createApp, routesFor } from '../m.app/mod.ts';
import type { t } from './common.ts';
import { credentialsFrom } from './u.inputs.ts';
import { DIST_LIMITS, READ_LIMITS, selectionFiles, snapshotInputs } from './u.selection.ts';

/**
 * Capture inputs before credentials, then admit the private manifest before constructing any route.
 */
export async function appFrom(
  inputs: t.AppInputs,
  env: t.EnvReader = Deno.env,
  signal?: AbortSignal,
) {
  const { config, buildRecord } = snapshotInputs(inputs.config, inputs.buildRecord);
  const service = R2.Service.create({
    accountId: config.accountId,
    credentials: credentialsFrom(config.credentials.serve, env),
  });
  const target = config.targets.private;
  const shell = await R2.ReadRoute.fromDist({
    bucket: service.bucket(target.bucket),
    storageOrigin: R2.Service.storageUrl(config.accountId),
    prefix: target.prefix,
    pin: buildRecord.selection.pins.private,
    manifestLimits: DIST_LIMITS,
    limits: READ_LIMITS,
    routes: (dist) => routesFor(selectionFiles(dist)),
    authorize: () => true,
    signal,
  });
  if (shell.kind !== 'ready') throw bootstrapError(shell);
  return createApp({ shell: shell.handler });
}

/** Translate only the constructor's closed refusal fields, never provider or callback causes. */
function bootstrapError(failure: t.R2.ReadRoute.FromDist.Failure): Error {
  switch (failure.kind) {
    case 'invalid-input':
      return new Error('Invalid sample manifest read configuration.');
    case 'manifest-refused':
      return new Error(`Sample manifest refused: ${failure.reason}.`);
    case 'policy-refused':
      return new Error('Invalid sample private manifest filenames.');
    case 'cancelled':
      return new Error('Sample manifest read refused: HTTP 499.');
    case 'timeout':
      return new Error('Sample manifest read refused: HTTP 504.');
    case 'read-refused':
      return new Error(`Sample manifest read refused: HTTP ${failure.status}.`);
  }
}
