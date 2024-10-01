import type { t } from './common.ts';

export type ViteEnvOptions = { input?: t.StringPath; outDir?: t.StringPath };
export type ViteBuildArgs = { input: t.StringPath; outDir?: t.StringPath; silent?: boolean };
export type ViteDevArgs = {
  input: t.StringPath;
  outDir?: t.StringPath;
  port?: number;
  silent?: boolean;
};

/**
 * Library: Tools for running Vite via commands issued to a child process.
 */
export type ViteCmdLib = {
  readonly outDir: {
    readonly default: t.StringPath;
    readonly test: {
      readonly base: t.StringPath;
      random(uniq?: string): t.StringPath;
    };
  };

  /**
   * Prepares a set of known env-vars to hand to the child process.
   */
  env(options?: ViteEnvOptions): t.ViteCmdEnv;

  /**
   * Prepare paths for the vite build.
   */
  paths(options?: ViteEnvOptions): t.ViteCmdPaths;

  /**
   * Run the <vite:build> command.
   */
  build(args: ViteBuildArgs): Promise<t.ViteCmdRunResponse>;

  /**
   * Long running processes (spawn → child process).
   */
  start: {
    /**
     * Run the <vite:build> command.
     */
    dev(args: ViteDevArgs): t.ViteCmdChildProcess;
  };
};

export type ViteCmdPaths = { input: t.StringPath; outDir: t.StringPath };
export type ViteCmdEnv = { VITE_OUTDIR: string; VITE_INPUT: string };

export type ViteCmdRunResponse = {
  readonly ok: boolean;
  readonly cmd: string;
  readonly output: t.CmdOutput;
  readonly paths: ViteCmdPaths;
  toString(): string;
};

/**
 * Vite Child Process.
 * A long running process, for instance when running: "$ vite dev"
 */
export type ViteCmdChildProcess = {
  readonly process: t.CmdProcessHandle;
  readonly whenReady: t.CmdProcessHandle['whenReady'];
  readonly port: number;
  readonly url: t.StringPath;
  dispose(): Promise<void>;
};
