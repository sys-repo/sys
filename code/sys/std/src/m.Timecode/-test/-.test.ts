import { describe, expect, it } from '../../-test.ts';
import { Timecode } from '../mod.ts';

import { Ops } from '../m.Ops.ts';
import { Slice } from '../m.Slice.ts';
import * as mod from '../mod.ts';

describe('Timecode', () => {
  it('API: /std/time', async () => {
    const m = await import('@sys/std/time');
    expect(m.Timecode).to.equal(Timecode);
    expect(m.Timecode.Ops).to.equal(Ops);
    expect(m.Timecode.Slice).to.equal(Slice);
  });

  it('API: /std/time/timecode', async () => {
    const m = await import('@sys/std/time/timecode');
    expect(m.Timecode).to.equal(Timecode);
    expect(m.Timecode.Ops).to.equal(Ops);

    expect(m.find).to.equal(mod.find);
    expect(m.findAtOrBefore).to.equal(mod.findAtOrBefore);
    expect(m.neighbors).to.equal(mod.neighbors);
    expect(m.nearest).to.equal(mod.nearest);
    expect(m.between).to.equal(mod.between);
  });
});
