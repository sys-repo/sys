import type { t } from './common.ts';

/** Pure selector: choose a default device index. */
export type SelectDefaultDevice = (
  items: readonly MediaDeviceInfo[],
  prefs?: DeviceDefaultPrefs,
) => t.Index | undefined;

/**
 * Device selection + lifecycle helpers.
 */
export type UseDeviceSelection = (
  items: MediaDeviceInfo[],
  options?: DeviceSelectionOptions,
) => DeviceSelectionHook;

/**
 * Hook state and helpers.
 */
export type DeviceSelectionHook = {
  readonly selected?: t.Index;
  readonly setSelected: (index: t.Index | undefined) => void;
  readonly toArgs: (index: t.Index) => t.MediaDeviceHandlerArgs | undefined;
};

/**
 * Configuration options for selection behavior.
 */
export type DeviceSelectionOptions = {
  readonly prefs?: DeviceDefaultPrefs;
  readonly seed?: t.Index | MediaDeviceInfo;
};

/**
 * Strategy for choosing a default device.
 */
export type DeviceDefaultPrefs = {
  readonly kindOrder?: MediaDeviceKind[]; //  Ranking of preferred kinds.
  readonly requireLabel?: boolean; //         Skip blank labels if true.
  readonly labelMatch?: (label: string, info: MediaDeviceInfo) => boolean;
};

/**
 * Manages device-selection state with automatic restore, persistence, and validation.
 *
 * - Restore from LocalStorage (optional), else derive default.
 * - Preserve selection by `deviceId` across churn.
 * - Persist `deviceId` when selection changes (if storageKey).
 * - Clear stored id if the device no longer exists.
 */
export type UseDeviceSelectionLifecycle = (options: DeviceSelectionLifecycleOptions) => void;
export type DeviceSelectionLifecycleOptions = {
  readonly items: MediaDeviceInfo[];
  readonly selected?: MediaDeviceInfo;
  readonly enabled?: boolean;
  readonly storageKey?: t.StringKey;
  readonly prefs?: DeviceDefaultPrefs;
  readonly filter?: t.MediaDevicesFilter;
  readonly onResolve?: t.MediaDeviceHandler;
};
