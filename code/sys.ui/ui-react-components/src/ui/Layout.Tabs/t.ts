import type { t } from './common.ts';

/**
 * Tabs primitive for composing discrete panel views.
 */
export declare namespace Tabs {
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
    onChange?: ChangeHandler;
  };

  export type ChangeHandler = (e: Change) => void;
  export type Change = { readonly id: t.StringId };

  export type Render = (e: RenderArgs) => t.ReactNode;
  export type RenderArgs = { readonly theme: t.CommonTheme };
}
