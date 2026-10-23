import type { CliffyTable } from '../t.ext.ts';

/**
 * Tools for working with CLI tables.
 */
export declare namespace CliTable {
  /** CLI table helper library contract. */
  export type Lib = {
    /** Visible gap inserted between table cells by the default table formatter. */
    readonly cellGap: number;
    readonly create: Create;
    readonly pairs: Pairs;
  };

  /** Table instance that can be rendered to the console. */
  export type Instance = CliffyTable;

  /** Create a new Table generator instance. */
  export type Create = (...items: string[][]) => Instance;

  /**
   * Render already-fitted label/value pairs with LF-delimited continuation lines.
   * Pad labels to at least `valueColumn` terminal cells; never pad or clip values.
   * ANSI styling and OSC 8 links are preserved within each line. No surrounding newlines are added.
   *
   * Callers must supply self-contained LF-delimited lines in both cells: control sequences must be
   * complete, and any styles or hyperlinks opened on a line must close on that line. LF inside a
   * control sequence and control scopes spanning lines are unsupported. This renderer does not
   * validate or rebalance controls.
   */
  export type Pairs = (rows: readonly Pair[], valueColumn: number) => string;

  /** One label/value pair. */
  export type Pair = readonly [label: string, value: string];
}
