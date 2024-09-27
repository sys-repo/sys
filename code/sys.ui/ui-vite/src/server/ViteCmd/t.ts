import type { t } from './common.ts';

type EnvOptions = { outDir?: t.StringPath; input?: t.StringPath };
type RunOptions = EnvOptions;

/**
 * Library: Tools for running Vite via commands issued to a child process.
 */
export type ViteCmdLib = {
  readonly defineHandler: t.ViteCmdDefineConfigHandler;
  readonly outDir: {
    readonly default: t.StringPath;
    readonly test: {
      readonly base: t.StringPath;
      random(): t.StringPath;
    };
  };
  env(options?: EnvOptions): t.ViteCmdEnv;
  build(options?: RunOptions): Promise<t.ViteCmdRunResponse>;
};

export type ViteCmdEnv = {
  VITE_OUTDIR: string;
  VITE_INPUT: string;
};

export type ViteCmdRunResponse = {
  paths: { outDir: t.StringPath };
  cmd: string;
  output: t.CmdOutput;
  toString(): string;
};

/**
 * A vite [defineConfig] function configured
 * for unit-testing/mocking purposes.
 */
export type ViteCmdDefineConfigHandler = (ctx: t.ViteConfigEnv, mutate: t.ViteUserConfig) => void;
