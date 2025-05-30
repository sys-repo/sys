import type { t } from './common.ts';

/**
 * Tools for modifying template files once written to the file-system.
 */
export type TmplFileLib = {
  /**
   * Update one or many template files in-place.
   */
  update<P extends t.StringPath | t.StringPath[]>(
    path: P,
    modify?: t.TmplLineUpdate,
  ): Promise<P extends t.StringPath[] ? TmplFileUpdateResponse[] : TmplFileUpdateResponse>;
};

/** Response from the `Tmpl.File.update` method. */
export type TmplFileUpdateResponse = {
  readonly changed: boolean;
  readonly changes: TmplFileChange[];
  readonly before: string;
  readonly after: string;
  readonly error?: t.StdError;
};

/** Represents a single change in an updated file. */
export type TmplFileChange = {
  readonly line: { readonly index: t.Index };
  readonly before: string;
  readonly after: string;
  readonly op: 'insert' | 'modify';
};

/**
 * Handler for updating a single line within a text file.
 */
export type TmplLineUpdate = (e: TmplLineUpdateArgs) => t.IgnoredResult;
export type TmplLineUpdateArgs = {
  /** Metadata about the file the line is within. */
  readonly file: {
    /** Path of the file the line exists within. */
    readonly path: t.StringPath;
    /** The complete set of lines. */
    readonly lines: readonly string[];
  };

  /** The text of the line. */
  readonly text: string;
  /** The index number of the line within the file. */
  readonly index: t.Index;
  /** Informational flags. */
  readonly is: { readonly first: boolean; readonly last: boolean };
  /** Modify the line with the given text. */
  modify(line: string): void;
  /** Insert a line relative (before) to the current one. */
  insert(text: string, position?: 'before' | 'after'): void;
};
