import type { t } from '../src/common.ts';

export type * from '../src/common/t.ts';
export type { DeployTool } from '@sys/tools/t';

/** Script-local admission of the recorded build; callers own refusal policy. */
export type BuildSelection =
  | t.FsPkg.Dist.Pinned.Verify.Failure
  | { readonly kind: 'selection-mismatch' }
  | (t.FsPkg.Dist.Pinned.Verify.Verified & {
    readonly artifact: t.Artifact;
    readonly dir: t.StringDir;
    /** Recheck the captured directory and manifest pin without reloading selection metadata. */
    readonly verify: () => Promise<t.FsPkg.Dist.Pinned.Verify.Result>;
  });
