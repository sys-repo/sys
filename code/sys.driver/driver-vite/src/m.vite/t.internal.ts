import type { t } from '../common.ts';

export type * from '../common/t.ts';

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
    export type Line = {
      readonly index: number;
      readonly source: t.Process.StdStream;
      readonly text: string;
    };

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
      clearLines(): void;
      tailText(): string;
    };
  }

  /** Parent-owned dev-screen contracts. */
  export namespace Screen {
    /** Narrow output-log capability required by the dev-screen runtime. */
    export type Output = Pick<ViteDev.Output.Log, 'lines' | 'clearLines'>;

    /** Domain operations accepted by one internal dev-screen reporter session. */
    export type Reporter = {
      outputChanged(): void;
      ready(): void;
      clearLog(): void;
      toggleOptions(): void;
      toggleExtended(ws: t.ViteDenoWorkspace): void;
      dispose(): void;
    };

    /** Effectful dev-screen runtime contracts. */
    export namespace Runtime {
      /** Dev-screen phases that can produce terminal output. */
      export type RenderPhase = 'startup' | 'ready';

      /** Injectable terminal and scheduling effects for deterministic runtime proof. */
      export type Deps = {
        clear?: () => void;
        print?: (phase: RenderPhase, text: string) => void;
        spinner?: () => t.Cli.Spinner.Instance;
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
        deps?: Deps;
      };
    }

    /** Pure dev-screen frame contracts. */
    export namespace Frame {
      /** Inputs shared by startup and ready dev-screen layout. */
      export type Args = {
        pkg: t.Pkg;
        dist?: t.DistPkg;
        paths: t.ViteConfig.Paths;
        url: string;
        lines: ViteDev.Output.Line[];
        logLines?: number;
        width?: number;
        height?: number;
      };

      /** Ready-frame inputs including optional presentation detail. */
      export type ReadyArgs = Args & {
        showOptions?: boolean;
        ws?: t.ViteDenoWorkspace;
      };

      /** Startup-frame inputs including a deterministic spinner glyph. */
      export type StartupArgs = Args & { spinner?: string };
    }
  }
}
