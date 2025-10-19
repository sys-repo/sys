import type { t } from './common.ts';

/**
 * API: Device selection + lifecycle helpers.
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
  readonly toArgs: (index: t.Index) => t.DeviceHandlerArgs | undefined;
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
 * Lifecycle binding:
 * Manages Signal + LocalStorage synchronization around device selection.
 */
export type UseDeviceSelectionLifecycle = (options: DeviceSelectionLifecycleOptions) => void;
export type DeviceSelectionLifecycleOptions = {
  readonly items: readonly MediaDeviceInfo[];
  readonly signal: t.Signal<MediaDeviceInfo | undefined>;
  readonly prefs?: DeviceDefaultPrefs;
  readonly storageKey?: t.StringKey; //  Optional key for LocalStorage persistence.
  readonly enabled?: boolean; //         Toggle lifecycle behavior (default: true).
};
