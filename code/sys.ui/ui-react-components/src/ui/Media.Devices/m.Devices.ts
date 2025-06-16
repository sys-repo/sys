import type { MediaDevicesLib } from './t.ts';

import { getDevices } from './u.getDevices.ts';
import { List } from './ui.tsx';
import { useDevicesList } from './use.DevicesList.ts';

export const Devices: MediaDevicesLib = {
  UI: { List },
  getDevices,
  useDevicesList,
};
