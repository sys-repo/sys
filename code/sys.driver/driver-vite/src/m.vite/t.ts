import type { t } from './common.ts';

/**
 * Tools for running Vite via commands issued to a child process.
 */
export declare namespace Vite {
  /** Public Vite command driver surface. */
  export type Lib = {
    readonly Config: t.ViteConfig.Lib;
    readonly Startup: t.ViteStartup.Lib;

    /** Run the Vite `build` command to produce an output `/dist` bundle. */
    build(args: Build.Args): Promise<Build.Response>;

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
    dev(args: Dev.Args): Promise<Dev.Process>;
  };

  /**
   * Vite build command contract.
   */
  export namespace Build {
    /** Arguments passed to the [Vite.build] method. */
    export type Args = {
      /** Override the current-working-directory path */
      cwd?: t.StringAbsoluteDir;
      /** Explicit path authority, bypassing config file discovery when known. */
      paths?: t.ViteConfig.Paths;
      /** Consuming module being built. */
      pkg?: t.Pkg;
      /** Suppress all log output. */
      silent?: boolean;
      /** Show wait spinner. */
      spinner?: boolean;
      /** Exit the process with a non-zero code on failure (default: false). */
      exitOnError?: boolean;
    };

    /** Response from a Vite command such as `build`. */
    export type Response = {
      readonly ok: boolean;
      readonly paths: t.ViteConfig.Paths;
      readonly dist: t.DistPkg;
      readonly cmd: { readonly input: string; readonly output: t.Process.Output };
      readonly elapsed: t.Msecs;
      toString(options?: ToStringOptions): string;
    };

    /** Formatting options for command response text. */
    export type ToStringOptions = {
      /** Add a leading and trailing blank line. */
      pad?: boolean;
      /** Maximum rendered line width for terminal-safe presentation. */
      width?: number;
    };
  }

  /**
   * Vite dev command contract.
   */
  export namespace Dev {
    /** Reporter mode for dev server output. */
    export type ReporterMode = 'auto' | 'screen' | 'raw';

    /** Arguments passed to the [Vite.dev] method. */
    export type Args = {
      cwd?: t.StringAbsoluteDir;
      /** Explicit path authority, bypassing config file discovery when known. */
      paths?: t.ViteConfig.Paths;
      port?: number;
      /** Fail startup if the requested port is unavailable. */
      strictPort?: boolean;
      pkg?: t.Pkg; // Consumer module.
      silent?: boolean;
      /** Select parent-owned screen reporting or raw Vite passthrough. */
      reporter?: ReporterMode;
      /** Maximum visible Vite output rows in screen reporter mode. */
      logLines?: number;
      until?: t.UntilInput;
    };

    /** Vite child process for long-running commands such as `$ vite dev`. */
    export type Process = t.LifecycleAsync & {
      readonly proc: t.Process.Handle;
      readonly port: number;
      readonly url: t.StringPath;
      listen(): Promise<void>;
      keyboard(): Promise<void>;
    };
  }
}
