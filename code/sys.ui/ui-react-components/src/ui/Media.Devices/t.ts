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
  onDevicesChange?: t.MediaDevicesHandler;
};

/** Filter on media-device info. */
export type MediaDevicesFilter = (info: MediaDeviceInfo) => boolean;

/**
 * Hook: Load the enumerated list of available devices.
 */
export type UseMediaDevicesList = () => MediaDevicesListHook;
export type MediaDevicesListHook = { readonly items: MediaDeviceInfo[] };

/**
 * Handler invoked when a single device is selected.
 */
export type MediaDeviceHandler = (e: MediaDeviceHandlerArgs) => void;
/** Event payload for a single device selection. */
export type MediaDeviceHandlerArgs = {
  /** The selected media device. */
  readonly device: MediaDeviceInfo;
  /** Index position of the device in the visible list. */
  readonly index: number;
};

/**
 * Handler invoked when the overall device list changes.
 */
export type MediaDevicesHandler = (e: MediaDevices) => void;
/** Event payload representing the current device lists. */
export type MediaDevices = {
  /** The filtered (visible) list used by the component. */
  readonly devices: MediaDeviceInfo[];
  /** The raw, unfiltered list returned by the system. */
  readonly all: MediaDeviceInfo[];
  /** True if a filter was applied and the visible list differs from the raw list. */
  readonly filtered: boolean;
};
