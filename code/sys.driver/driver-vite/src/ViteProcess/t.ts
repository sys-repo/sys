import type { t } from './common.ts';

export type ViteBuildArgs = {
  input: t.StringPath;
  outDir?: t.StringPath;
  silent?: boolean;
  Pkg?: t.Pkg; // Consumer module.
};
export type ViteDevArgs = {
  input: t.StringPath;
  outDir?: t.StringPath;
  port?: number;
  silent?: boolean;
  Pkg?: t.Pkg; // Consumer module.
};

/**
 * Library: Tools for running Vite via commands issued to a child process.
 */
export type ViteProcessLib = {
  Config: t.ViteConfigLib;

  /**
   * A plugin that configures the project to run in a child-process.
   * Use this within a `vite.config.ts` in the root of the host project.
   */
  readonly plugin: t.VitePluginFactory;

  /**
   * Run the <vite:build> command.
   */
  build(args: ViteBuildArgs): Promise<t.ViteRunResponse>;

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
  dev(args: ViteDevArgs): Promise<t.ViteProcess>;
};

/**
 * Vite Child Process.
 * A long running process, for instance when running: "$ vite dev"
 */
export type ViteProcess = {
  readonly proc: t.CmdProcessHandle;
  readonly port: number;
  readonly url: t.StringPath;
  keyboard(): Promise<void>;
  dispose(): Promise<void>;
};

/**
 * A plugin that configures the project to run in a child-process.
 * Use this within a `vite.config.ts` in the root of the host project.
 */
export type VitePluginFactory = (modify?: t.VitePluginModifier) => t.VitePluginOption;

export type VitePluginModifier = (e: t.VitePluginModifierArgs) => void;
export type VitePluginModifierArgs = {
  readonly config: t.ViteUserConfig;
  readonly env: t.ViteConfigEnv;
};

/* Environment variables passed to the child process. */
export type ViteProcessEnv = { VITE_OUTDIR: string; VITE_INPUT: string };

/**
 * Response from a vite command (such as `build`).
 */
export type ViteRunResponse = {
  readonly ok: boolean;
  readonly cmd: string;
  readonly output: t.CmdOutput;
  readonly paths: t.ViteConfigPaths;
  toString(): string;
};
