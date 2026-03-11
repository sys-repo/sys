import type { t } from './common.ts';

/**
 * Development harness for inspecting CRDT repo state and live slug documents.
 */
export declare namespace DevCrdt {
  export type Lib = { readonly UI: t.FC<Props> };
  export type Props = {
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
}
