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
