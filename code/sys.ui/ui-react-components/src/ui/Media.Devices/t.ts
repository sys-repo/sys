import type { t } from './common.ts';

/**
 * API: Devices list and selector.
 */
export type MediaDevicesLib = {
  View: { List: React.FC<t.DevicesProps> };
};

/**
 * <Component>:
 */
export type DevicesProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
