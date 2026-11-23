import type { t } from './common.ts';

/**
 * UI load spinners.
 */
export type SpinnerLib = {
  readonly Bar: t.BarSpinner.Lib['UI'];
  readonly Circular: t.CircularSpinner.Lib['UI'];
};
