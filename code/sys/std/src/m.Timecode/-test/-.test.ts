import { Ops, Timecode } from '@sys/std/time/timecode';
import { describe, expect, it } from '../../-test.ts';

import * as mod from '../mod.ts';

describe('Timecode', () => {
  it('API: /std/time', async () => {
    const m = await import('@sys/std/time');
    expect(m.Timecode).to.equal(Timecode);
    expect(m.Timecode.Ops).to.equal(Ops);
  });

  it('API: /std/time/timecode', async () => {
    const m = await import('@sys/std/time/timecode');
    expect(m.Timecode).to.equal(Timecode);
    expect(m.Timecode.Ops).to.equal(Ops);
    expect(m.Ops).to.equal(Ops);

    expect(m.find).to.equal(mod.find);
    expect(m.findAtOrBefore).to.equal(mod.findAtOrBefore);
    expect(m.neighbors).to.equal(mod.neighbors);
    expect(m.nearest).to.equal(mod.nearest);
    expect(m.between).to.equal(mod.between);
  });
});
