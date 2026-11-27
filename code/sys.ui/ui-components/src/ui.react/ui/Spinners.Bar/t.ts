import type { t } from './common.ts';

/**
 * Clipped bar for indeterminate activity.
 */
export declare namespace BarSpinner {
  /** Module surface for the bar indicator. */
  export type Lib = { readonly UI: t.FC<Props> };

  /** Render options for the bar indicator. */
  export type Props = {
    /** Track width in CSS pixels. Defaults to 80. */
    width?: number;
    /** Track height in CSS pixels. Defaults to 4. */
    height?: number;
    /** Hide the tinted track background without hiding the marks. Defaults to false. */
    transparentTrack?: boolean;
    /** Use the theme foreground for the marks and the track tint. Omit to use the default theme. */
    theme?: t.CommonTheme;
    /** Root style overrides, applied last. */
    style?: t.Style.Input;
  };
}
