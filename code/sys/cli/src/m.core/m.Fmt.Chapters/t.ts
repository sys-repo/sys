import type { t } from '../common.ts';
import type { CliFormatHelpInput } from '../m.Fmt/t.help.ts';

/**
 * Navigable help chapter formatter types.
 */
export declare namespace CliFormatChapters {
  /** Navigable chapter formatting and tree utility library. */
  export type Lib = {
    /** Render chapter sections and child chapter index rows for terminal help. */
    format(input: FormatInput): string;

    /** Render a complete terminal help page with front matter and chapter content. */
    page(input: PageInput): string;

    /** Render chapter sections and child chapter links as Markdown. */
    markdown(input: MarkdownInput): string;

    /** Return all chapter resource files in recursive order. */
    files<TFile extends string>(chapter: Chapter.Resource<TFile>): readonly TFile[];

    /** Resolve a child chapter resource by path. */
    resolve<TFile extends string>(
      root: Chapter.Resource<TFile>,
      path: readonly string[],
    ): Chapter.Resource<TFile> | undefined;

    /** Create loaders for authored chapter-book resources. */
    readonly Book: Book.Lib;

    /** Create readers for embedded help/chapter resource bundles. */
    readonly Resources: Resources.Lib;
  };

  /** Terminal chapter guide rendering input. */
  export type FormatInput = {
    /** Base command prefix used to open child chapters. */
    readonly command: string;
    /** Chapter to render. */
    readonly chapter: Chapter;
    /** Label for the child chapter index. Defaults to `Chapter`. */
    readonly label?: string;
    /** Optional terminal layout constraints. */
    readonly layout?: LayoutOptions;
  };

  /** Terminal chapter layout options. */
  export type LayoutOptions = {
    /** Explicit physical page width. */
    readonly width?: number;
    /** Maximum readable page width. */
    readonly maxWidth?: number;
    /** Minimum body width before falling back to stacked labels. */
    readonly minBodyWidth?: number;
    /** Deterministic width used when terminal width is unavailable. */
    readonly fallbackWidth?: number;
    /** Standard stream used to detect terminal output. Defaults to `stdout`. */
    readonly stream?: t.StdioName;
    /** Terminal detection override for deterministic tests. */
    readonly terminal?: boolean;
  };

  /** Complete terminal chapter help page rendering input. */
  export type PageInput = FormatInput & {
    /** Help front matter rendered before the chapter body. */
    readonly help: CliFormatHelpInput;
    /** Render a gray horizontal separator between help and chapter body. Defaults to true. */
    readonly separator?: boolean;
  };

  /** Markdown chapter rendering input. */
  export type MarkdownInput = {
    /** Base command prefix used to open child chapters. */
    readonly command: string;
    /** Optional suffix appended after each child chapter path. */
    readonly commandSuffix?: string;
    /** Chapter to render. */
    readonly chapter: Chapter;
    /** Label for the child chapter index heading. Defaults to `Chapters`. */
    readonly label?: string;
    /** Optional YAML frontmatter fields emitted before the Markdown body. */
    readonly frontmatter?: Frontmatter;
  };

  /** YAML frontmatter fields for Markdown chapter output. */
  export type Frontmatter = {
    readonly [key: string]: string;
  };

  /** Reusable chapter-book loader for authored chapter resources. */
  export type Book<TFile extends string = string> = {
    /** Root chapter resource for this book. */
    readonly root: Chapter.Resource<TFile>;
    /** Return all chapter resource files in recursive order. */
    files(): readonly TFile[];
    /** Resolve a child chapter resource by path. */
    resolve(path?: readonly string[]): Chapter.Resource<TFile> | undefined;
    /** Load a chapter by path. */
    load(path?: readonly string[]): Promise<Chapter>;
  };

  export namespace Book {
    /** Chapter-book loader factory surface. */
    export type Lib = {
      /** Create a reusable chapter-book loader from a resource tree and record reader. */
      create<TFile extends string>(input: Input<TFile>): Book<TFile>;
    };

    /** Input used to create a chapter-book loader. */
    export type Input<TFile extends string = string> = {
      /** Root chapter resource. */
      readonly root: Chapter.Resource<TFile>;
      /** Read a parsed record for a resource file. */
      readonly read: Reader<TFile>;
      /** Error prefix used for diagnostics. Defaults to `ChapterBook`. */
      readonly label?: string;
      /** Human noun used for missing-resource diagnostics. Defaults to `chapter`. */
      readonly noun?: string;
      /** Human record kind used for non-record diagnostics. Defaults to `record`. */
      readonly recordKind?: string;
    };

    /** Resource record reader. */
    export type Reader<TFile extends string = string> = (file: TFile) => unknown | Promise<unknown>;
  }

  /** Embedded help/chapter resource bundle reader. */
  export type Resources<TFile extends string = string> = {
    /** Read a bundled resource as text. */
    readText(file: TFile): string;
    /** Read and parse a bundled resource. */
    readParsedRecord(file: TFile): unknown;
    /** Read a parsed record and require fields. */
    readRecord(file: TFile, fields: readonly string[]): Record<string, unknown>;
  };

  export namespace Resources {
    /** Embedded resource reader factory surface. */
    export type Lib = {
      /** Create a reusable reader for bundled text records. */
      create<TFile extends string>(input: Input<TFile>): Resources<TFile>;
    };

    /** Input used to create an embedded resource reader. */
    export type Input<TFile extends string = string> = {
      /** Bundle map from resource path to data URI. */
      readonly json: Record<string, string>;
      /** Error prefix used for diagnostics. Defaults to `ChapterResources`. */
      readonly label?: string;
      /** Parse text into the caller-owned record shape. */
      readonly parse: Parser<TFile>;
    };

    /** Parse a text resource into a caller-owned record shape. */
    export type Parser<TFile extends string = string> = (text: string, file: TFile) => unknown;
  }

  /** Navigable help chapter rendered by a CLI help surface. */
  export type Chapter = {
    readonly id: string;
    readonly path: readonly string[];
    readonly title: string;
    readonly summary: string;
    readonly sections: readonly Section[];
    readonly chapters: readonly Chapter.Link[];
  };

  export namespace Chapter {
    /** Child chapter shown as a drill-down command link. */
    export type Link = {
      readonly id: string;
      readonly path: readonly string[];
      readonly title: string;
      readonly summary: string;
    };

    /** Authored chapter resource registered for recursive lookup. */
    export type Resource<TFile extends string = string> = {
      readonly id: string;
      readonly file: TFile;
      readonly children: readonly Resource<TFile>[];
    };
  }

  /** Authored help section with display label and ordered items. */
  export type Section = {
    readonly label: string;
    readonly items: readonly string[];
  };
}
