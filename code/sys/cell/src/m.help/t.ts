import type { t } from './common.ts';

/**
 * Cell help resource types.
 */
export declare namespace CellHelp {
  /** Runtime surface for bundled Cell help resources. */
  export type Lib = {
    readonly Root: Root.Lib;
    readonly Init: Init.Lib;
    readonly Dsl: Dsl.Lib;
  };

  /** Help command name/description pair. */
  export type Pair = readonly [string, string];

  /** Authored help section with display label and ordered items. */
  export type Section = {
    readonly label: string;
    readonly items: readonly string[];
  };

  /** Root CLI help resources. */
  export namespace Root {
    /** Loader for authored root help. */
    export type Lib = {
      /** Load authored root help from the embedded bundle. */
      load(): Promise<Guidance>;
    };

    /** Authored root help used by CLI composition. */
    export type Guidance = {
      readonly summary: string;
      readonly usage: readonly string[];
      readonly commands: readonly Pair[];
      readonly options: readonly Pair[];
    };
  }

  /** Init command help resources. */
  export namespace Init {
    /** Loader for authored init help. */
    export type Lib = {
      /** Load authored init help from the embedded bundle. */
      load(): Promise<Guidance>;
    };

    /** Authored init help used by CLI composition. */
    export type Guidance = {
      readonly summary: string;
      readonly usage: readonly string[];
      readonly options: readonly Pair[];
      readonly safety: readonly string[];
      readonly agent: readonly string[];
    };
  }

  /** Cell DSL guidance resources. */
  export namespace Dsl {
    /** Loader for authored DSL guidance. */
    export type Lib = {
      /** Load an authored DSL chapter from the embedded bundle. */
      load(path?: readonly string[]): Promise<Chapter>;
    };

    /** Navigable DSL chapter used by CLI composition. */
    export type Chapter = {
      readonly id: string;
      readonly path: readonly string[];
      readonly title: string;
      readonly summary: string;
      readonly sections: readonly Section[];
      readonly chapters: readonly ChapterLink[];
    };

    /** Child chapter shown as a drill-down link. */
    export type ChapterLink = {
      readonly id: string;
      readonly path: readonly string[];
      readonly title: string;
      readonly summary: string;
    };

    /** Authored DSL chapter resource registered for recursive lookup. */
    export type ChapterResource = {
      readonly id: string;
      readonly file: t.StringPath;
      readonly children: readonly ChapterResource[];
    };
  }
}
