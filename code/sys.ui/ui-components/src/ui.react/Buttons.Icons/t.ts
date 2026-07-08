import type { t } from './common.ts';

/**
 * Library of common icon buttons.
 */
export declare namespace ButtonsIcons {
  type C = React.FC<Props>;

  /** Public runtime surface. */
  export type Lib = {
    readonly Close: C;
    readonly Face: C;
    readonly MicOn: C;
    readonly MicOff: C;
    readonly Settings: C;
    readonly Tools: C;
  };

  /** Icon button props. */
  export type Props = Omit<t.Button.Props, 'label' | 'children'> & {
    debug?: boolean;
    size?: t.Pixels;
  };
}
