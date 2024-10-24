import type { t } from './common.ts';
import type { defineConfig } from 'vite';

type ToStringOptions = { pad?: boolean };

/**
 * Arguments passed to the [.build] method.
 */
export type ViteBuildArgs = {
  input: t.StringPath;
  outDir?: t.StringPath;
  silent?: boolean;
  Pkg?: t.Pkg; // Consumer module.
};

/**
 * Arguments passed to the [.dev] method.
 */
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
export type ViteLib = {
  Config: t.ViteConfigLib;
  Plugin: t.VitePluginLib;

  /**
   * Run the <vite:build> command.
   */
  build(args: ViteBuildArgs): Promise<t.ViteBuildResponse>;

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
  readonly cmd: string;
  readonly output: t.CmdOutput;
  readonly paths: t.ViteConfigPaths;
  toString(options?: ToStringOptions): string;
};
