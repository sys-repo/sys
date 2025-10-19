import { describe, expect, it } from '../../../-test.ts';
import { Devices } from '../mod.ts';
import { useDeviceSelection } from '../use.DeviceSelection.ts';
import { useDevicesList } from '../use.DevicesList.ts';

describe('Media.Devices', () => {
  it('API', () => {
    expect(Devices.useDevicesList).to.equal(useDevicesList);
    expect(Devices.useDeviceSelection).to.equal(useDeviceSelection);
  });
});
