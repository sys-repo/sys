import { type t, Fs, Is, Path } from '../common.ts';
import { execBuildCopy } from './u.execBuildCopy.ts';
import { execCopy } from './u.execCopy.ts';
import { ensureIndexHtml } from './u.generateHtml.ts';
import { resolvePath } from '../u.endpoints/u.resolve.ts';

export type StagingProgressEvent = t.DeployTool.Staging.ProgressEvent;

const isWithinRoot = (rootAbs: string, targetAbs: string): boolean => {
  const rel = Path.relative(rootAbs, targetAbs);
  if (rel === '') return true;
  if (Path.Is.absolute(rel)) return false;
  if (rel === '..') return false;
  if (rel.startsWith('../') || rel.startsWith('..\\')) return false;
  return true;
};
type Args = {
  cwd: t.StringDir;
  mappings: t.Ary<t.DeployTool.Staging.Mapping>;
  concurrency?: number;
  onProgress?: (e: StagingProgressEvent) => void;
  sourceRoot?: string;

  /**
   * Optional single staging root dir for deterministic lifecycle operations.
   * - cleanStagingRoot: delete + recreate each mapping's staging target before running any mappings.
   * - writeDistJson: callback invoked after successful completion.
   */
  stagingRoot?: t.StringRelativeDir;
  cleanStagingRoot?: boolean;
  writeDistJson?: boolean;
  onWriteDistJson?: (e: { stagingRoot: t.StringAbsoluteDir }) => Promise<void>;

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

  if (options.cleanStagingRoot) {
    if (!options.stagingRoot) throw new Error('executeStaging: cleanStagingRoot requires options.stagingRoot');
    const rootAbs = stagingBaseAbs;
    const cwdAbs = Path.resolve(cwd, '.');

    const targets = new Set<string>();
    for (const m of mappings) {
      const targetAbs = resolvePath(stagingBaseAbs, m.dir.staging);
      if (!isWithinRoot(rootAbs, targetAbs)) {
        throw new Error(`executeStaging: staging target escapes stagingRoot: ${targetAbs}`);
      }
      if (targetAbs === cwdAbs) {
        throw new Error("executeStaging: refusing to clean staging target '.' (would delete cwd)");
      }
      targets.add(targetAbs);
    }

    for (const targetAbs of targets) {
      await Fs.remove(targetAbs, { log: false });
      await Fs.ensureDir(targetAbs);
    }
  }

  const concurrencyRaw = options.concurrency;
  const concurrency =
    Is.num(concurrencyRaw) && Number.isFinite(concurrencyRaw) && concurrencyRaw > 0
      ? Math.floor(concurrencyRaw)
      : 1;

  const emit = (e: StagingProgressEvent) => options.onProgress?.(e);
  let next = 0;
  let firstErr: unknown;

  const runOne = async (): Promise<void> => {
    while (true) {
      if (firstErr) return;

      const index = next;
      next += 1;

      if (index >= total) return;

      const m = mappings[index]!;
      const source = resolvePath(sourceBaseAbs, m.dir.source);
      const staging = resolvePath(stagingBaseAbs, m.dir.staging);
      const dir: t.DeployTool.Staging.Dir = { ...m.dir, source, staging };

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
            await execCopy(cwd, dir, reportStep, { overwrite });
            break;
          }
          case 'build+copy': {
            await execBuildCopy(cwd, dir, reportStep, { overwrite });
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

  const n = Math.min(concurrency, Math.max(1, total));
  const workers: Promise<void>[] = [];
  for (let i = 0; i < n; i++) workers.push(runOne());
  await Promise.all(workers);

  if (firstErr) throw firstErr;

  const rootAbs = stagingBaseAbs;
  await ensureIndexHtml(rootAbs);

  if (options.writeDistJson) {
    if (!options.stagingRoot) throw new Error('executeStaging: writeDistJson requires options.stagingRoot');

    const write = options.onWriteDistJson;
    if (!write) throw new Error('executeStaging: writeDistJson requires options.onWriteDistJson');
    await write({ stagingRoot: rootAbs });
  }
}
