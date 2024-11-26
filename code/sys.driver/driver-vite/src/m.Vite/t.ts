import type { t } from './common.ts';

type ToStringOptions = { pad?: boolean };

/**
 * Library: Tools for running Vite via commands issued to a child process.
 */
export type ViteLib = {
  readonly Config: t.ViteConfigLib;
  readonly Plugin: t.VitePluginLib;
  common: t.VitePluginLib['common'];

  /**
   * Run the Vite `build` command to produce an output `/dist` bundle.
   */
  build(args: ViteBuildArgs): Promise<t.ViteBuildResponse>;

  /**
   * Run the Vite `dev` command.
   * Long running processes (spawn → child process).
   *
   * Command:
   *    $ vite dev --port=<1234>
   *
   * Terminal Output:
   *
   *    VITE v<x.x.x>  ready in 350 ms
   *
   *    ➜  Local:   http://localhost:1234/
   *    ➜  Network: use --host to expose
   */
  dev(args: ViteDevArgs): Promise<t.ViteProcess>;
};

/**
 * Arguments passed to the [Vite.build] method.
 */
export type ViteBuildArgs = {
  input: t.StringPath;
  outDir?: t.StringPath;
  silent?: boolean;
  pkg?: t.Pkg; // Consumer module.
};

/**
 * Arguments passed to the [Vite.dev] method.
 */
export type ViteDevArgs = {
  dispose$?: t.UntilObservable;
  input: t.StringPath;
  outDir?: t.StringPath;
  port?: number;
  silent?: boolean;
  pkg?: t.Pkg; // Consumer module.
};

/**
 * Vite Child Process.
 * A long running process, for instance when running: "$ vite dev"
 */
export type ViteProcess = t.LifecycleAsync & {
  readonly proc: t.CmdProcessHandle;
  readonly port: number;
  readonly url: t.StringPath;
  listen(): Promise<void>;
  keyboard(): Promise<void>;
};

/**
 * Function that mutates a configuration upon callback.
 */
export type ViteConfigMutate = (e: t.ViteConfigMutateArgs) => void;

/**
 * Arguments passed to the configuration mutation callback.
 */
export type ViteConfigMutateArgs = {
  readonly config: t.ViteUserConfig;
  readonly env: t.ViteConfigEnv;
  readonly ws?: t.ViteDenoWorkspace;
};

/**
 * Environment variables passed to the child process.
 */
export type ViteProcessEnv = {
  VITE_INPUT: string;
  VITE_OUTDIR: string;
};

/**
 * Response from a vite command (such as `build`).
 */
export type ViteBuildResponse = {
  readonly ok: boolean;
  readonly paths: t.ViteConfigPaths;
  readonly dist: t.DistPkg;
  readonly cmd: { readonly input: string; readonly output: t.CmdOutput };
  readonly elapsed: t.Msecs;
  toString(options?: ToStringOptions): string;
};
