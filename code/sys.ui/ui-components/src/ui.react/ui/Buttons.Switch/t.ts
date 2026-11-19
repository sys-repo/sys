import type { t } from './common.ts';

type Color = string | number;

/**
 * Animated on/off switch primitive.
 */
export declare namespace Switch {
  export type Lib = { readonly UI: t.FC<Props> };

  /** Component props. */
  export type Props = {
    debug?: boolean;
    id?: string;
    value?: boolean;
    width?: t.Pixels;
    height?: t.Pixels;
    enabled?: boolean;
    tooltip?: string;
    'aria-label'?: string;
    'aria-labelledby'?: string;

    /** Appearance: */
    track?: Partial<Theme.Track>;
    thumb?: Partial<Theme.Thumb>;
    theme?: t.CommonTheme | Partial<Theme.Root>;
    /** Track/thumb transition duration, independent of the shared focus-arrival timing. */
    transitionSpeed?: t.Msecs;
    /**
     * Root styles. Native :focus-visible shows an opaque theme-derived 3px halo,
     * holds for 70ms, then settles over 220ms with ease-out.
     * Rest uses trackColor.on at 28% alpha for strings, or its signed gray-alpha for numbers.
     * Arrival uses the same RGB colour at full opacity. Choose colours for the actual surface;
     * the existing resting halo is not a contrast guarantee, and numeric zero rests transparent.
     *
     * Reduced motion uses settled paint immediately. Forced colours replaces the halo with
     * a static 3px Highlight outline at zero offset; normal UA colour adjustment remains enabled.
     * Explicit root animation settings, including longhands, keep default focus static.
     * A supplied :focus-visible block (including an explicit clear) replaces the whole policy;
     * the caller then owns visible indication and motion/preference handling.
     */
    style?: t.CssValue;

    /** Events: */
    onToggle?: Toggle.Handler;
    onClick?: React.MouseEventHandler;
    onMouseDown?: React.MouseEventHandler;
    onMouseUp?: React.MouseEventHandler;
    onMouseEnter?: React.MouseEventHandler;
    onMouseLeave?: React.MouseEventHandler;
  };

  /** Semantic switch toggle intent. */
  export namespace Toggle {
    /** Handler for semantic switch toggle intent. */
    export type Handler = (e: Args) => void;

    /** Toggle payload carrying the current and next switch values. */
    export type Args = {
      readonly current: boolean;
      readonly next: boolean;
      readonly synthetic: t.ReactMouseEvent;
    };
  }

  /** Switch theme details. */
  export namespace Theme {
    /** Tools for working with switch themes. */
    export type Lib = {
      merge(base: Root, theme: Partial<Root>): Root;
      fromName(theme: t.CommonTheme): Colors;
      toShadowCss(shadow: t.CssShadow): string | undefined;
      readonly light: Colors;
      readonly dark: Colors;
    };

    /** Named switch theme palettes. */
    export type Colors = {
      default: Root;
      blue: Root;
      green: Root;
      yellow: Root;
    };

    /** Root theme. */
    export type Root = {
      trackColor: { on: Color; off: Color; disabled: Color };
      thumbColor: { on: Color; off: Color; disabled: Color };
      shadowColor: Color;
      disabledOpacity: t.Percent;
    };

    /** Track theme. */
    export type Track = {
      widthOffset: number;
      heightOffset: number;
      color: { on: Color; off: Color; disabled: Color };
      borderRadius: number;
      borderWidth: { on?: number; off?: number };
    };

    /** Thumb theme. */
    export type Thumb = {
      width: number;
      height: number;
      xOffset: number;
      yOffset: number;
      borderRadius: number;
      color: { on: Color; off: Color; disabled: Color };
      shadow: t.CssShadow;
    };
  }
}
