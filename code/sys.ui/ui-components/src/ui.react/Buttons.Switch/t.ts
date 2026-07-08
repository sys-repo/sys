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
    value?: boolean;
    width?: t.Pixels;
    height?: t.Pixels;
    enabled?: boolean;
    tooltip?: string;

    /** Appearance: */
    track?: Partial<Theme.Track>;
    thumb?: Partial<Theme.Thumb>;
    theme?: t.CommonTheme | Partial<Theme.Root>;
    transitionSpeed?: t.Msecs;
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
