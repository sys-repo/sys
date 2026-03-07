import type { t } from './common.ts';

type Path = t.StringPath;

export type CopyPlan = {
  /** New files (untracked OR added in index). */
  readonly add: readonly Path[];

  /** Modified tracked files (staged and/or unstaged). */
  readonly modify: readonly Path[];

  /** Removed files (deleted in index and/or working tree). */
  readonly remove: readonly Path[];

  /** Renames are first-class for clarity. */
  readonly rename: readonly { readonly from: Path; readonly to: Path }[];

  /** Conflicts / unmerged paths: visible and flagged. */
  readonly conflict: readonly Path[];

  /** Submodules: visible and flagged (if detected). */
  readonly submodule: readonly Path[];
};

export type CopyPlanRunResult =
  | { readonly ok: true; readonly plan: CopyPlan }
  | { readonly ok: false; readonly reason: string; readonly error?: unknown };
