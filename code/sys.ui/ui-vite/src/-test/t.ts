import type { t } from './common.ts';

type EnvOptions = { outDir?: t.StringPath; input?: t.StringPath };
type RunOptions = EnvOptions & {};

/**
 * Library: Vite testing helpers.
 */
export type TestViteLib = {
  readonly defineHandler: TestViteDefineConfigHandler;
  readonly outDir: {
    readonly default: t.StringPath;
    random(): t.StringPath;
  };
  env(options?: EnvOptions): t.TestViteEnv;
  run(options?: RunOptions): Promise<t.TestViteRunResponse>;
};

export type TestViteEnv = {
  VITE_OUTDIR: string;
  VITE_INPUT: string;
};

export type TestViteRunResponse = {
  paths: { outDir: t.StringPath };
  cmd: string;
  output: t.CmdOutput;
  toString(): string;
};

/**
 * A vite [defineConfig] function configured
 * for unit-testing/mocking purposes.
 */
export type TestViteDefineConfigHandler = (ctx: t.ViteConfigEnv, mutate: t.ViteUserConfig) => void;
