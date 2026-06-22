import type { t } from './common.ts';

/**
 * InfoPanel configuration component contracts.
 */
export declare namespace InfoPanelConfig {
  /** Public runtime surface for the InfoPanelConfig component. */
  export type Lib = { readonly UI: t.FC<Props> };

  /** Props accepted by InfoPanelConfig. */
  export type Props = {
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.Style.Input;
  };
}
