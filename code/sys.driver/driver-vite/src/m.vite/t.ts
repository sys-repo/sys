import type { Pkg as FsPkg } from '@sys/fs/t';
import type { t } from './common.ts';

/**
 * Tools for running Vite via commands issued to a child process.
 */
export declare namespace Vite {
  /** Public Vite command driver surface. */
  export type Lib = {
    readonly Config: t.ViteConfig.Lib;
    readonly Startup: t.ViteStartup.Lib;

    /** Build the application into its configured output directory. */
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
      /** Directory containing `vite.config.ts`; used only when `paths` is omitted. */
      cwd?: t.StringAbsoluteDir;
      /**
       * Build paths. If omitted, read from `vite.config.ts`.
       * Supplied paths are copied before asynchronous work begins.
       * Vite still loads `vite.config.ts`; only `app.outDir` and `app.base` override its settings.
       * Entry points, workers, and plugins remain configured in that file.
       */
      paths?: t.ViteConfig.Paths;
      /** Consuming module being built. */
      pkg?: t.Pkg;
      /** Hide build progress. Errors are still logged. */
      silent?: boolean;
      /** Show a progress spinner unless `silent` is set (default: true). */
      spinner?: boolean;
      /** Exit with code 1 on a failed build (default: true). */
      exitOnError?: boolean;
    };

    /** Response from a Vite command such as `build`. */
    export type Response = {
      readonly ok: boolean;
      readonly paths: t.ViteConfig.Paths;
      readonly dist: t.DistPkg;
      /** SHA-256 checksum of the generated `dist.json` bytes. */
      readonly manifest: Manifest;
      readonly cmd: { readonly input: string; readonly output: t.Process.Output };
      readonly elapsed: t.Msecs;
      toString(options?: ToStringOptions): string;
    };

    /**
     * SHA-256 checksum of the generated `dist.json` bytes.
     * A successful build saves those exact bytes.
     *
     * For verification, obtain the expected checksum from a trusted source
     * independent of the manifest download.
     */
    export type Manifest = FsPkg.Dist.Compute.Manifest;

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
    /** Arguments passed to the [Vite.dev] method. */
    export type Args = Options & PackageInput;

    /** Vite child process for long-running commands such as `$ vite dev`. */
    export type Process = t.LifecycleAsync & {
      readonly proc: t.Process.Handle;
      readonly port: number;
      readonly url: t.StringPath;
      listen(): Promise<void>;
      keyboard(): Promise<void>;
    };

    /** Reporter mode for dev server output. */
    export type ReporterMode = 'auto' | 'screen' | 'raw';

    /** Base dev-server options independent of package identity. */
    export type Options = {
      cwd?: t.StringAbsoluteDir;
      /** Explicit path authority, bypassing config file discovery when known. */
      paths?: t.ViteConfig.Paths;
      port?: number;
      /** Fail startup if the requested port is unavailable. */
      strictPort?: boolean;
      silent?: boolean;
      /** Select parent-owned screen reporting or raw Vite passthrough. */
      reporter?: ReporterMode;
      /** Maximum visible Vite output rows in screen reporter mode. */
      logLines?: number;
      until?: t.UntilInput;
    };

    /** Package-backed presentation input; subpaths cannot exist without package metadata. */
    export type PackageInput =
      | { pkg?: undefined; pkgSubpath?: never }
      | { pkg: t.Pkg; pkgSubpath?: string };
  }
}
