import { type t, Fs, Is, Path } from '../common.ts';
import { createBuildResetToken } from './u.buildReset.ts';
import { execBuildCopy } from './u.execBuildCopy.ts';
import { execCopy } from './u.execCopy.ts';
import { execIndex } from './u.execIndex.ts';
import { ensureIndexHtml } from './u.generateHtml.ts';
import { resolvePath } from '../u.endpoints/u.resolve.ts';

export type StagingProgressEvent = t.DeployTool.Staging.ProgressEvent;

type Args = {
  cwd: t.StringDir;
  mappings: t.Ary<t.DeployTool.Staging.Mapping>;
  concurrency?: number;
  onProgress?: (e: StagingProgressEvent) => void;
  sourceRoot?: string;
  indexBaseDomain?: string;

  /**
   * Optional single staging root dir for deterministic lifecycle operations.
   * - cleanStagingRoot: delete + recreate the staging root before running any mappings.
   * - writeDistJson: callback invoked after successful completion.
   */
  stagingRoot?: t.StringRelativeDir;
  cleanStagingRoot?: boolean;
  writeDistJson?: boolean;
  onWriteDistJson?: (e: { stagingRoot: t.StringAbsoluteDir }) => Promise<void>;
  buildResetHtml?: boolean;

  /**
   * When true, allow mappings to overwrite existing staging files.
   *
   * Semantics:
   * - Directories are always merged (never replaced).
   * - Files:
   *   - overwrite=false (default): existing files are preserved (skipped).
   *   - overwrite=true: last write wins.
   */
  overwrite?: boolean;
};

export async function executeStaging(options: Args): Promise<void> {
  const { cwd, mappings, overwrite = false } = options;
  const total = mappings.length;

  const sourceBaseAbs = resolvePath(cwd, options.sourceRoot ?? '.');
  const stagingBaseAbs = resolvePath(cwd, options.stagingRoot ?? '.');
  const buildResetToken = options.buildResetHtml ? createBuildResetToken() : undefined;

  if (options.cleanStagingRoot) {
    if (!options.stagingRoot)
      throw new Error('executeStaging: cleanStagingRoot requires options.stagingRoot');
    const rootAbs = stagingBaseAbs;
    const cwdAbs = Path.resolve(cwd, '.');

    if (rootAbs === cwdAbs) {
      throw new Error("executeStaging: refusing to clean staging root '.' (would delete cwd)");
    }

    await Fs.remove(rootAbs, { log: false });
    await Fs.ensureDir(rootAbs);
  }

  const concurrencyRaw = options.concurrency;
  const concurrency =
    Is.num(concurrencyRaw) && Number.isFinite(concurrencyRaw) && concurrencyRaw > 0
      ? Math.floor(concurrencyRaw)
      : 1;

  const emit = (e: StagingProgressEvent) => options.onProgress?.(e);

  const standard = mappings.filter((m) => m.mode !== 'index');
  const indexes = mappings.filter((m) => m.mode === 'index');

  await runPhase({
    cwd,
    mappings: standard,
    overwrite,
    concurrency,
    sourceBaseAbs,
    stagingBaseAbs,
    emit,
    total,
    indexOffset: 0,
    indexBaseDomain: options.indexBaseDomain,
    buildResetToken,
  });

  await runPhase({
    cwd,
    mappings: indexes,
    overwrite,
    concurrency: 1,
    sourceBaseAbs,
    stagingBaseAbs,
    emit,
    total,
    indexOffset: standard.length,
    indexBaseDomain: options.indexBaseDomain,
    buildResetToken,
  });

  const rootAbs = stagingBaseAbs;
  // Always refresh the root index after successful staging (safe: only overwrites if marker present).
  await ensureIndexHtml(rootAbs, {
    force: true,
    baseDomain: options.indexBaseDomain,
    buildResetToken,
  });

  if (options.writeDistJson) {
    if (!options.stagingRoot)
      throw new Error('executeStaging: writeDistJson requires options.stagingRoot');

    const write = options.onWriteDistJson;
    if (!write) throw new Error('executeStaging: writeDistJson requires options.onWriteDistJson');
    await write({ stagingRoot: rootAbs });
  }
}

async function runPhase(args: {
  cwd: t.StringDir;
  mappings: t.Ary<t.DeployTool.Staging.Mapping>;
  overwrite: boolean;
  concurrency: number;
  sourceBaseAbs: t.StringDir;
  stagingBaseAbs: t.StringDir;
  emit: (e: StagingProgressEvent) => void;
  total: number;
  indexOffset: number;
  indexBaseDomain?: string;
  buildResetToken?: string;
}): Promise<void> {
  const {
    cwd,
    mappings,
    overwrite,
    concurrency,
    sourceBaseAbs,
    stagingBaseAbs,
    emit,
    total,
    indexOffset,
    indexBaseDomain,
    buildResetToken,
  } = args;
  const phaseTotal = mappings.length;
  if (phaseTotal === 0) return;

  let next = 0;
  let firstErr: unknown;

  const runOne = async (): Promise<void> => {
    while (true) {
      if (firstErr) return;

      const localIndex = next;
      next += 1;

      if (localIndex >= phaseTotal) return;

      const m = mappings[localIndex]!;
      const index = indexOffset + localIndex;
      const staging = resolvePath(stagingBaseAbs, m.dir.staging);
      const source =
        m.mode === 'index'
          ? resolvePath(stagingBaseAbs, m.dir.source)
          : resolvePath(sourceBaseAbs, m.dir.source);
      const dir: t.DeployTool.Staging.Dir =
        m.mode === 'index'
          ? { ...m.dir, staging }
          : { ...m.dir, source, staging };

      emit({ kind: 'mapping:start', index, total, mode: m.mode, source, staging });

      const reportStep = (step: t.DeployTool.Staging.ProgressReport<'mapping:step'>) => {
        emit({
          kind: 'mapping:step',
          index,
          total,
          mode: m.mode,
          source,
          staging,
          label: step.label,
        });
      };

      try {
        switch (m.mode) {
          case 'copy': {
            await execCopy(cwd, dir, reportStep, { overwrite, buildResetToken });
            break;
          }
          case 'build+copy': {
            await execBuildCopy(cwd, dir, reportStep, buildResetToken);
            break;
          }
          case 'index': {
            await execIndex(
              cwd,
              { ...dir, source: m.dir.source },
              reportStep,
              stagingBaseAbs,
              indexBaseDomain,
              buildResetToken,
            );
            break;
          }
        }

        emit({ kind: 'mapping:done', index, total, mode: m.mode, source, staging });
      } catch (error) {
        firstErr = error;
        emit({ kind: 'mapping:fail', index, total, mode: m.mode, source, staging, error });
        return;
      }
    }
  };

  const n = Math.min(concurrency, Math.max(1, phaseTotal));
  const workers: Promise<void>[] = [];
  for (let i = 0; i < n; i++) workers.push(runOne());
  await Promise.all(workers);

  if (firstErr) throw firstErr;
}
