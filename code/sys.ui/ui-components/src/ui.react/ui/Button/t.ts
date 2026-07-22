import type React from 'react';
import type { t } from './common.ts';

/**
 * Headless clickable button primitive.
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
    enabled?: boolean | (() => boolean);
    opacity?: t.Percent | Prop.Callback<t.Percent>;
    active?: boolean;
    block?: boolean;
    isOver?: boolean; // force the button into an "is-over" state.
    isDown?: boolean; // force the button into an "is-down" state.

    /** Appearance: */
    theme?: t.CommonTheme;
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
    onClick?: React.MouseEventHandler;
    onMouseDown?: React.MouseEventHandler;
    onMouseUp?: React.MouseEventHandler;
    onMouseEnter?: React.MouseEventHandler;
    onMouseLeave?: React.MouseEventHandler;
    onDoubleClick?: React.MouseEventHandler;
    onMouse?: Mouse.Handler;
  };

  /** Dynamic prop callback details. */
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

  /** Mouse event rollup details. */
  export namespace Mouse {
    /** Handler for general mouse button event rollup. */
    export type Handler = (e: Args) => void;

    /** Mouse button event rollup. */
    export type Args = {
      readonly action: 'MouseEnter' | 'MouseLeave' | 'MouseDown' | 'MouseUp';
      readonly synthetic: React.MouseEvent;
      readonly modifiers: t.Keyboard.Modifier.Flags;
      readonly is: Flags;
      cancel(): void;
    };
  }
}
