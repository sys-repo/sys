import type { MediaDevicesLib } from './t.ts';

import { getDevices } from './u.getDevices.ts';
import { selectDefaultDevice as selectDefault } from './u.selectDefault.ts';
import { List } from './ui.tsx';
import { useDeviceSelectionLifecycle } from './use.DeviceSelection.Lifecycle.ts';
import { useDeviceSelection } from './use.DeviceSelection.ts';
import { useDevicesList } from './use.DevicesList.ts';

export const Devices: MediaDevicesLib = {
  UI: { List },
  getDevices,
  selectDefault,
  useDevicesList,
  useDeviceSelection,
  useDeviceSelectionLifecycle,
};
