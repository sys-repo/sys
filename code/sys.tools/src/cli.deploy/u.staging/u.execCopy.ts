import type { t } from '../common.ts';
import { copyInto } from './u.copyInto.ts';
import { throwIfStagingCancelled } from './u.cancel.ts';
import { assertDirectoryIdentity } from './u.identity.ts';
import type { StagingManifestLedger } from './u.manifest.ts';
import type { ExecutableStagingDir } from './u.prepare.ts';

/** Copy one resolved source directory into its retained disjoint staging destination. */
export async function execCopy(
  dir: ExecutableStagingDir,
  context: {
    sourceIdentity: t.DeployTool.Staging.DirectoryIdentity;
    destinationIdentity: t.DeployTool.Staging.DirectoryIdentity;
    manifestLedger: StagingManifestLedger;
    signal?: AbortSignal;
  },
  report?: (e: t.DeployTool.Staging.ProgressReport<'mapping:step'>) => void,
): Promise<void> {
  report?.({ kind: 'mapping:step', label: 'copy' });
  await assertIdentities(context);
  await copyInto({
    src: dir.source,
    dst: dir.staging,
    sourceIdentity: context.sourceIdentity,
    destinationIdentity: context.destinationIdentity,
    manifestLedger: context.manifestLedger,
    signal: context.signal,
  });
  await assertIdentities(context);
}

async function assertIdentities(context: {
  sourceIdentity: t.DeployTool.Staging.DirectoryIdentity;
  destinationIdentity: t.DeployTool.Staging.DirectoryIdentity;
  manifestLedger: StagingManifestLedger;
  signal?: AbortSignal;
}): Promise<void> {
  throwIfStagingCancelled(context.signal);
  await assertDirectoryIdentity(
    context.sourceIdentity,
    'Deploy staging mapping source',
    context.signal,
  );
  await assertDirectoryIdentity(
    context.destinationIdentity,
    'Deploy staging mapping destination',
    context.signal,
  );
}
