import type { t } from '../src/common.ts';

export type * from '../src/common/t.ts';
export type { DeployTool } from '@sys/tools/t';
export type { HttpFetch } from '@sys/http/t';

/** Executable tasks that consume one configured credential pair. */
export type CredentialTask = 'push:public' | 'push:private' | 'serve' | 'proof:local';

/** Sample-owned lifecycle endpoint, structurally compatible with ordinary Cell startup. */
export type SampleService = {
  start(args: SampleServiceArgs): Promise<t.HttpServer.Started>;
};

/** Both callers identify the sample root and its fixed configuration file. */
export type SampleServiceArgs = {
  cwd: t.StringDir;
  paths: { config: t.StringPath };
  silent?: boolean;
  until?: t.UntilInput;
};

/** Internal bootstrap boundaries for provider-free composition tests. */
export type SampleServiceDependencies = {
  readInputs(root: t.StringDir): Promise<t.AppInputs>;
  loadEnv(root: t.StringDir): Promise<t.EnvReader>;
  appFrom(inputs: t.AppInputs, env: t.EnvReader): Promise<t.HttpServer.App>;
  start: t.HttpServer.Lib['start'];
};

/** IO boundaries for the same proof orchestration used by the executable task. */
export type ProofOptions = {
  readonly root?: t.StringDir;
  readonly env?: t.EnvReader;
  readonly start?: (app: t.HttpServer.App) => AsyncDisposable;
  /** Await each report before continuing. Return values are ignored; failures stop the proof. */
  readonly log?: (message: string) => t.IgnoredResult;
};
