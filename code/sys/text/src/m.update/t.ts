import type { t } from './common.ts';

/**
 * Deterministic string-in/string-out text update primitives.
 */
export declare namespace TextUpdate {
  /** Public library surface. */
  export type Lib = {
    readonly newlineOf: NewlineOf;
    readonly lineSpans: Line.Spans;
    readonly insert: Insert;
    readonly replace: Replace;
    readonly delete: Delete;
    readonly apply: Apply;
    readonly lines: Lines;
  };

  /** UTF-16 string offset suitable for `text.slice(offset)`. */
  export type StringOffset = number;

  /** String-offset range suitable for `text.slice(start, end)`. */
  export type Range = { readonly start: StringOffset; readonly end: StringOffset };

  /** Exact range edit. */
  export type Edit = {
    readonly range: Range;
    readonly text: string;
    readonly label?: string;
  };

  /** Applied change. */
  export type Change = {
    readonly op: 'insert' | 'replace' | 'delete';
    readonly range: Range;
    readonly before: string;
    readonly after: string;
    readonly label?: string;
  };

  /** Expected validation error from an invalid edit plan. */
  export type UpdateError = {
    readonly reason: UpdateErrorReason;
    readonly message: string;
    readonly edit?: Edit;
  };

  /** Known validation failure reasons. */
  export type UpdateErrorReason =
    | 'invalid-range'
    | 'overlapping-edits'
    | 'split-surrogate-pair'
    | 'invalid-line-text';

  /** Result of applying a deterministic text update. */
  export type Result =
    | {
      readonly ok: true;
      readonly changed: boolean;
      readonly before: string;
      readonly after: string;
      readonly changes: readonly Change[];
    }
    | {
      readonly ok: false;
      readonly changed: false;
      readonly before: string;
      readonly after: string;
      readonly changes: readonly [];
      readonly error: UpdateError;
    };

  /** Return the first detected newline style, defaulting to LF. */
  export type NewlineOf = (text: string) => Line.Newline;

  /** Build a zero-width insertion edit. */
  export type Insert = (at: StringOffset, text: string, label?: string) => Edit;

  /** Build a replacement edit. */
  export type Replace = (range: Range, text: string, label?: string) => Edit;

  /** Build a deletion edit. */
  export type Delete = (range: Range, label?: string) => Edit;

  /** Apply exact range edits to text. */
  export type Apply = (text: string, edits?: readonly Edit[]) => Result;

  /** Update text by visiting each original physical line once. */
  export type Lines = (text: string, visit?: Line.Visit, options?: Line.Options) => Result;

  /** Line-scanning and line-editing types. */
  export namespace Line {
    /** Physical line ending token. */
    export type Newline = '\n' | '\r\n';

    /** Physical line ending token on a specific scanned line. */
    export type Ending = Newline | '';

    /** A physical line span in the source text. */
    export type Span = {
      /** Zero-based physical line index. */
      readonly index: t.Index;
      /** Line text without line ending. */
      readonly text: string;
      /** Full line text including line ending when present. */
      readonly raw: string;
      /** Full line range including line ending when present. */
      readonly range: Range;
      /** Text-only range excluding line ending. */
      readonly textRange: Range;
      /** Physical line ending, or empty string for the final unterminated line. */
      readonly newline: Ending;
    };

    /** Return physical line spans without inventing a synthetic final line. */
    export type Spans = (text: string) => readonly Span[];

    /** Line update options. */
    export type Options = {
      readonly newline?: 'preserve' | Newline;
      readonly eof?: 'preserve' | 'ensure' | 'strip';
    };

    /** Line-update callback. */
    export type Visit = (line: Context) => EditResult | readonly EditResult[] | undefined | void;

    /** Line edit returned from ergonomic line helpers. */
    export type EditResult = Edit | InvalidEdit;

    /** Invalid line edit sentinel used to fail safely without throwing. */
    export type InvalidEdit = {
      readonly error: UpdateError;
    };

    /** Immutable operations exposed while visiting one physical source line. */
    export type Context = Span & {
      readonly is: { readonly first: boolean; readonly last: boolean };
      readonly lines: readonly string[];

      /** Replace the current line text without changing its line ending. */
      replace(text: string): EditResult;
      /** Delete the current physical line. */
      delete(): EditResult;
      /** Insert logical lines before the current physical line. */
      insertBefore(...lines: string[]): EditResult;
      /** Insert logical lines after the current physical line. */
      insertAfter(...lines: string[]): EditResult;
    };
  }
}
