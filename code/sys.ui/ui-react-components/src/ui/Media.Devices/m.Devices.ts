import type { t } from './common.ts';
import { getDevices } from './u.getDevices.ts';
import { List } from './ui.tsx';
import { useDevicesList } from './use.DevicesList.ts';

export const Devices: t.MediaDevicesLib = {
  UI: { List },
  getDevices,
  useDevicesList,
};
