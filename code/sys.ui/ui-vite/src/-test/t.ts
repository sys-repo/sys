import type { t } from './common.ts';

type EnvOptions = { outDir?: string };
type RunOptions = EnvOptions & {};

/**
 * Library: Vite testing helpers.
 */
export type TestViteLib = {
  readonly defineHandler: TestViteDefineConfigHandler;
  readonly outDir: { readonly default: string; random(): string };
  env(options?: EnvOptions): t.TestViteEnv;
  run(options?: RunOptions): Promise<t.TestViteRunResponse>;
};

export type TestViteEnv = {
  VITE_OUTDIR: string;
};

export type TestViteRunResponse = {
  paths: { outDir: string };
  cmd: string;
  output: t.CmdOutput;
  toString(): string;
};

/**
 * A vite [defineConfig] function configured
 * for unit-testing/mocking purposes.
 */
export type TestViteDefineConfigHandler = (ctx: t.ViteConfigEnv, mutate: t.ViteUserConfig) => void;
