import type { t } from './common.ts';

type P = t.StringPath;

/**
 * CLI command entrypoint surface.
 */
export declare namespace ViteEntry {
  /** CLI entry runtime surface. */
  export type Lib = {
    /** Main entry: parse and delegate argv with optional caller-owned dev presentation. */
    main(argv?: string[] | Args, options?: DevOptions): Promise<void>;

    /** Start the HMR `dev` server. */
    dev(args: Args.Dev): Promise<void>;

    /** Build the production `dist` bundle. */
    build(args: Args.Build): Promise<void>;

    /** Serve one locally verified production Dist preview. */
    serve(args: Args.Serve): Promise<void>;
  };

  /** Programmatic presentation options for development, not argv flags. */
  export type DevOptions = {
    /** Opt in to JSR release navigation only for this absolute application directory. */
    readonly jsrPackageDir?: t.StringAbsoluteDir;
  };

  /** ARGV (Command Line Arguments). */
  export type Args = Args.Dev | Args.Build | Args.Serve | Args.Info;

  /**
   * Command argument variants.
   */
  export namespace Args {
    /** The HMR `dev` server. */
    export type Dev = {
      cmd: 'dev';
      dir?: P;
      entry?: P;
      open?: boolean;
      port?: number;
      reporter?: t.Vite.Dev.ReporterMode;
      /** Package subpath appended to the dev-server presentation identity. */
      pkgSubpath?: string;
      /** CLI field corresponding to `pkgSubpath`. */
      'pkg-subpath'?: string;
      logLines?: number;
      'log-lines'?: number;
    };

    /** The `build` project command. */
    export type Build = { cmd: 'build'; dir?: P; silent?: boolean };

    /** The locally verified production Dist preview command. */
    export type Serve = {
      cmd: 'serve';
      port?: number;
      dir?: P;
      silent?: boolean;
      /** Package subpath appended to the verified preview display identity. */
      pkgSubpath?: string;
      /** CLI field corresponding to `pkgSubpath`. */
      'pkg-subpath'?: string;
    };

    /** The `info` information command. */
    export type Info = { cmd: 'info'; dir?: P; info?: boolean };
  }
}
