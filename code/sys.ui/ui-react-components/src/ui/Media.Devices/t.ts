import type { t } from './common.ts';

/**
 * API: Devices list and selector.
 */
export type MediaDevicesLib = {
  View: { List: React.FC<t.DevicesProps> };
  getDevices(): Promise<MediaDeviceInfo[]>;
  useDevicesList: UseMediaDevicesList;
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

/**
 * Hook: Load the enumerated list of available devices.
 */
export type UseMediaDevicesList = () => MediaDevicesListHook;
export type MediaDevicesListHook = {
  readonly items: MediaDeviceInfo[];
};

/**
 * Handlers for device events.
 */
export type DeviceHandler = (e: DeviceHandlerArgs) => void;
export type DeviceHandlerArgs = { info: MediaDeviceInfo; index: number };
