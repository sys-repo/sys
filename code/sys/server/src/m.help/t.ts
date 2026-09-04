import type { t } from './common.ts';

/**
 * Server package help resource types.
 */
export declare namespace ServerHelp {
  /** Runtime surface for bundled server help resources. */
  export type Lib = {
    readonly Root: Root.Lib;
    readonly Dsl: Dsl.Lib;
  };

  /** Help command name/description pair. */
  export type Pair = readonly [string, string];

  /** Authored help section with display label and ordered items. */
  export type Section = t.Cli.Fmt.Chapters.Section;

  /** Root package help resources. */
  export namespace Root {
    /** Loader for authored root help. */
    export type Lib = {
      /** Load authored root help from the embedded bundle. */
      load(): Promise<Guidance>;
    };

    /** Authored root help used by package-owned formatters. */
    export type Guidance = {
      readonly summary: string;
      readonly usage: readonly string[];
      readonly commands: readonly Pair[];
      readonly options: readonly Pair[];
    };
  }

  /** Server DSL guidance resources. */
  export namespace Dsl {
    /** Loader for authored DSL guidance. */
    export type Lib = {
      /** Load an authored DSL chapter from the embedded bundle. */
      load(path?: readonly string[]): Promise<Chapter>;
    };

    /** Navigable DSL chapter used by CLI composition. */
    export type Chapter = t.Cli.Fmt.Chapters.Chapter;

    /** Child chapter shown as a drill-down link. */
    export type ChapterLink = t.Cli.Fmt.Chapters.Chapter.Link;

    /** Authored DSL chapter resource registered for recursive lookup. */
    export type ChapterResource = t.Cli.Fmt.Chapters.Chapter.Resource<t.StringPath>;
  }
}
