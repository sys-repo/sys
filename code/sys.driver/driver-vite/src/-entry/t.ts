import type { t } from './common.ts';

type P = t.StringPath;

/**
 * The API invoked via the CLI command API.
 */
export declare namespace ViteEntry {
  /** CLI entry runtime surface. */
  export type Lib = {
    /** Main entry: [argv] "cmd" parse and delegate.  */
    main(argv?: string[] | Args): Promise<void>;

    /** Start the HMR `dev` server. */
    dev(args: Args.Dev): Promise<void>;

    /** Build the production `dist` bundle. */
    build(args: Args.Build): Promise<void>;

    /** Start the HTTP static server on the bundled `dist/*` folder. */
    serve(args: Args.Serve): Promise<void>;
  };

  /** ARGV (Command Line Arguments). */
  export type Args = Args.Dev | Args.Build | Args.Serve | Args.Info;

  /**
   * Command argument variants.
   */
  export namespace Args {
    /** The HMR `dev` server. */
    export type Dev = { cmd: 'dev'; dir?: P; entry?: P; open?: boolean };

    /** The `build` project command. */
    export type Build = { cmd: 'build'; dir?: P; silent?: boolean };

    /** The `serve` the built project `/dist` folder command. */
    export type Serve = { cmd: 'serve'; port?: number; dir?: P; silent?: boolean };

    /** The `info` information command. */
    export type Info = { cmd: 'info'; dir?: P; info?: boolean };
  }
}
