import type { t } from './common.ts';

/**
 * Workspace help resource types.
 */
export declare namespace WorkspaceHelp {
  /** Runtime surface for bundled Workspace help resources. */
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

  /** Workspace DSL guidance resources. */
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
