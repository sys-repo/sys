import type { t } from '../common.ts';

export type * from '../common/t.ts';

/** Injectable effects for deterministic Vite dev lifecycle proof. */
export type ViteDevDeps = {
  waitForHttp?: typeof import('@sys/http/server').Http.Client.waitFor;
};

/** Private terminal output contracts shared within Vite presentation. */
export declare namespace ViteScreen {
  export namespace Output {
    /** One terminal output row with a one-based display sequence. */
    export type Line = {
      readonly sequence: number;
      readonly source: t.Process.StdStream;
      readonly text: string;
    };
  }
}

/**
 * Internal contracts for the parent-owned Vite development lifecycle.
 */
export declare namespace ViteDev {
  /** Retained dev-process output contracts. */
  export namespace Output {
    /** Retained dev-process output factory contract. */
    export type Lib = {
      create(options?: Options): Log;
    };

    /** One retained process-output row. */
    export type Line = ViteScreen.Output.Line;

    /** Output-log retention and visible-line filtering options. */
    export type Options = {
      maxLines?: number;
      maxStderrChars?: number;
      suppressVisible?: RegExp[];
    };

    /** Stateful retained-output contract used throughout one dev-process lifecycle. */
    export type Log = {
      push(event: t.Process.Event): void;
      pushDisplay(source: t.Process.StdStream, text: string): void;
      stderr(): string;
      lines(): Line[];
      tailText(): string;
    };
  }

  /** Parent-owned dev-screen contracts. */
  export namespace Screen {
    /** Narrow output-log capability required by the dev-screen runtime. */
    export type Output = Pick<ViteDev.Output.Log, 'lines'>;

    /** Domain operations accepted by one internal dev-screen reporter session. */
    export type Reporter = {
      readonly outputChanged: () => void;
      readonly ready: () => void;
      readonly dispose: () => void;
    };

    /** Effectful dev-screen runtime contracts. */
    export namespace Runtime {
      /** Active dev-screen reporter phases. */
      export type Phase = 'startup' | 'ready';

      /** Cohesive terminal effects owned by one dev-screen reporter session. */
      export type Terminal = {
        cursorRows: number;
        size(): t.Cli.Screen.Size;
        events(until?: t.UntilInput): t.Cli.Screen.Events;
        repaint(frame: string): void;
        spinner(): t.Cli.Spinner.Instance;
      };

      /** Injectable terminal and scheduling effects for deterministic runtime proof. */
      export type Deps = {
        terminal?: Terminal;
        schedule?: (run: () => void) => t.Cancellable;
      };

      /** Inputs for one internal dev-screen reporter session. */
      export type CreateArgs = {
        pkg: t.Pkg;
        dist?: t.DistPkg;
        paths: t.ViteConfig.Paths;
        url: () => string;
        output: ViteDev.Screen.Output;
        logLines?: number;
        until?: t.UntilInput;
        deps?: Deps;
      };
    }

    /** Pure dev-screen frame contracts. */
    export namespace Frame {
      /** One explicit terminal viewport snapshot. */
      export type Viewport = {
        width: number;
        height: number;
      };

      /** Inputs shared by startup and ready dev-screen layout. */
      export type Args = {
        pkg: t.Pkg;
        dist?: t.DistPkg;
        paths: t.ViteConfig.Paths;
        url: string;
        lines: ViteDev.Output.Line[];
        logLines?: number;
        viewport: Viewport;
        cursorRows: number;
        /** Time snapshot used for deterministic relative build-age rendering. */
        renderedAt: t.UnixTimestamp;
      };

      /** Startup-frame inputs including a deterministic spinner glyph. */
      export type StartupArgs = Args & { spinner?: string };

      /** Regions produced by one complete startup-layout calculation. */
      export type StartupOutput = {
        readonly header: string;
        readonly body: string;
        readonly showSpinner: boolean;
      };
    }
  }
}
