import { describe, expect, it } from '../../-test.ts';
import { Timecode } from '../mod.ts';

describe('Timecode', () => {
  it('API', async () => {
    const m = await import('@sys/std');
    expect(m.Timecode).to.equal(Timecode);
  });
});
