import { type t, Is, Path } from '../common.ts';
import { execBuildCopy } from './u.execBuildCopy.ts';
import { execCopy } from './u.execCopy.ts';

export type StagingProgressEvent = t.DeployTool.Staging.ProgressEvent;
export type ExecuteStagingOptions = t.DeployTool.Staging.ExecuteOptions & {
  readonly concurrency?: number;
  readonly onProgress?: (e: StagingProgressEvent) => void;
};

export async function executeStaging(
  mappings: readonly t.DeployTool.Staging.Mapping[],
  options: ExecuteStagingOptions = {},
): Promise<void> {
  const cwd = options.cwd ?? '.';
  const total = mappings.length;

  const concurrencyRaw = options.concurrency;
  const concurrency =
    Is.num(concurrencyRaw) && Number.isFinite(concurrencyRaw) && concurrencyRaw > 0
      ? Math.floor(concurrencyRaw)
      : 4;

  const emit = (e: StagingProgressEvent) => options.onProgress?.(e);

  const resolveAbs = (base: string, p: string): string => {
    const s = String(p ?? '');
    return Path.Is.absolute(s) ? s : Path.resolve(base, s);
  };

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
}
