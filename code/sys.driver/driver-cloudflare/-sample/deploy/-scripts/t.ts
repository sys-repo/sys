import type { t } from '../src/common.ts';

export type * from '../src/common/t.ts';
export type { DeployTool } from '@sys/tools/t';

/** Fixture seams for the same proof orchestration used by the executable task. */
export type ProofOptions = {
  readonly root?: t.StringDir;
  readonly env?: t.EnvReader;
  readonly start?: (app: t.HttpServer.App) => Pick<t.HttpServer.Started, 'close' | 'finished'>;
  readonly log?: (message: string) => void;
};

/** Script-local admission of the recorded build; callers own refusal policy. */
export type BuildSelection =
  | t.FsPkg.Dist.Pinned.Verify.Failure
  | (t.FsPkg.Dist.Pinned.Verify.Verified & {
    readonly files: readonly string[];
    readonly dir: t.StringDir;
    /** Recheck the captured directory and manifest pin without reloading selection metadata. */
    readonly verify: () => Promise<t.FsPkg.Dist.Pinned.Verify.Result>;
  });
