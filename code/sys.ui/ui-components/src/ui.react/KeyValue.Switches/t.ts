import type { t } from './common.ts';

/**
 * KeyValue-shaped switches for labeled boolean controls.
 */
export declare namespace KeyValueSwitches {
  export type Lib = { readonly UI: t.FC<Props> };
  export type Props = {
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
}
