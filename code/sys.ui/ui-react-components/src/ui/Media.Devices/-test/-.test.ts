import { describe, expect, it } from '../../../-test.ts';

import { Devices } from '../mod.ts';
import { getDevices } from '../u.getDevices.ts';
import { selectDefaultDevice } from '../u.selectDefault.ts';
import { useDeviceSelectionLifecycle } from '../use.DeviceSelection.Lifecycle.ts';
import { useDeviceSelection } from '../use.DeviceSelection.ts';
import { useDevicesList } from '../use.DevicesList.ts';

describe('Media.Devices', () => {
  it('API', () => {
    expect(Devices.selectDefault).to.eql(selectDefaultDevice);
    expect(Devices.getDevices).to.equal(getDevices);
    expect(Devices.useDevicesList).to.equal(useDevicesList);
    expect(Devices.useDeviceSelection).to.equal(useDeviceSelection);
    expect(Devices.useDeviceSelectionLifecycle).to.equal(useDeviceSelectionLifecycle);
  });

  describe('selectDefaultDevice', () => {
    it('returns 0 when no labels but requireLabel=false', () => {
      const list = [
        { kind: 'videoinput', label: '' },
        { kind: 'audioinput', label: '' },
      ] as MediaDeviceInfo[];
      const res = selectDefaultDevice(list, { requireLabel: false });
      expect(res).to.equal(0);
    });

    it('respects labelMatch', () => {
      const list = [
        { kind: 'videoinput', label: 'Front Cam' },
        { kind: 'videoinput', label: 'USB Cam' },
      ] as MediaDeviceInfo[];
      const matchUsb = (label: string) => label.includes('USB');
      const yes = selectDefaultDevice(list, { labelMatch: matchUsb });
      const no = selectDefaultDevice(list, { labelMatch: (l) => l.includes('Nope') });
      expect(yes).to.equal(1);
      expect(no).to.equal(undefined);
    });

    it('honors kindOrder', () => {
      const list = [
        { kind: 'audioinput', label: 'Mic' },
        { kind: 'videoinput', label: 'Cam' },
      ] as MediaDeviceInfo[];
      const res1 = selectDefaultDevice(list); // default: video first
      const res2 = selectDefaultDevice(list, { kindOrder: ['audioinput', 'videoinput'] });
      expect(res1).to.equal(1); // video
      expect(res2).to.equal(0); // audio
    });

    it('empty list → undefined', () => {
      const res = selectDefaultDevice([]);
      expect(res).to.equal(undefined);
    });
  });
});
