import { describe, expect, it } from '../-test.ts';
import { StdDate } from './common.ts';
import { Duration } from './m.Time.Duration.ts';
import { Time } from './mod.ts';

const { SECOND, MINUTE, HOUR, DAY } = StdDate;

describe('Duration', () => {
  describe('Time.duration', () => {
    it('time.duration(...)', () => {
      const a = Time.duration(123);
      const b = Time.duration('3.5h');
      expect(a.msec).to.eql(123);
      expect(b.hour).to.eql(3.5);
    });

    it('toString()', () => {
      const res = Time.duration(1025);
      expect(res.msec).to.eql(1025);
      expect(res.toString()).to.eql('1s');
      expect(res.toString('ms')).to.eql('1025ms');
    });

    it('toString (round)', () => {
      const duration = Time.duration(1258);
      const res1 = duration.toString();
      const res2 = duration.toString({ round: 1 });
      const res3 = duration.toString({ round: 3 });

      expect(res1).to.eql('1s'); // NB: using toString().
      expect(res2).to.eql('1.3s');
      expect(res3).to.eql('1.258s');
    });

    it('ok: true', () => {
      expect(Time.duration(123).ok).to.eql(true);
      expect(Time.duration(0).ok).to.eql(true);
    });

    it('ok: false', () => {
      expect(Time.duration(-1).ok).to.eql(false);
      expect(Time.duration(-0.001).ok).to.eql(false);
    });
  });

  it('forces anything less than zero to -1', () => {
    expect(Duration.create(-0.000001).msec).to.eql(-1);
  });

  it('Duration.parse', () => {
    const test = (input: string | number, msecs: number) => {
      const res = Duration.parse(input);
      expect(res.msec).to.eql(msecs);
    };

    test(0, 0);
    test(123, 123);
    test(123.5, 123.5);

    test('0', 0);
    test('  0   ', 0);
    test('123ms', 123);
    test('123 ms', 123);
    test('123.5ms  ', 123.5);
    test('3.5s', 3500);

    test('1s', SECOND);
    test('1m', MINUTE);
    test('1h', HOUR);
    test('1d', DAY);

    test('1sec', SECOND);
    test('1min', MINUTE);
    test('1hour', HOUR);
    test('1day', DAY);

    test('1 sec', SECOND);
    test('1 min', MINUTE);
    test('1 hour', HOUR);
    test('1 day', DAY);

    // Invalid.
    test('', -1);
    test('-1', -1);
    test('-10s', -1);
    test('123. 5ms  ', -1);
    test('123 .5ms  ', -1);
    test('123 .5', -1);
  });

  describe('Duration.elapsed', () => {
    it('calculates the gap between two explicit millisecond instants', () => {
      const gap = Duration.elapsed(2_000, 5_000);
      expect(gap.msec).to.equal(3_000);
    });

    it('defaults the end instant to “now” when omitted', () => {
      const start = Date.now() - 1_500; // 1.5s ago.
      const gap = Duration.elapsed(start).msec;
      expect(gap).to.be.closeTo(1_500, 25); // ±25 ms tolerance.
    });

    it('accepts ISO-8601 date-time strings as inputs', () => {
      const gap = Duration.elapsed('1970-01-01T00:00:00.000Z', '1970-01-01T00:00:02.500Z');
      expect(gap.msec).to.equal(2_500);
    });
  });
});
