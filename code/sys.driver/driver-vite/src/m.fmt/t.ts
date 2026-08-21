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

    /** Log common `deno task` command help. */
    readonly Tasks: Tasks.Lib;

    /** Command output. */
    readonly Help: Help.Lib;

    /** Helper for padding an output string. */
    pad(text: string, pad?: boolean): string;

    /** Format a Dist digest. */
    digest(hash?: t.StringHash, options?: Digest.Options): string;

    /** Format elapsed build/dev timing for CLI surfaces. */
    elapsed(msec?: t.Msecs): string;
  };

  /**
   * Log common `deno task` command help.
   */
  export namespace Tasks {
    /** Task command logging surface. */
    export type Lib = {
      /** Render to console. */
      log(args?: Args): void;

      /** Produce command-help text. */
      toString(args?: Args): string;
    };

    /** Arguments passed to `ViteLog.Tasks` methods. */
    export type Args = {
      cmd?: string;
      minimal?: boolean;
      disabled?: Cmd[];
      /** Maximum rendered line width for terminal-safe presentation. */
      width?: number;
    };

    /** Commands included in the Help log. */
    export type Cmd = 'dev' | 'build' | 'serve' | 'clean' | 'info';
  }

  /**
   * Dist digest presentation.
   */
  export namespace Digest {
    /** Optional digest presentation settings. */
    export type Options = {
      /** Maximum width of the complete arrow-and-digest value. */
      maxWidth?: number;
    };
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
      /** Manifest file to navigate from successful bundle output. */
      manifestUrl?: URL;
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
      tasks?: Tasks.Args | false;
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
      /** Maximum rendered line width for terminal-safe presentation. */
      width?: number;
      pad?: boolean;
    };
  }
}
