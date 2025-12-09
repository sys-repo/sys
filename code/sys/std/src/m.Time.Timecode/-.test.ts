import { describe, expect, it } from '../-test.ts';

import * as mod from './mod.ts';
import { Timecode } from './mod.ts';

import { VTime } from './clock/mod.ts';
import { Composite } from './composite/mod.ts';
import { Ops } from './core.ops/mod.ts';
import { Pattern } from './m.Pattern.ts';
import { Slice } from './slice/mod.ts';
import { Experience } from './experience/mod.ts';

describe('Timecode', () => {
  it('API: @sys/std/time', async () => {
    const m = await import('@sys/std/time');
    expect(m.Timecode).to.equal(Timecode);
    expect(m.Timecode.Ops).to.equal(Ops);
    expect(m.Timecode.Slice).to.equal(Slice);
    expect(m.Timecode.Composite).to.equal(Composite);
    expect(m.Timecode.Pattern).to.equal(Pattern);
    expect(m.Timecode.VTime).to.equal(VTime);
  });

  it('API: @sys/std/time/timecode (core)', async () => {
    const m = await import('@sys/std/time/timecode');
    expect(m.Timecode).to.equal(Timecode);
    expect(m.Timecode.Ops).to.equal(Ops);
    expect(m.Timecode.Experience).to.equal(Experience);

    expect(m.find).to.equal(mod.find);
    expect(m.findAtOrBefore).to.equal(mod.findAtOrBefore);
    expect(m.neighbors).to.equal(mod.neighbors);
    expect(m.nearest).to.equal(mod.nearest);
    expect(m.between).to.equal(mod.between);
  });
});
