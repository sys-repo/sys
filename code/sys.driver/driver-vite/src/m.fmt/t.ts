import type { t } from './common.ts';

/**
 * Tools for logging common Vite related output.
 */
export declare namespace ViteLog {
  /** Vite logging runtime surface. */
  export type Lib = {
    /** Log bundled distribution details. */
    readonly Bundle: Bundle.Lib;

    /** Log pkg/module details. */
    readonly Module: Module.Lib;

    /** Log a `/dist` bundle folder. */
    readonly Dist: Dist.Lib;

    /** Log the common "dev/build/serve" API.  */
    readonly API: API.Lib;

    /** Command output. */
    readonly Help: Help.Lib;

    /** Helper for padding an output string. */
    pad(text: string, pad?: boolean): string;

    /** Format the digest-hash. */
    digest(hash?: t.StringHash): string;

    /** Format elapsed build/dev timing for CLI surfaces. */
    elapsed(msec?: t.Msecs): string;
  };

  /**
   * Log the common "dev/build/serve" (and optionally extended) API.
   */
  export namespace API {
    /** API command logging surface. */
    export type Lib = {
      /** Render to console. */
      log(args?: Args): void;
    };

    /** Arguments passed to `Log.API` method. */
    export type Args = {
      cmd?: string;
      minimal?: boolean;
      disabled?: Cmd[];
    };

    /** Commands included in the Help log. */
    export type Cmd = 'dev' | 'build' | 'serve' | 'clean' | 'info';
  }

  /**
   * Log bundled distribution details.
   */
  export namespace Bundle {
    /** Bundle logging surface. */
    export type Lib = {
      /** Render to console. */
      log(args: Args): void;

      /** Produce bundle log string. */
      toString(args: Args): string;
    };

    /** Bundle directories. */
    export type IO = { in: t.StringDir; out: t.StringDir };

    /** Arguments passed to the pkg/bundle logging helper. */
    export type Args = {
      ok: boolean;
      totalSize: t.NumberBytes;
      dirs: IO;
      pkg?: t.Pkg;
      pkgSize?: t.NumberBytes;
      hash?: t.StringHash;
      elapsed?: t.Msecs;
      /** Maximum rendered line width for terminal-safe presentation. */
      width?: number;
      pad?: boolean;
    };
  }

  /**
   * Log pkg/module details.
   */
  export namespace Module {
    /** Package/module logging surface. */
    export type Lib = {
      log(pkg: t.Pkg): void;
      toString(pkg: t.Pkg): string;
    };
  }

  /**
   * Info output.
   */
  export namespace Help {
    /** Help logging surface. */
    export type Lib = {
      log(args: Args): Promise<void>;
    };

    /** Arguments passed to the info log method. */
    export type Args = {
      dirs: Bundle.IO;
      pkg?: t.Pkg;
      api?: API.Args | false;
    };
  }

  /**
   * Log a `/dist` bundle folder.
   */
  export namespace Dist {
    /** Dist logging surface. */
    export type Lib = {
      log(dist: t.DistPkg, options: Options): void;
      toString(dist: t.DistPkg, options: Options): string;
    };

    /** Options passed to the `Log.Dist` method. */
    export type Options = {
      ok?: boolean;
      title?: string;
      elapsed?: t.Msecs;
      dirs?: Partial<Bundle.IO>;
      pad?: boolean;
    };
  }
}
