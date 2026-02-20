import type { t } from './common.ts';

/**
 * Tabs primitive for composing discrete panel views.
 */
export declare namespace Tabs {
  /** Public Layout.Tabs module surface. */
  export type Lib = { readonly UI: t.FC<Props> };

  /**
   * Single tab.
   */
  export type Item = {
    readonly id: t.StringId;
    readonly label?: string;
    readonly render: Render;
  };

  /**
   * Selection is props-driven.
   * - `value` is the selected tab id.
   * - `defaultValue` is a fallback when `value` is undefined or invalid.
   */
  export type Props = {
    items?: t.Ary<Item>;
    value?: t.StringId;
    defaultValue?: t.StringId;

    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
    parts?: Parts;

    onChange?: ChangeHandler;
  };

  /** Change callback fired when tab selection intent occurs. */
  export type ChangeHandler = (e: Change) => void;
  /** Payload describing the next selected tab id. */
  export type Change = { readonly id: t.StringId };

  /** Tab body render callback shape. */
  export type Render = (e: RenderArgs) => t.ReactNode;
  /** Render callback arguments provided to tab body views. */
  export type RenderArgs = { readonly theme: t.CommonTheme };

  /** Optional style partitions for strip, tabs, and body sections. */
  export type Parts = {
    strip?: StripStyle;
    tab?: TabStyle;
    body?: BodyStyle;
  };

  /** Visual configuration for the top tab strip container. */
  export type StripStyle = {
    height?: number;
    border?: boolean;
  };

  /** Visual configuration for individual tab buttons. */
  export type TabStyle = {
    fontSize?: number;
    idleOpacity?: number;
    selectedColor?: string;
    hoverColor?: string;
  };

  /** Visual configuration for the selected tab body container. */
  export type BodyStyle = {
    padding?: t.CssPaddingInput;
    scroll?: boolean;
  };
}
