import type { t } from './common.ts';

/**
 * Tools for modifying template files once written to the file-system.
 */
export type TmplFileLib = {
  update(path: t.StringPath, modifier?: t.TmplFileUpdate): Promise<TmplFileUpdateResponse>;
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
};

/**
 * Handler for updating lines within a text file.
 */
export type TmplFileUpdate = (e: TmplFileUpdateArgs) => t.IgnoredResult;
export type TmplFileUpdateArgs = {
  /** Informational flags. */
  readonly is: { readonly first: boolean; readonly last: boolean };
  /** The current line being evaluated. */
  readonly line: { readonly text: string; readonly index: t.Index };
  /** The complete set of lines. */
  readonly lines: readonly string[];
  /** Modify the line with the given text. */
  modify(line: string): void;
};
