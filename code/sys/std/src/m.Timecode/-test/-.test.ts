import { describe, expect, it } from '../../-test.ts';
import { Timecode, TimecodeOps } from '../mod.ts';

describe('Timecode', () => {
  it('API', async () => {
    const m = await import('@sys/std/time');
    expect(m.Timecode).to.equal(Timecode);
    expect(m.TimecodeOps).to.equal(TimecodeOps);
  });
});
