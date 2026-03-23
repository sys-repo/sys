import type { OraSpinner } from '../t.ext.ts';

/**
 * Tools for working with a CLI spinner.
 */
export type CliSpinnerLib = {
  /** Create (and start) a new spinner instance. */
  create(text?: string, options?: { start?: boolean; silent?: boolean }): OraSpinner;
};
