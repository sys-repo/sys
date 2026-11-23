import type { t } from './common.ts';

/**
 * Circular activity indicator contracts.
 */
export declare namespace CircularSpinner {
  /** Module surface for the circular indicator. */
  export type Lib = { readonly UI: t.FC<Props> };

  /** Render options for the circular indicator. */
  export type Props = {
    /** Side length in CSS pixels. Defaults to 22. At 12 or below, uses eight spokes instead of twelve. */
    size?: number;
    /** Use the theme foreground. Omit to inherit the host's text color. */
    theme?: t.CommonTheme;
    /** Root style overrides, applied last. */
    style?: t.Style.Input;
  };
}
