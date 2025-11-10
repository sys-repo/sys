import { describe, expect, it } from '../../-test.ts';
import { Date } from '../../m.Time.Date/mod.ts';
import { Timecode } from '../../m.Time.Timecode/mod.ts';
import { Duration, Time } from '../mod.ts';

describe('Time', () => {
  it('API', async () => {
    const m = await import('@sys/std/time');
    expect(m.Duration).to.equal(Duration);
    expect(m.Time).to.equal(Time);
    expect(m.Timecode).to.equal(Timecode);
    expect(m.Date).to.equal(Date);
  });
});
