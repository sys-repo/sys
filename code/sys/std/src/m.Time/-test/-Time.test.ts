import { describe, expect, it } from '../../-test.ts';
import { Date } from '../../m.Time.Date/mod.ts';
import { Duration } from '../m.Time.Duration.ts';
import { Time } from '../mod.ts';

describe('Time', () => {
  it('API', () => {
    expect(Time.Date).to.equal(Date);
    expect(Time.Duration).to.equal(Duration);
    expect(Time.duration).to.equal(Duration.create);
    expect(Time.elapsed).to.equal(Duration.elapsed);
  });
});
