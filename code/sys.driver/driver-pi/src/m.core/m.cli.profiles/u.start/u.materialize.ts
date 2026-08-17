import { Fs, type t } from '../common.ts';
import { PiFs } from '../../u.fs.ts';

import type { FailedMaterialization, StartGuiDependencies } from './u.deps.ts';
import { type ManifestSource, materializePolicy } from './u.source.ts';

type MaterializationError = Error & {
  readonly materialization: Readonly<{
    stage: FailedMaterialization['stage'];
    reason: FailedMaterialization['reason'];
    cleanup: FailedMaterialization['cleanup'];
    publication?: FailedMaterialization['publication'];
  }>;
};

export async function materialize(input: {
  root: t.StringDir;
  source: ManifestSource;
  integrity: t.StringHash;
  deps: StartGuiDependencies;
  until?: t.UntilInput;
}): Promise<unknown> {
  const storeDir = Fs.join(input.root, ...PiFs.sysDirSegments, 'dist', PiFs.root) as t.StringDir;
  await ensureStore(storeDir);

  return await input.deps.materialize({
    manifestUrl: input.source.href,
    integrity: input.integrity,
    storeDir,
    policy: materializePolicy(input.source),
    until: input.until,
  });
}

async function ensureStore(storeDir: t.StringDir): Promise<void> {
  try {
    await Fs.ensureDir(storeDir);
  } catch {
    throw materializationError({
      kind: 'failed',
      stage: 'storage',
      reason: 'filesystem-failure',
      cleanup: 'not-needed',
    });
  }
}

export function materializationError(result: FailedMaterialization): MaterializationError {
  const error = new Error(
    `start:gui materialization failed: ${result.stage}/${result.reason}`,
  ) as MaterializationError;
  Object.defineProperty(error, 'materialization', {
    configurable: false,
    enumerable: true,
    value: Object.freeze({
      stage: result.stage,
      reason: result.reason,
      cleanup: result.cleanup,
      ...(result.publication === undefined ? {} : { publication: result.publication }),
    }),
  });
  return error;
}
