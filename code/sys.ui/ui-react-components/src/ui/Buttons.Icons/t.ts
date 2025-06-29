import type { t } from './common.ts';

/**
 * Library of common icon buttons.
 */
export type ButtonsIconsLib = {
  readonly Close: React.FC<IconButtonProps>;
  readonly Face: React.FC<IconButtonProps>;
};

/**
 * Component:
 */
export type IconButtonProps = Omit<t.ButtonProps, 'label' | 'children'> & {
  debug?: boolean;
  size?: t.Pixels;
};
