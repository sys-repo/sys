import type { MediaDevicesLib } from './t.ts';

import { getDevices } from './u.getDevices.ts';
import { List } from './ui.tsx';
import { useDeviceSelection } from './use.DeviceSelection.ts';
import { useDevicesList } from './use.DevicesList.ts';

export const Devices: MediaDevicesLib = {
  UI: { List },
  getDevices,
  useDevicesList,
  useDeviceSelection,
};
