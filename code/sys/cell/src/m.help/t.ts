import type { CliFormatChapters } from '@sys/cli/t';
import type { t } from './common.ts';

/**
 * Cell help resource types.
 */
export declare namespace CellHelp {
  /** Library surface for bundled Cell help resources. */
  export type Lib = {
    readonly Root: Root.Lib;
    readonly Info: Info.Lib;
    readonly Init: Init.Lib;
    readonly Migrate: Migrate.Lib;
    readonly Task: Task.Lib;
    readonly Start: Start.Lib;
    readonly Kill: Kill.Lib;
    readonly Dsl: Dsl.Lib;
  };

  /** Help command name/description pair. */
  export type Pair = readonly [string, string];

  /** Authored help section with display label and ordered items. */
  export type Section = CliFormatChapters.Section;

  /**
   * Root CLI help resources.
   */
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

  /**
   * Info command help resources.
   */
  export namespace Info {
    /** Loader for authored info help. */
    export type Lib = {
      /** Load authored info help from the embedded bundle. */
      load(): Promise<Guidance>;
    };

    /** Authored info help used by CLI composition. */
    export type Guidance = {
      readonly summary: string;
      readonly usage: readonly string[];
      readonly options: readonly Pair[];
      readonly reads: readonly string[];
    };
  }

  /**
   * Init command help resources.
   */
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

  /**
   * Migrate command help resources.
   */
  export namespace Migrate {
    /** Loader for authored migrate help. */
    export type Lib = {
      /** Load authored migrate help from the embedded bundle. */
      load(): Promise<Guidance>;
    };

    /** Authored migrate help used by CLI composition. */
    export type Guidance = {
      readonly summary: string;
      readonly usage: readonly string[];
      readonly options: readonly Pair[];
      readonly safety: readonly string[];
    };
  }

  /**
   * Task command help resources.
   */
  export namespace Task {
    /** Loader for authored task help. */
    export type Lib = {
      /** Load authored task help from the embedded bundle. */
      load(): Promise<Guidance>;
    };

    /** Authored task help used by CLI composition. */
    export type Guidance = {
      readonly summary: string;
      readonly usage: readonly string[];
      readonly options: readonly Pair[];
      readonly task: readonly string[];
    };
  }

  /**
   * Start command help resources.
   */
  export namespace Start {
    /** Loader for authored start help. */
    export type Lib = {
      /** Load authored start help from the embedded bundle. */
      load(): Promise<Guidance>;
    };

    /** Authored start help used by CLI composition. */
    export type Guidance = {
      readonly summary: string;
      readonly usage: readonly string[];
      readonly options: readonly Pair[];
      readonly services: readonly string[];
    };
  }

  /**
   * Kill command help resources.
   */
  export namespace Kill {
    /** Loader for authored kill help. */
    export type Lib = {
      /** Load authored kill help from the embedded bundle. */
      load(): Promise<Guidance>;
    };

    /** Authored kill help used by CLI composition. */
    export type Guidance = {
      readonly summary: string;
      readonly usage: readonly string[];
      readonly options: readonly Pair[];
      readonly safety: readonly string[];
    };
  }

  /**
   * Cell DSL guidance resources.
   */
  export namespace Dsl {
    /** Loader for authored DSL guidance. */
    export type Lib = {
      /** Load an authored DSL chapter from the embedded bundle. */
      load(path?: readonly string[]): Promise<Chapter>;
    };

    /** Navigable DSL chapter used by CLI composition. */
    export type Chapter = CliFormatChapters.Chapter;

    /** Child chapter shown as a drill-down link. */
    export type ChapterLink = CliFormatChapters.Chapter.Link;

    /** Authored DSL chapter resource registered for recursive lookup. */
    export type ChapterResource = CliFormatChapters.Chapter.Resource<t.StringPath>;
  }
}
