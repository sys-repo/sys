import type { t } from '../src/common.ts';

export type * from '../src/common/t.ts';
export type { DeployTool } from '@sys/tools/t';
export type { HttpFetch } from '@sys/http/t';

/** Executable tasks that consume one configured credential pair. */
export type CredentialTask = 'push:public' | 'push:private' | 'serve' | 'proof:local';

/** IO boundaries for the same proof orchestration used by the executable task. */
export type ProofOptions = {
  readonly root?: t.StringDir;
  readonly env?: t.EnvReader;
  readonly start?: (app: t.HttpServer.App) => AsyncDisposable;
  /** Await each report before continuing. Return values are ignored; failures stop the proof. */
  readonly log?: (message: string) => t.IgnoredResult;
};
