import { describe, expect, it } from '../../-test.ts';
import { Date } from '../../m.Time.Date/mod.ts';
import { Duration } from '../m.Time.Duration.ts';
import { Time } from '../mod.ts';

describe('Time', () => {
  it('API', async () => {
    const m = await import('@sys/std/time');
    expect(m.Time).to.equal(Time);

    expect(Time.Date).to.equal(Date);
    expect(Time.Duration).to.equal(Duration);
    expect(Time.duration).to.equal(Duration.create);
    expect(Time.elapsed).to.equal(Duration.elapsed);
    expect(Time.Delay.MAX).to.equal(2_147_483_647);
    expect(Object.isFrozen(Time.Delay)).to.equal(true);
  });
});
