import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { cmp } from '../m.Timecode.sort.ts';
import { Timecode } from '../mod.ts';

describe('Timecode', () => {
  it('API', async () => {
    const m = await import('@sys/std');
    expect(m.Timecode).to.equal(Timecode);
  });
});
