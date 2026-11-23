import type { t } from './common.ts';

/**
 * Circular activity indicator contracts.
 */
export declare namespace CircularSpinner {
  /** Module surface for the circular indicator. */
  export type Lib = { readonly UI: t.FC<Props> };

  /** Render options for the circular indicator. */
  export type Props = {
    debug?: boolean;
    /** Use the theme foreground. Omit to inherit the host's text color. */
    theme?: t.CommonTheme;
    /** Root style overrides, applied last. */
    style?: t.Style.Input;
  };
}
