import type { t } from './common.ts';

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
  useDeviceSelectionLifecycle: t.UseDeviceSelectionLifecycle;
};

/**
 * <Devices.UI.List>
 * Props for rendering and interacting with the media device list.
 *
 * - `selected` holds the `deviceId` of the currently selected device.
 * - `onSelect` fires with the selected device info and index.
 */
export type DevicesProps = {
  selected?: MediaDeviceInfo;
  filter?: t.DevicesFilter;
  debug?: boolean;
  rowGap?: t.Pixels;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onSelect?: t.DeviceHandler;
};

/** Filter on media-device info. */
export type DevicesFilter = (info: MediaDeviceInfo) => boolean;

/**
 * Hook: Load the enumerated list of available devices.
 */
export type UseMediaDevicesList = () => MediaDevicesListHook;
export type MediaDevicesListHook = { readonly items: MediaDeviceInfo[] };

/**
 * Handlers for device events.
 */
export type DeviceHandler = (e: DeviceHandlerArgs) => void;
export type DeviceHandlerArgs = { info: MediaDeviceInfo; index: number };
