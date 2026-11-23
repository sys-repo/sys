import type { t } from './common.ts';

/**
 * Indeterminate activity indicators.
 */
export declare namespace Spinners {
  /** Renderers available on the Spinners family. */
  export type Lib = {
    readonly Bar: t.BarSpinner.Lib['UI'];
    readonly Circular: t.CircularSpinner.Lib['UI'];
  };
}
