import type { t } from './common.ts';

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
  Config: t.ViteConfigLib;

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
