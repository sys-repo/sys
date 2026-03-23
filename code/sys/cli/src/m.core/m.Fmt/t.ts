import type { t } from '../common.ts';

/**
 * Common formatting helpers when working with a CLI.
 */
export type CliFormatLib = {
  /** Path display formatting. */
  path: t.PathFormatLib['string'];

  /** Common CLI pretty path formatting */
  readonly Path: {
    str: (path: string) => string;
    fmt: (opts?: {}) => t.PathFormatter;
  };

  /** Glyphs for representing a tree hierarchy */
  readonly Tree: {
    readonly vert: '│';
    readonly mid: '├';
    readonly last: '└';
    readonly bar: '─';
    branch(isLastOrTuple: boolean | [t.Index, t.Ary<unknown>], extend?: number): string;
  };
};
