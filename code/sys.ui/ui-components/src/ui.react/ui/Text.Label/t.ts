import type { t } from './common.ts';

/**
 * Text label component contracts.
 */
export declare namespace TextLabel {
  export type Lib = { readonly UI: t.FC<Props> };
  export type Props = {
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.Style.Input;
  };
}
