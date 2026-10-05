import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Time } from '../mod.ts';
import { wallClock } from './u.fixture.wallClock.ts';

describe('Time.timer', () => {
  describe('start time, resets, and Date isolation', () => {
    it('omitted start → current time and zero elapsed duration', () => {
      using clock = wallClock();
      const timer = Time.timer();
      expectTypeOf(timer).toEqualTypeOf<t.Time.Timer>();
      expect(timer.startedAt.getTime()).to.eql(clock.now);
      expect(timer.elapsed.msec).to.eql(0);
      clock.set(clock.now + 123);
      expect(timer.elapsed.msec).to.eql(123);
    });

    it('copies the supplied Date, including epoch zero', () => {
      using _clock = wallClock(123);
      const input = new Date(0);
      const timer = Time.timer(input);
      expect(timer.startedAt).not.to.equal(input);
      expect(timer.startedAt.getTime()).to.eql(0);
      input.setTime(1000);
      expect(timer.startedAt.getTime()).to.eql(0);
      expect(timer.elapsed.msec).to.eql(123);
    });

    it('returns fresh Dates whose mutation cannot affect elapsed', () => {
      using _clock = wallClock(123);
      const timer = Time.timer(new Date(0));
      const first = timer.startedAt;
      const second = timer.startedAt;
      expect(first).not.to.equal(second);
      expect(first).to.eql(second);
      first.setTime(NaN);
      second.setTime(1000);
      expect(timer.startedAt.getTime()).to.eql(0);
      expect(timer.elapsed.msec).to.eql(123);
    });

    it('reset restarts elapsed time without changing earlier Date snapshots', () => {
      using clock = wallClock(1000);
      const timer = Time.timer(new Date(500));
      const previous = timer.startedAt;
      for (const timestamp of [2000, 3000, 3000]) {
        clock.set(timestamp);
        expect(timer.reset()).to.equal(timer);
        expect(timer.startedAt.getTime()).to.eql(timestamp);
        expect(timer.elapsed.msec).to.eql(0);
        clock.set(timestamp + 25);
        expect(timer.elapsed.msec).to.eql(25);
        expect(previous.getTime()).to.eql(500);
      }
    });

    it('clock moves before the start → invalid duration; reset uses the new time', () => {
      using clock = wallClock(1000);
      const timer = Time.timer(new Date(1000));
      clock.set(1100);
      expect(timer.elapsed.msec).to.eql(100);
      clock.set(900);
      expect(timer.startedAt.getTime()).to.eql(1000);
      expect(timer.elapsed.ok).to.eql(false);
      expect(timer.elapsed.msec).to.eql(-1);
      timer.reset();
      expect(timer.startedAt.getTime()).to.eql(900);
      expect(timer.elapsed.msec).to.eql(0);
    });

    it('an invalid start cannot be repaired by Date mutation, but reset replaces it', () => {
      using _clock = wallClock(1000);
      const input = new Date(NaN);
      const timer = Time.timer(input);
      input.setTime(0);
      timer.startedAt.setTime(0);
      expect(timer.startedAt.getTime()).to.be.NaN;
      expect(timer.elapsed.ok).to.eql(false);
      timer.reset();
      expect(timer.startedAt.getTime()).to.eql(1000);
      expect(timer.elapsed.msec).to.eql(0);
    });
  });

  describe('elapsed units, rounding, and formatting', () => {
    const cases = [
      ['sec', 90_000, undefined, 90],
      ['sec', 90_000, 0, 90],
      ['min', 324_000, undefined, 5.4],
      ['min', 324_000, 0, 5],
      ['min', 324_000, 1, 5.4],
      ['hour', 9_468_000, undefined, 2.6],
      ['hour', 9_468_000, 0, 3],
      ['hour', 9_468_000, 1, 2.6],
      ['hour', 9_468_000, 2, 2.63],
      ['day', 410_700_000, undefined, 4.8],
      ['day', 410_700_000, 0, 5],
      ['day', 410_700_000, 1, 4.8],
    ] as const;
    for (const [unit, msecs, round, expected] of cases) {
      it(`${unit}, round ${round ?? 'default'} → ${expected}`, () => {
        using _clock = wallClock(msecs);
        const timer = Time.timer(new Date(0), { round });
        expect(timer.elapsed[unit]).to.eql(expected);
        expect(timer.elapsed[unit]).to.eql(Time.elapsed(0, msecs, { round })[unit]);
      });
    }

    const formats = [
      [90_000, 's', '90s'],
      [90_000, 'sec', '90s'],
      [324_000, 'm', '5m'],
      [324_000, 'min', '5m'],
      [9_468_000, 'h', '3h'],
      [9_468_000, 'hour', '3h'],
      [410_700_000, 'd', '5d'],
      [410_700_000, 'day', '5d'],
    ] as const;
    for (const [msecs, unit, expected] of formats) {
      it(`format(${unit}) → ${expected}`, () => {
        using _clock = wallClock(msecs);
        expect(Time.timer(new Date(0)).elapsed.format(unit)).to.eql(expected);
      });
    }

    const strings = [
      [0, '0ms'],
      [999, '999ms'],
      [10_000, '10s'],
      [35_000, '35s'],
      [59_000, '59s'],
      [119_000, '2m'],
      [16 * 60_000, '16m'],
      [59 * 60_000, '59m'],
      [61 * 60_000, '1h'],
      [89 * 60_000, '1h'],
      [91 * 60_000, '2h'],
      [3 * 3_600_000, '3h'],
      [27 * 3_600_000, '1d'],
      [2 * 86_400_000, '2d'],
      [4 * 86_400_000, '4d'],
    ] as const;
    for (const [msecs, expected] of strings) {
      it(`toString at ${msecs} ms → ${expected}`, () => {
        using _clock = wallClock(msecs);
        expect(Time.timer(new Date(0)).elapsed.toString()).to.eql(expected);
      });
    }
  });

  it('real host clock advances the elapsed value', async () => {
    const before = Date.now();
    const timer = Time.timer();
    expect(timer.startedAt.getTime()).to.be.within(before, Date.now());
    await Time.wait(10);
    const lower = Date.now() - timer.startedAt.getTime();
    const elapsed = timer.elapsed.msec;
    const upper = Date.now() - timer.startedAt.getTime();
    expect(elapsed).to.be.within(lower, upper);
    expect(elapsed).to.be.greaterThan(0);
  });

  it('fixture body throws → restores the original wall-clock descriptor', () => {
    const descriptor = Object.getOwnPropertyDescriptor(Date, 'now');
    const failure = new Error('fixture body failure');
    expect(() => {
      using clock = wallClock(0);
      expect(Date.now()).to.eql(clock.now);
      throw failure;
    }).to.throw(failure);
    expect(Object.getOwnPropertyDescriptor(Date, 'now')).to.eql(descriptor);
  });
});
