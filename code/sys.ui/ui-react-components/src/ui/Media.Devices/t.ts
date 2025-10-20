import type { t } from './common.ts';
export type * from './t.selection.ts';

/**
 * API: Devices list and selector.
 */
export type MediaDevicesLib = {
  UI: { List: React.FC<t.MediaDevicesProps> };
  selectDefault: t.SelectDefaultDevice;
  getDevices(opts?: { includePseudo?: boolean }): Promise<MediaDeviceInfo[]>;
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
export type MediaDevicesProps = {
  selected?: MediaDeviceInfo;
  filter?: t.MediaDevicesFilter;
  debug?: boolean;
  rowGap?: t.Pixels;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onSelect?: t.MediaDeviceHandler;
};

/** Filter on media-device info. */
export type MediaDevicesFilter = (info: MediaDeviceInfo) => boolean;

/**
 * Hook: Load the enumerated list of available devices.
 */
export type UseMediaDevicesList = () => MediaDevicesListHook;
export type MediaDevicesListHook = { readonly items: MediaDeviceInfo[] };

/**
 * Handlers for device events.
 */
export type MediaDeviceHandler = (e: MediaDeviceHandlerArgs) => void;
export type MediaDeviceHandlerArgs = {
  readonly device: MediaDeviceInfo;
  readonly index: number;
};
