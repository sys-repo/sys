import type { t } from './common.ts';

/**
 * A readout for displaying status and inspecting events.
 */
export declare namespace EventsView {
  export type Lib = { readonly UI: t.FC<Props> };
  export type Props = {
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.Style.Input;
  };
}
