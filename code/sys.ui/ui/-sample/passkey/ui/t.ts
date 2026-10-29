import type { t } from './common.ts';

/**
 * Internal passkey spike UI contracts.
 */
export declare namespace Passkey {
  export type Lib = { readonly UI: t.FC<Props> };
  export type Props = {
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.Style.Input;
  };
}
