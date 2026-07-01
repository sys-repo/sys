import type { t } from './common.ts';

/**
 * Package help resource types.
 */
export declare namespace Help {
  /** Runtime surface for bundled package help resources. */
  export type Lib = {
    readonly Root: Root.Lib;
    readonly Dsl: Dsl.Lib;
  };

  /** Authored help section with display label and ordered items. */
  export type Section = t.Cli.Fmt.Chapters.Section;

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

  /** Tools DSL guidance resources. */
  export namespace Dsl {
    /** Loader for authored DSL guidance. */
    export type Lib = {
      /** Load an authored DSL chapter from the embedded bundle. */
      load(path?: readonly string[]): Promise<Chapter>;
    };

    /** Navigable DSL chapter used by CLI composition. */
    export type Chapter = t.Cli.Fmt.Chapters.Chapter;

    /** Authored DSL chapter resource registered for recursive lookup. */
    export type ChapterResource = t.Cli.Fmt.Chapters.Chapter.Resource<t.StringPath>;
  }
}
