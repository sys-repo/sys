import type { t } from './common.ts';

/**
 * Driver-Pi help resource types.
 */
export declare namespace PiHelp {
  /** Runtime surface for bundled Driver-Pi help resources. */
  export type Lib = {
    /** Driver-Pi DSL guidance resources. */
    readonly Dsl: Dsl.Lib;
  };

  /**
   * Driver-Pi DSL guidance resources.
   */
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
