import type { t } from './common.ts';

/**
 * Deterministic string-in/string-out text update primitives.
 */
export declare namespace TextUpdate {
  /** Public library surface. */
  export type Lib = {
    readonly lines: Lines;
  };

  /** Update text by traversing and mutating it line-by-line. */
  export type Lines = (text: string, modify?: LineModify) => LinesResult;

  /** Result of a line-based text update. */
  export type LinesResult = {
    readonly changed: boolean;
    readonly before: string;
    readonly after: string;
    readonly changes: readonly Change[];
  };

  /** A single line-level text change. */
  export type Change = {
    readonly op: 'insert' | 'modify' | 'delete';
    readonly line: LineRef;
    readonly before: string;
    readonly after: string;
  };

  /** Reference to a line within the traversal. */
  export type LineRef = {
    readonly index: t.Index;
  };

  /** Line-update callback. */
  export type LineModify = (line: Line) => void;

  /** Mutable operations exposed while visiting a line. */
  export type Line = {
    readonly text: string;
    readonly index: t.Index;
    readonly is: { readonly first: boolean; readonly last: boolean };
    readonly lines: readonly string[];

    /** Replace the current line text. */
    modify(text: string): void;
    /** Insert a line before or after the current line. */
    insert(text: string, position?: 'before' | 'after'): void;
    /** Delete the current line. */
    delete(): void;
  };
}
