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
    readonly id: string;
    readonly label?: string;
    readonly render: (e: { theme: t.CommonTheme }) => t.ReactNode;
  };

  /**
   * Controlled mode: provide `value` and `onChange`.
   * Uncontrolled mode: provide `defaultValue`.
   */
  export type Props = {
    items?: t.Ary<Item>;
    value?: string;
    defaultValue?: string;

    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
    onChange?: (e: { id: Item['id'] }) => void;
  };
}
