import type React from 'react';
import type { t } from './common.ts';

/**
 * Styled rich-content button with keyboard focus and Enter/Space activation.
 * Retains a div root for rich content; interactive descendants own their input.
 */
export declare namespace Button {
  export type Content = React.JSX.Element | string | number | false;

  /** Component props. */
  export type Props = {
    debug?: boolean;

    children?: Content;
    label?: React.ReactNode | (() => React.ReactNode);
    tooltip?: string;

    /** Boolean state: */
    /** Disabled buttons leave the tab order and suppress activation. */
    enabled?: boolean | (() => boolean);
    opacity?: t.Percent | Prop.Callback<t.Percent>;
    /** Inactive buttons leave the tab order and ignore interaction. */
    active?: boolean;
    /** Caller-owned toggle state; omitted for actions, independent of physical press styling. */
    'aria-pressed'?: boolean;
    block?: boolean;
    isOver?: boolean; // force the button into an "is-over" state.
    isDown?: boolean; // force the button into an "is-down" state.

    /** Appearance: */
    theme?: t.CommonTheme;
    /**
     * Root styles, with a default 1px border radius.
     *
     * Set root CSS tokens to customize the default focus treatment:
     * - `--sys-button-focus-accent`: arrival colour (default: opaque blue).
     * - `--sys-button-focus-rest`: resting colour (default: blue at 20% alpha).
     * - `--sys-button-focus-width`: outline stroke width, not Button width (default: `2px`).
     * - `--sys-button-focus-offset`: outline offset from the root edge (default: `2px`).
     * The default resting colour does not meet 3:1 contrast against white or Dark;
     * choose colours for the actual surface.
     * Use explicit CSS lengths for width/offset; keep width positive. Offset may be zero
     * or negative. The outline paints without reserving layout space.
     *
     * Each Button using the default treatment initializes its own palette and geometry.
     * Reduced motion skips the arrival; forced colours uses a static `Highlight` outline
     * instead of the palette. Both retain the chosen width and offset. Timing and easing
     * come from FocusStyle.compose; Button and Anchor select the same FocusStyle.outline recipe.
     *
     * Explicit root or supported pseudo-class animation settings, including longhands,
     * keep default focus static.
     * A supplied `:focus-visible` block replaces the entire default treatment, including
     * its motion/preference policy. The caller then owns the visible focus indicator.
     * Use explicit outline-offset units; suppress the outline only with a visible replacement.
     */
    style?: t.CssInput;
    margin?: t.CssEdgesInput;
    padding?: t.CssEdgesInput;
    minWidth?: number;
    maxWidth?: number;
    userSelect?: boolean;
    pressedOffset?: [number, number];
    disabledOpacity?: t.Percent;

    /** Subscribe to signals that cause the button to redraw. */
    subscribe?: () => void;

    /** Events: */
    /** Primary mouse/touch release, or a click event for keyboard/assistive activation. */
    onClick?: React.MouseEventHandler;
    onMouseDown?: React.MouseEventHandler;
    onMouseUp?: React.MouseEventHandler;
    onMouseEnter?: React.MouseEventHandler;
    onMouseLeave?: React.MouseEventHandler;
    onDoubleClick?: React.MouseEventHandler;
    onMouse?: Mouse.Handler;
  };

  /**
   * Dynamic prop callback details.
   */
  export namespace Prop {
    /** Callback used by a button to dynamically evaluate a prop value on redraw. */
    export type Callback<T> = (e: CallbackArgs) => T;
    /** Callback arguments. */
    export type CallbackArgs = { readonly is: Flags };
  }

  /** State flags representing the button interaction state. */
  export type Flags = {
    readonly enabled: boolean;
    readonly disabled: boolean;
    readonly over: boolean;
    readonly down: boolean;
  };

  /**
   * Mouse event rollup details.
   */
  export namespace Mouse {
    /** Handler for general mouse button event rollup. */
    export type Handler = (e: Args) => void;

    /** Mouse button event rollup. */
    export type Args = {
      readonly action: 'MouseEnter' | 'MouseLeave' | 'MouseDown' | 'MouseUp';
      readonly synthetic: React.MouseEvent;
      readonly modifiers: t.Keyboard.Modifier.Flags;
      readonly is: Flags;
      /** Prevent propagation/default and cancel activation for this press. */
      cancel(): void;
    };
  }
}
