import { type t, Fs, Is, Path } from '../common.ts';
import { execBuildCopy } from './u.execBuildCopy.ts';
import { execCopy } from './u.execCopy.ts';

export type StagingProgressEvent = t.DeployTool.Staging.ProgressEvent;
export type ExecuteStagingOptions = t.DeployTool.Staging.ExecuteOptions & {
  readonly concurrency?: number;
  readonly onProgress?: (e: StagingProgressEvent) => void;

  /**
   * Optional single staging root dir for deterministic lifecycle operations.
   * - cleanStagingRoot: delete + recreate before running any mappings.
   * - writeDistJson: callback invoked after successful completion.
   */
  readonly stagingRoot?: t.StringDir;
  readonly cleanStagingRoot?: boolean;
  readonly writeDistJson?: boolean;
  readonly onWriteDistJson?: (args: { readonly stagingRoot: t.StringDir }) => Promise<void>;
};

export async function executeStaging(
  mappings: readonly t.DeployTool.Staging.Mapping[],
  options: ExecuteStagingOptions = {},
): Promise<void> {
  const cwd = options.cwd ?? '.';
  const total = mappings.length;

  const resolveAbs = (base: string, p: string): string => {
    const s = String(p ?? '');
    return Path.Is.absolute(s) ? s : Path.resolve(base, s);
  };

  const resolveStagingRootAbs = (): string => {
    const raw = String(options.stagingRoot ?? '').trim();
    if (!raw) return '';
    return resolveAbs(cwd, raw);
  };

  if (options.cleanStagingRoot) {
    const rootAbs = resolveStagingRootAbs();
    if (!rootAbs) throw new Error('executeStaging: cleanStagingRoot requires options.stagingRoot');

    const cwdAbs = Path.resolve(cwd, '.');
    if (rootAbs === cwdAbs) {
      throw new Error("executeStaging: refusing to clean stagingRoot '.' (would delete cwd)");
    }

    await Fs.remove(rootAbs, { log: false });
    await Fs.ensureDir(rootAbs);
  }

  const concurrencyRaw = options.concurrency;
  const concurrency =
    Is.num(concurrencyRaw) && Number.isFinite(concurrencyRaw) && concurrencyRaw > 0
      ? Math.floor(concurrencyRaw)
      : 4;

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
      const source = resolveAbs(cwd, String(m.dir.source ?? ''));
      const staging = resolveAbs(cwd, String(m.dir.staging ?? ''));
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
            await execCopy(cwd, dir, reportStep);
            break;
          }
          case 'build+copy': {
            await execBuildCopy(cwd, dir, reportStep);
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

  if (options.writeDistJson) {
    const rootAbs = resolveStagingRootAbs();
    if (!rootAbs) throw new Error('executeStaging: writeDistJson requires options.stagingRoot');

    const write = options.onWriteDistJson;
    if (!write) throw new Error('executeStaging: writeDistJson requires options.onWriteDistJson');
    await write({ stagingRoot: rootAbs });
  }
}
