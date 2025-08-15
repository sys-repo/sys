import type { t } from './common.ts';

type ToStringOptions = { pad?: boolean };

/**
 * Library: Tools for running Vite via commands issued to a child process.
 */
export type ViteLib = {
  readonly Tmpl: t.ViteTmplLib;
  readonly Config: t.ViteConfigLib;

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

  /**
   * Create a backup snapshot of the project.
   */
  backup(args: t.ViteBackupArgs): Promise<t.DenoModuleBackup>;
};

/**
 * Arguments passed to the [Vite.build] method.
 */
export type ViteBuildArgs = {
  /** Override the current-working-directory path */
  cwd?: t.StringAbsoluteDir;
  /** Consuming module being built. */
  pkg?: t.Pkg;
  /** Supress all log output. */
  silent?: boolean;
  /** Show wait spinner. */
  spinner?: boolean;
  /** Exit the process with a non-zero code on failure (default: false). */
  exitOnError?: boolean;
};

/**
 * Arguments passed to the [Vite.dev] method.
 */
export type ViteDevArgs = {
  cwd?: t.StringAbsoluteDir;
  port?: number;
  pkg?: t.Pkg; // Consumer module.
  silent?: boolean;
  dispose$?: t.UntilObservable;
};

/**
 * Vite Child Process.
 * A long running process, for instance when running: "$ vite dev"
 */
export type ViteProcess = t.LifecycleAsync & {
  readonly proc: t.ProcHandle;
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
 * Response from a vite command (such as `build`).
 */
export type ViteBuildResponse = {
  readonly ok: boolean;
  readonly paths: t.ViteConfigPaths;
  readonly dist: t.DistPkg;
  readonly cmd: { readonly input: string; readonly output: t.ProcOutput };
  readonly elapsed: t.Msecs;
  toString(options?: ToStringOptions): string;
};

/** Arguments passed to the `VitePress.Env.backup` method. */
export type ViteBackupArgs = {
  dir: t.StringDir;
  silent?: boolean;
  includeDist?: boolean;
  message?: string;
  force?: boolean;
};
