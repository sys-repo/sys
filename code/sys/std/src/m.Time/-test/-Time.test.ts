import { describe, expect, it } from '../../-test.ts';
import { Duration } from '../m.Time.Duration.ts';
import { Time } from '../mod.ts';

describe('Time', () => {
  it('API', () => {
    expect(Time.Duration).to.equal(Duration);
    expect(Time.duration).to.equal(Duration.create);
    expect(Time.elapsed).to.equal(Duration.elapsed);
  });
});
