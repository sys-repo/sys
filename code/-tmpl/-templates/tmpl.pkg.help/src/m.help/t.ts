import type { Cli } from '@sys/cli/t';

/**
 * Package help resource types.
 */
export declare namespace Help {
  /** Runtime surface for bundled package help resources. */
  export type Lib = {
    readonly Root: Root.Lib;
  };

  /** Authored help section with display label and ordered items. */
  export type Section = Cli.Fmt.Chapters.Section;

  /** Root help resources. */
  export namespace Root {
    /** Loader for authored root help. */
    export type Lib = {
      /** Load authored root help from the embedded bundle. */
      load(): Promise<Guidance>;
    };

    /** Authored root help used by package-owned formatters or CLIs. */
    export type Guidance = {
      readonly summary: string;
      readonly sections: readonly Section[];
    };
  }
}
