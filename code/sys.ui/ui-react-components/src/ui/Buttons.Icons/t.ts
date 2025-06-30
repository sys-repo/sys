import type { t } from './common.ts';

type C = React.FC<IconButtonProps>;

/**
 * Library of common icon buttons.
 */
export type ButtonsIconsLib = {
  readonly Close: C;
  readonly Face: C;
  readonly MicOn: C;
  readonly MicOff: C;
};

/**
 * Component:
 */
export type IconButtonProps = Omit<t.ButtonProps, 'label' | 'children'> & {
  debug?: boolean;
  size?: t.Pixels;
};
