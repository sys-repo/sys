import { type t, describe, expect, it } from '../-test.ts';
import { Num } from '../m.Value.Num/mod.ts';
import { Time } from './m.Time.ts';
import { Timestamp } from './mod.ts';

describe('Timestamp', () => {
  type T = { image: string };
  type MyTimestamps = t.Timestamps<T>;

  describe('parse: "HH:MM:SS.mmm"', () => {
    it('should parse "00:00:00.000" as 0 msecs and 0 secs', () => {
      const res = Timestamp.parse('00:00:00.000');
      expect(res.msec).to.eql(0);
      expect(res.sec).to.eql(0);
      expect(res.hour).to.eql(0);
      expect(res.min).to.eql(0);
    });

    it('should parse "01:02:03.004" correctly', () => {
      // Expected values:
      // hours: 1, minutes: 2, seconds: 3, milliseconds: 4
      const expectedMsecs = 1 * 3600000 + 2 * 60000 + 3 * 1000 + 4; // 3,723,004 msecs
      const expectedSecs = expectedMsecs / 1000; // 3,723.004 secs
      const expectedMins = expectedMsecs / 60000; // 62.05006666666667 mins
      const expectedHours = expectedMsecs / 3600000; // 1.0341677777777778 hours

      const res = Timestamp.parse('01:02:03.004');
      expect(res.msec).to.eql(expectedMsecs);
      expect(res.sec).to.eql(Num.round(expectedSecs, 1));
      expect(res.min).to.eql(Num.round(expectedMins, 1));
      expect(res.hour).to.eql(Num.round(expectedHours, 1));
    });

    it('should parse "12:34:56.789" correctly', () => {
      // Expected values:
      // hours: 12, minutes: 34, seconds: 56, milliseconds: 789
      const expectedMsecs = 12 * 3600000 + 34 * 60000 + 56 * 1000 + 789;
      const expectedSecs = expectedMsecs / 1000;
      const expectedMins = expectedMsecs / 60000;
      const expectedHours = expectedMsecs / 3600000;

      const res = Timestamp.parse('12:34:56.789');
      expect(res.msec).to.eql(expectedMsecs);
      expect(res.sec).to.eql(Num.round(expectedSecs, 1));
      expect(res.min).to.eql(Num.round(expectedMins, 1));
      expect(res.hour).to.eql(Num.round(expectedHours, 1));
    });

    it('should fix single-digit unit values', () => {
      const res = Timestamp.parse('1:2:3.4');
      expect(res.hour).to.eql(1);
      expect(res.min).to.eql(62.1);
      expect(res.sec).to.eql(3723);
      expect(res.msec).to.eql(3723004);
      expect(res.toString()).to.eql('1h');
    });

    describe('errors', () => {
      it('should throw an error for invalid time format with missing parts', () => {
        expect(() => Timestamp.parse('12:34')).to.throw('Invalid time format');
      });

      it('should throw an error for invalid seconds/milliseconds format', () => {
        expect(() => Timestamp.parse('12:34:56')).to.throw('Invalid seconds/milliseconds format');

        // This test expects that an empty millisecond part will eventually result in an invalid number error.
        expect(() => Timestamp.parse('12:34:56.')).to.throw('Invalid number in timestamp');
      });

      it('should throw an error for non-numeric values', () => {
        expect(() => Timestamp.parse('aa:bb:cc.ddd')).to.throw('Invalid number in timestamp');
      });
    });
  });

  describe('parse: timestamp map ← { "HH:MM:SS.mmm": T }', () => {
    it('should return an empty [array] when given an empty object', () => {
      const test = (input?: any) => {
        expect(Timestamp.parse(input)).to.eql([]);
      };
      test({});
      test(undefined);
      test(null);
    });

    it('should ensure "00:00:00.000" entry', () => {
      const a = Timestamp.parse({});
      const b = Timestamp.parse({}, { ensureZero: true });
      expect(a).to.eql([]);

      expect(b.length).to.eql(1);
      expect(b[0].timestamp).to.eql('00:00:00.000');
      expect(b[0].data).to.eql({});
      expect(b[0].total.msec).to.eql(0);
    });

    it('should correctly parse a single timestamp', () => {
      const input: MyTimestamps = {
        '00:01:02.003': { image: 'single' },
      };
      const result = Timestamp.parse(input);
      expect(result).to.have.lengthOf(1);
      const parsed = result[0];

      // The original timestamp should be preserved.
      expect(parsed.timestamp).to.eql('00:01:02.003');

      // Calculate expected parsed values.
      //    For "00:01:02.003":
      //    hours: 0, minutes: 1, seconds: 2, milliseconds: 3
      const expectedMsecs = 0 * 3600000 + 1 * 60000 + 2 * 1000 + 3; // 62003 msecs
      const expectedSecs = expectedMsecs / 1000;
      const expectedMins = expectedMsecs / 60000;
      const expectedHours = expectedMsecs / 3600000;

      expect(parsed.total.msec).to.eql(expectedMsecs);
      expect(parsed.total.sec).to.eql(Num.round(expectedSecs, 1));
      expect(parsed.total.min).to.eql(Num.round(expectedMins, 1));
      expect(parsed.total.hour).to.eql(Num.round(expectedHours, 1));

      // The associated data should be preserved.
      expect(parsed.data).to.eql({ image: 'single' });
    });

    it('should correctly parse and sort multiple timestamps', () => {
      const input: MyTimestamps = {
        '00:00:10.000': { image: 'second' },
        '00:00:15.000': { image: 'third' },
        '00:00:05.000': { image: 'first' },
      };
      const result = Timestamp.parse(input);
      expect(result).to.have.lengthOf(3);

      // Expect the results to be sorted by time in ascending order.
      expect(result[0].timestamp).to.eql('00:00:05.000');
      expect(result[1].timestamp).to.eql('00:00:10.000');
      expect(result[2].timestamp).to.eql('00:00:15.000');

      // Validate the parsed milliseconds for the first timestamp.
      expect(result[0].total.msec).to.eql(5000);
      expect(result[0].data).to.eql({ image: 'first' });
    });

    it('should throw an error if one of the timestamps has an invalid format', () => {
      const input: MyTimestamps = {
        '00:00:05.000': { image: 'first' },
        invalid: { image: 'broken' },
      };
      expect(() => Timestamp.parse(input)).to.throw('Invalid time format');
    });
  });

  describe('find', () => {
    const timestamps: MyTimestamps = {
      '00:00:10.000': { image: 'second' },
      '00:00:15.000': { image: 'third' },
      '00:00:05.000': { image: 'first' },
    };

    it('returns [undefined] if elapsed time is before the first timestamp', () => {
      // Elapsed time of 2 seconds is less than the first timestamp (5 seconds)
      const res = Timestamp.find(timestamps, 2_000);
      expect(res).to.be.undefined;
    });

    it('returns the first timestamp when elapsed equals its time', () => {
      // Elapsed time exactly 5 seconds.
      const res = Timestamp.find(timestamps, 5_000);
      expect(res?.data).to.eql({ image: 'first' });
    });

    it('returns the correct timestamp when elapsed falls between two timestamps', () => {
      // Elapsed time 7 seconds: the only timestamp <= 7 seconds is the first (5 seconds).
      const a = Timestamp.find(timestamps, 7_000);
      expect(a?.data).to.eql({ image: 'first' });

      // Elapsed time 12 seconds: the latest timestamp with time <= 12 seconds is the second (10 seconds).
      const b = Timestamp.find(timestamps, 12_000);
      expect(b?.data).to.eql({ image: 'second' });
    });

    it('returns the last timestamp if elapsed time exceeds all timestamps', () => {
      // Elapsed time 20 seconds: all timestamps are <= 20 seconds, so it returns the last one.
      const res = Timestamp.find(timestamps, 20_000);
      expect(res?.data).to.eql({ image: 'third' });
    });

    it('option: use seconds (instead of milliseconds) as time comparison unit', () => {
      const a = Timestamp.find(timestamps, 12_000);
      const b = Timestamp.find(timestamps, 12, { unit: 'secs' });
      const c = Timestamp.find(timestamps, 12); // expect failure.
      expect(a?.data).to.eql({ image: 'second' });
      expect(a?.data).to.eql(b?.data);
      expect(c).to.not.eql(a);
    });
  });

  describe('isCurrent', () => {
    const timestamps: MyTimestamps = {
      '00:00:00.000': { image: 'image-0.png' },
      '00:00:05.000': { image: 'image-5.png' },
      '00:00:10.000': { image: 'image-10.png' },
    };

    it('should return [false] when current time is before the first timestamp', () => {
      // When current time is less than the first timestamp, no candidate is found.
      expect(Timestamp.isCurrent(timestamps, '00:00:00.000', -1)).to.be.false;
    });

    it('should return [true] when current time equals the first timestamp', () => {
      // currentTime is exactly at the first timestamp.
      expect(Timestamp.isCurrent(timestamps, '00:00:00.000', 0)).to.be.true;
    });

    it('should return [false] if the candidate timestamp does not match the provided timestamp', () => {
      // For currentTime 3 sec, the candidate should be '00:00:00.000', not '00:00:05.000'
      expect(Timestamp.isCurrent(timestamps, '00:00:05.000', 3_000)).to.be.false;
    });

    it('should return [true] when current time exactly matches a later timestamp', () => {
      // For currentTime 5 sec, the candidate should be '00:00:05.000'
      expect(Timestamp.isCurrent(timestamps, '00:00:05.000', 5_000)).to.be.true;
    });

    it('should return [true] when current time is between two timestamps and candidate remains unchanged', () => {
      // For currentTime 7 sec, candidate remains '00:00:05.000'
      expect(Timestamp.isCurrent(timestamps, '00:00:05.000', 7_000)).to.be.true;
    });

    it('should return [false] when the provided timestamp is not present in the timestamps', () => {
      // Provided timestamp does not exist in the timestamps object.
      expect(Timestamp.isCurrent(timestamps, '00:00:20.000', 7_000)).to.be.false;
    });

    it('option: should use seconds (instead of milliseconds) as time comparison unit', () => {
      const a = Timestamp.isCurrent(timestamps, '00:00:05.000', 5_000);
      const b = Timestamp.isCurrent(timestamps, '00:00:05.000', 5, { unit: 'secs' });
      const c = Timestamp.isCurrent(timestamps, '00:00:05.000', 5); // expect failure.
      expect(a).to.be.true;
      expect(b).to.be.true;
      expect(c).to.not.eql(a);
    });
  });

  describe('toString', () => {
    it('should format 0 milliseconds as "00:00:00.000"', () => {
      const ts = Timestamp.parse('00:00:00.000');
      expect(Timestamp.toString(ts)).to.eql('00:00:00.000');
      expect(Timestamp.toString('0:0:0.0')).to.eql('00:00:00.000');
    });

    it('should format 123 milliseconds as "00:00:00.123"', () => {
      const ts = '00:00:00.123';
      expect(Timestamp.toString(ts)).to.eql(ts);
    });

    it('should format 1000 milliseconds as "00:00:01.000"', () => {
      const ts = '00:00:01.000';
      expect(Timestamp.toString(ts)).to.eql(ts);
    });

    it('should format 61234 milliseconds as "00:01:01.234"', () => {
      // 61234 ms = 0 hours, 1 minute, 1 second, 234 ms
      const duration = Time.Duration.create(61234);
      expect(Timestamp.toString(duration)).to.eql('00:01:01.234');
    });

    it('should format a duration with days and hours correctly', () => {
      // Example: 1 day, 7 hours, 6 minutes, 45 seconds, and 123 milliseconds.
      //    1 day  = 86,400,000 ms
      //    7 hours = 7 * 3,600,000 = 25,200,000 ms
      //    6 minutes = 6 * 60,000 = 360,000 ms
      //    45 seconds = 45 * 1,000 = 45,000 ms
      // Total = 86,400,000 + 25,200,000 + 360,000 + 45,000 + 123 = 112,005,123 ms.
      const totalMsec = 112005123;
      const duration = Time.Duration.create(totalMsec);
      expect(Timestamp.toString(duration)).to.eql('31:06:45.123');
    });
  });

  describe('range', () => {
    const timestamps: MyTimestamps = {
      '00:00:10.000': { image: 'second' },
      '00:00:15.000': { image: 'third' },
      '00:00:05.000': { image: 'first' },
    };

    describe('response: undefined', () => {
      it('empty {timestamps}', () => {
        const range = Timestamp.range({}, 0);
        expect(range).to.eql(undefined);
      });

      it('out of range', () => {
        const range = Timestamp.range(timestamps, 99, { unit: 'secs' });
        expect(range).to.eql(undefined);
      });
    });

    describe('create', () => {
      it('from inferred 0-point', () => {
        const range = Timestamp.range(timestamps, 3_000);
        expect(range?.start).to.eql('00:00:00.000');
        expect(range?.end).to.eql('00:00:05.000');
      });

      it('between to timestamps', () => {
        const range = Timestamp.range(timestamps, 6_000);
        expect(range?.start).to.eql('00:00:05.000');
        expect(range?.end).to.eql('00:00:10.000');
      });

      it('from "timestamp" string', () => {
        const range = Timestamp.range(timestamps, '00:00:06.001');
        expect(range?.start).to.eql('00:00:05.000');
        expect(range?.end).to.eql('00:00:10.000');
      });
    });

    describe('progress (percentage)', () => {
      it('should calculate progress correctly at the bounds', () => {
        const res = Timestamp.range(timestamps, 7000);
        expect(res).to.not.be.undefined;
        if (res) {
          // At the start of the range (5000 msec), progress should be 0.
          expect(res.progress(5000)).to.equal(0);
          // At the end of the range (10000 msec), progress should be 1.
          expect(res.progress(10000)).to.equal(1);
        }
      });

      it('should calculate progress correctly for an intermediate value', () => {
        const res = Timestamp.range(timestamps, 7000);
        expect(res).to.not.be.undefined;

        // For a progress time of 7500 msec, progress = (7500 - 5000) / (10000 - 5000) = 0.5
        expect(res?.progress(7500)).to.equal(0.5);
      });

      it('should respect unit conversion for progress calculations', () => {
        // Use seconds instead of milliseconds.
        //    The location is 7 seconds (7000 msec). In the sorted timestamps,
        //    the range remains from 5000 msec to 10000 msec.
        const res = Timestamp.range(timestamps, 7, { unit: 'secs' });
        expect(res).to.not.be.undefined;

        // When passing times in seconds, progress(5) should be calculated as 5000 msec, so progress = 0.
        expect(res?.progress(5, { unit: 'secs' })).to.equal(0);

        // progress(10) (i.e. 10000 msec) should equal 1.
        expect(res?.progress(10, { unit: 'secs' })).to.equal(1);

        // progress(7.5) seconds (7500 msec) should equal 0.5.
        expect(res?.progress(7.5, { unit: 'secs' })).to.equal(0.5);
      });

      it('should round progress correctly when the round option is provided', () => {
        // Use a round option (e.g., 2 decimal places) and choose a time that results in a non-integer fraction.
        const res = Timestamp.range(timestamps, 7000, { round: 2 });
        expect(res).to.not.be.undefined;

        // For a progress time of 6666 msec, the unrounded progress is:
        //    (6666 - 5000) / (10000 - 5000) = 1666 / 5000 ≈ 0.3332
        //    With rounding to 2 decimals, we expect ≈ 0.33.
        const prog = res?.progress(6666);
        expect(prog).to.be.closeTo(0.33, 0.01);
      });
    });
  });
});
