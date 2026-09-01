import { Path, type t } from '../common.ts';
import { throwIfStagingCancelled } from './u.staging.cancel.ts';
import { assertDirectoryIdentity } from './u.staging.identity.ts';
import type { ExecutableStagingDir } from './u.staging.prepare.ts';

type ExecutionContext = {
  sourceIdentity: t.DeployTool.Staging.DirectoryIdentity;
  destinationIdentity: t.DeployTool.Staging.DirectoryIdentity;
  signal?: AbortSignal;
};

/** Validate one retained index mapping before finalization exclusively generates its bytes. */
export async function execIndex(
  dir: ExecutableStagingDir,
  context: ExecutionContext,
  report?: (e: t.DeployTool.Staging.ProgressReport<'mapping:step'>) => void,
): Promise<void> {
  report?.({ kind: 'mapping:step', label: 'index.html' });
  await assertIdentities(context);
  if (Path.resolve(dir.source, '.') !== context.sourceIdentity.path) {
    throw new Error(`Deploy staging index source identity does not match: ${dir.source}`);
  }
  if (Path.resolve(dir.staging, '.') !== context.destinationIdentity.path) {
    throw new Error(`Deploy staging index destination identity does not match: ${dir.staging}`);
  }
  await assertIdentities(context);
}

async function assertIdentities(context: ExecutionContext): Promise<void> {
  throwIfStagingCancelled(context.signal);
  await assertDirectoryIdentity(
    context.sourceIdentity,
    'Deploy staging index source',
    context.signal,
  );
  await assertDirectoryIdentity(
    context.destinationIdentity,
    'Deploy staging mapping destination',
    context.signal,
  );
}
