import type { t } from './common.ts';

export type * from './t.list.ts';
export type * from './t.selection.ts';

/**
 * API: Devices list and selector.
 */
export type MediaDevicesLib = {
  UI: { List: React.FC<t.DevicesProps> };
  selectDefault: t.SelectDefaultDevice;
  getDevices(): Promise<MediaDeviceInfo[]>;
  useDevicesList: t.UseMediaDevicesList;
  useDeviceSelection: t.UseDeviceSelection;
};

/**
 * <Component>:
 */
export type DevicesProps = {
  selected?: t.Index | MediaDeviceInfo;
  filter?: (info: MediaDeviceInfo) => boolean;
  debug?: boolean;
  rowGap?: t.Pixels;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onSelect?: t.DeviceHandler;
};
