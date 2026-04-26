import { describe, expect, it } from '../../../-test.ts';

import { Timecode } from '../../../-exports/-time.timecode.ts';
import { VClock, VTime } from '../mod.ts';

describe('VirtualClock', () => {
  it('API', () => {
    expect(Timecode.VTime).to.equal(VTime);
    expect(Timecode.VClock).to.equal(VClock);
  });
});
