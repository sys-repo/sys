import type { t } from './common.ts';

export type ViteEnvOptions = { input?: t.StringPath; outDir?: t.StringPath };
export type ViteBuildArgs = { input: t.StringPath; outDir?: t.StringPath; silent?: boolean };
export type ViteDevArgs = {
  input: t.StringPath;
  outDir?: t.StringPath;
  port?: number;
  silent?: boolean;
  Pkg?: t.Pkg; // Host module.
};

/**
 * Library: Tools for running Vite via commands issued to a child process.
 */
export type ViteCmdLib = {
  Config: ViteCmdConfig;

  /**
   * Run the <vite:build> command.
   */
  build(args: ViteBuildArgs): Promise<t.ViteCmdRunResponse>;

  /**
   * Run the <vite:build> command.
   * Long running processes (spawn → child process).
   *
   * Command:
   *    $ vite dev --port=<1234>
   *
   * Terminal Output:
   *
   *    VITE v5.4.7  ready in 350 ms
   *
   *    ➜  Local:   http://localhost:1234/
   *    ➜  Network: use --host to expose
   */
  dev(args: ViteDevArgs): t.ViteCmdChildProcess;
};

export type ViteCmdPaths = { input: t.StringPath; outDir: t.StringPath };
export type ViteCmdEnv = { VITE_OUTDIR: string; VITE_INPUT: string };

/**
 * Configuration options for a Vite server.
 */
export type ViteCmdConfig = {
  /**
   * The output directory path (helpers and generators).
   */
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
};

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
  readonly proc: t.CmdProcessHandle;
  readonly port: number;
  readonly url: t.StringPath;
  readonly whenReady: t.CmdProcessHandle['whenReady'];
  keyboard(): Promise<void>;
  dispose(): Promise<void>;
};
