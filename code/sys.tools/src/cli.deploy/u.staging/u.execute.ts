import { Dispose, Is, type t } from '../common.ts';
import { execBuildCopy } from './u.execBuildCopy.ts';
import { execCopy } from './u.execCopy.ts';
import { execIndex } from './u.execIndex.ts';
import { throwIfStagingCancelled } from './u.cancel.ts';
import {
  assertDirectoryIdentity,
  captureDirectoryIdentity,
  ensureStagingDirectory,
} from './u.identity.ts';
import type { StagingManifestLedger } from './u.manifest.ts';
import type { ExecutableStagingDir, PreparedStagingMapping } from './u.prepare.ts';

export type StagingProgressEvent = t.DeployTool.Staging.ProgressEvent;

type Args = {
  mappings: readonly PreparedStagingMapping[];
  stagingIdentity: t.DeployTool.Staging.DirectoryIdentity;
  manifestLedger: StagingManifestLedger;
  concurrency?: number;
  onProgress?: (e: StagingProgressEvent) => void;
  signal?: AbortSignal;
};

type ExecutableMapping = PreparedStagingMapping & {
  readonly sourceIdentity: t.DeployTool.Staging.DirectoryIdentity;
};

/** Execute one already-resolved, disjoint mapping plan. Root lifecycle belongs to `stageMappings`. */
export async function executeStaging(options: Args): Promise<void> {
  throwIfStagingCancelled(options.signal);
  const total = options.mappings.length;
  const concurrencyRaw = options.concurrency;
  const concurrency =
    Is.num(concurrencyRaw) && Number.isFinite(concurrencyRaw) && concurrencyRaw > 0
      ? Math.floor(concurrencyRaw)
      : 1;
  const emit = (event: StagingProgressEvent) => options.onProgress?.(event);
  const standard: ExecutableMapping[] = [];
  const indexes: Extract<PreparedStagingMapping, { mode: 'index' }>[] = [];
  for (const mapping of options.mappings) {
    if (mapping.mode === 'index') indexes.push(mapping);
    else standard.push(mapping);
  }

  await runPhase({
    mappings: standard,
    concurrency,
    emit,
    total,
    indexOffset: 0,
    stagingIdentity: options.stagingIdentity,
    manifestLedger: options.manifestLedger,
    signal: options.signal,
  });

  const executableIndexes: ExecutableMapping[] = [];
  for (const mapping of indexes) {
    throwIfStagingCancelled(options.signal);
    const sourceIdentity = await captureDirectoryIdentity({
      path: mapping.source,
      label: 'Deploy staging index source',
      signal: options.signal,
    });
    executableIndexes.push(Object.freeze({ ...mapping, sourceIdentity }));
  }

  await runPhase({
    mappings: executableIndexes,
    concurrency: 1,
    emit,
    total,
    indexOffset: standard.length,
    stagingIdentity: options.stagingIdentity,
    manifestLedger: options.manifestLedger,
    signal: options.signal,
  });
}

async function runPhase(args: {
  mappings: readonly ExecutableMapping[];
  concurrency: number;
  emit: (e: StagingProgressEvent) => void;
  total: number;
  indexOffset: number;
  stagingIdentity: t.DeployTool.Staging.DirectoryIdentity;
  manifestLedger: StagingManifestLedger;
  signal?: AbortSignal;
}): Promise<void> {
  const phaseTotal = args.mappings.length;
  if (phaseTotal === 0) return;

  const life = Dispose.abortable(args.signal);
  let next = 0;
  let failed = false;
  let hasFirstError = false;
  let firstError: unknown;

  const runOne = async (): Promise<void> => {
    while (true) {
      if (failed) return;
      throwIfStagingCancelled(life.signal);

      const localIndex = next;
      next += 1;
      if (localIndex >= phaseTotal) return;

      const mapping = args.mappings[localIndex]!;
      const index = args.indexOffset + localIndex;
      const { mode, source, staging, sourceIdentity } = mapping;
      const dir: ExecutableStagingDir = { source, staging };

      const reportStep = (step: t.DeployTool.Staging.ProgressReport<'mapping:step'>) => {
        args.emit({
          kind: 'mapping:step',
          index,
          total: args.total,
          mode,
          source,
          staging,
          label: step.label,
        });
      };

      try {
        args.emit({ kind: 'mapping:start', index, total: args.total, mode, source, staging });
        throwIfStagingCancelled(life.signal);
        await assertDirectoryIdentity(
          args.stagingIdentity,
          'Deploy staging root',
          life.signal,
        );
        await assertDirectoryIdentity(
          sourceIdentity,
          mode === 'index' ? 'Deploy staging index source' : 'Deploy staging mapping source',
          life.signal,
        );
        const destinationIdentity = await ensureStagingDirectory({
          root: args.stagingIdentity,
          path: staging,
          label: 'Deploy staging mapping destination',
          signal: life.signal,
        });
        const context = {
          sourceIdentity,
          destinationIdentity,
          manifestLedger: args.manifestLedger,
          signal: life.signal,
        };

        switch (mode) {
          case 'copy':
            await execCopy(dir, context, reportStep);
            break;
          case 'build+copy':
            await execBuildCopy(dir, context, reportStep);
            break;
          case 'index':
            await execIndex(dir, context, reportStep);
            break;
          default:
            throw new Error(`Deploy staging mapping mode is unsupported: ${String(mode)}`);
        }

        args.emit({ kind: 'mapping:done', index, total: args.total, mode, source, staging });
        await assertDirectoryIdentity(
          args.stagingIdentity,
          'Deploy staging root',
          life.signal,
        );
        await assertDirectoryIdentity(
          sourceIdentity,
          mode === 'index' ? 'Deploy staging index source' : 'Deploy staging mapping source',
          life.signal,
        );
        await assertDirectoryIdentity(
          destinationIdentity,
          'Deploy staging mapping destination',
          life.signal,
        );
      } catch (error) {
        failed = true;
        if (!hasFirstError) {
          hasFirstError = true;
          firstError = error;
        }
        life.dispose(error);
        try {
          args.emit({
            kind: 'mapping:fail',
            index,
            total: args.total,
            mode,
            source,
            staging,
            error,
          });
        } catch {
          // Progress reporting cannot release root ownership before active workers settle.
        }
        return;
      }
    }
  };

  try {
    const workers = Array.from(
      { length: Math.min(args.concurrency, Math.max(1, phaseTotal)) },
      () => runOne(),
    );
    const settled = await Promise.allSettled(workers);
    if (hasFirstError) throw firstError;
    for (const result of settled) {
      if (result.status === 'rejected') throw result.reason;
    }
  } finally {
    life.dispose('deploy-staging-phase-complete');
  }
}
