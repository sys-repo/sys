import type { CliffyTable } from '../t.ext.ts';

/**
 * Tools for working with CLI tables.
 */
export declare namespace CliTable {
  /** CLI table helper library contract. */
  export type Lib = {
    /** Visible gap inserted between table cells by the default table formatter. */
    readonly cellGap: number;
    /** Create a new Table generator instance. */
    create(...items: string[][]): Instance;
  };

  /** Table instance that can be rendered to the console. */
  export type Instance = CliffyTable;
}
