import { c, type t } from './common.ts';

export const Fmt: t.WorkspacePkg.Fmt.Lib = {
  summary(result: t.WorkspacePkg.SyncResult) {
    const summary = [
      `${result.written} written`,
      `${result.skipped} skipped`,
      `${result.unchanged} unchanged`,
    ].join(', ');
    const isNoop = result.count > 0 && result.written === 0 && result.skipped === 0;
    const label = `${c.gray('Package prep ')}${c.cyan('src/pkg.ts')}${c.gray(':')}`;
    const fmtSummary = isNoop ? c.dim(summary) : c.white(summary);
    return `${label} ${fmtSummary}`;
  },
};
