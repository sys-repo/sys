/**
 * Navigable help chapter formatter types.
 */
export declare namespace CliFormatChapters {
  /** Navigable chapter formatting and tree utility library. */
  export type Lib = {
    /** Render chapter sections and child chapter index rows for terminal help. */
    format(input: FormatInput): string;

    /** Render chapter sections and child chapter links as Markdown. */
    markdown(input: MarkdownInput): string;

    /** Return all chapter resource files in recursive order. */
    files<TFile extends string>(chapter: Chapter.Resource<TFile>): readonly TFile[];

    /** Resolve a child chapter resource by path. */
    resolve<TFile extends string>(
      root: Chapter.Resource<TFile>,
      path: readonly string[],
    ): Chapter.Resource<TFile> | undefined;
  };

  /** Terminal chapter guide rendering input. */
  export type FormatInput = {
    /** Base command prefix used to open child chapters. */
    readonly command: string;
    /** Chapter to render. */
    readonly chapter: Chapter;
    /** Label for the child chapter index. Defaults to `Chapter`. */
    readonly label?: string;
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
