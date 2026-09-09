import { FmtApplied } from './u.fmt.applied.ts';
import { FmtBase } from './u.fmt.base.ts';
import { FmtDiagnostics } from './u.fmt.diagnostics.ts';
import { FmtPlan } from './u.fmt.plan.ts';
import { FmtProgress } from './u.fmt.progress.ts';
import { FmtSelection } from './u.fmt.selection.ts';
import { FmtStanddown } from './u.fmt.standdown.ts';

/** Public CLI formatter surface. */
export const Fmt = Object.freeze(
  {
    ...FmtBase,
    ...FmtProgress,
    ...FmtPlan,
    ...FmtDiagnostics,
    ...FmtSelection,
    ...FmtStanddown,
    ...FmtApplied,
  } as const,
);
