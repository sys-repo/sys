import type { t } from './common.ts';

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

  /**
   * A plugin that configures the project to run in a child-process.
   * Use this within a `vite.config.ts` in the root of the host project.
   */
  workspacePlugin(options?: t.WorkspacePluginOptions): Promise<t.WorkspacePlugin>;
  workspacePlugin(filter: t.WorkspaceFilter): Promise<t.WorkspacePlugin>;

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
 * Options passed to the workspace-plugin.
 */
export type WorkspacePluginOptions = {
  /**
   * Enabled deno workspace support.
   *
   * - (default: enabled: walks up to find first available workspace `deno.json` file.)
   * - pass a specific `deno.json` file string if in a non-standard place.
   * - pass `false` to disable workspace {alias} mapping.
   */
  workspace?: false | t.DenofilePath;

  /**
   * ƒ(🌳): Filter to apply to the workspace modules
   *       (default: nothing filtered → ie. the entire monorepo is available for `import`).
   */
  filter?: t.WorkspaceFilter;

  /**
   * ƒ(🌳): Callback to mutate the generated Vite configuration before
   *        it is passed on to the next step in the bundle pipeline
   */
  mutate?: t.ViteConfigMutate;
};

/**
 * A Vite plugin that prepares configuration with "standard/common" setup.
 */
export type WorkspacePlugin = {
  name: string;
  ws?: t.ViteDenoWorkspace;
  config(config: t.ViteUserConfig, env: t.ViteConfigEnv): Omit<t.ViteUserConfig, 'plugins'>;
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
