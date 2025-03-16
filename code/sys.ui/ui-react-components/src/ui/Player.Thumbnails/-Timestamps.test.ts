import { type t, describe, expect, it } from '../../-test.ts';
import { findTimestamp, isCurrentTimestamp, parseTime, parseTimes } from './u.ts';

/**
 * TODO 🐷
 * rewrite to: @sys/std/Timestamp
 */
describe('Timestamps', () => {
  describe('parseTime', () => {
    it('should parse "00:00:00.000" as 0 msecs and 0 secs', () => {
      const res = parseTime('00:00:00.000');
      expect(res.msecs).to.eql(0);
      expect(res.secs).to.eql(0);
      expect(res.hours).to.eql(0);
      expect(res.mins).to.eql(0);
    });

    it('should parse "01:02:03.004" correctly', () => {
      // Expected values:
      // hours: 1, minutes: 2, seconds: 3, milliseconds: 4
      const expectedMsecs = 1 * 3600000 + 2 * 60000 + 3 * 1000 + 4; // 3,723,004 msecs
      const expectedSecs = expectedMsecs / 1000; // 3,723.004 secs
      const expectedMins = expectedMsecs / 60000; // 62.05006666666667 mins
      const expectedHours = expectedMsecs / 3600000; // 1.0341677777777778 hours

      const result = parseTime('01:02:03.004');
      expect(result.msecs).to.eql(expectedMsecs);
      expect(result.secs).to.eql(expectedSecs);
      expect(result.mins).to.eql(expectedMins);
      expect(result.hours).to.eql(expectedHours);
    });

    it('should parse "12:34:56.789" correctly', () => {
      // Expected values:
      // hours: 12, minutes: 34, seconds: 56, milliseconds: 789
      const expectedMsecs = 12 * 3600000 + 34 * 60000 + 56 * 1000 + 789;
      const expectedSecs = expectedMsecs / 1000;
      const expectedMins = expectedMsecs / 60000;
      const expectedHours = expectedMsecs / 3600000;

      const result = parseTime('12:34:56.789');
      expect(result.msecs).to.eql(expectedMsecs);
      expect(result.secs).to.eql(expectedSecs);
      expect(result.mins).to.eql(expectedMins);
      expect(result.hours).to.eql(expectedHours);
    });

    describe('errors', () => {
      it('should throw an error for invalid time format with missing parts', () => {
        expect(() => parseTime('12:34')).to.throw('Invalid time format');
      });

      it('should throw an error for invalid seconds/milliseconds format', () => {
        expect(() => parseTime('12:34:56')).to.throw('Invalid seconds/milliseconds format');

        // This test expects that an empty millisecond part will eventually result in an invalid number error.
        expect(() => parseTime('12:34:56.')).to.throw('Invalid number in timestamp');
      });

      it('should throw an error for non-numeric values', () => {
        expect(() => parseTime('aa:bb:cc.ddd')).to.throw('Invalid number in timestamp');
      });
    });
  });

  describe('parseTimes', () => {
    it('should return an empty array when given an empty object', () => {
      const test = (input?: any) => {
        const a = parseTimes(input);
        expect(a).to.be.an('array').that.is.empty;
      };
      test({});
      ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []].forEach(test);
    });

    it('should correctly parse a single timestamp', () => {
      const input: t.VideoTimestamps = {
        '00:01:02.003': { image: 'single' },
      };
      const result = parseTimes(input);
      expect(result).to.have.lengthOf(1);
      const parsed = result[0];

      // The original timestamp should be preserved.
      expect(parsed.timestamp).to.eql('00:01:02.003');

      // Calculate expected parsed values.
      //  For "00:01:02.003":
      //  hours: 0, minutes: 1, seconds: 2, milliseconds: 3
      const expectedMsecs = 0 * 3600000 + 1 * 60000 + 2 * 1000 + 3; // 62003 msecs
      const expectedSecs = expectedMsecs / 1000;
      const expectedMins = expectedMsecs / 60000;
      const expectedHours = expectedMsecs / 3600000;

      expect(parsed.total.msecs).to.eql(expectedMsecs);
      expect(parsed.total.secs).to.eql(expectedSecs);
      expect(parsed.total.mins).to.eql(expectedMins);
      expect(parsed.total.hours).to.eql(expectedHours);

      // The associated data should be preserved.
      expect(parsed.data).to.deep.equal({ image: 'single' });
    });

    it('should correctly parse and sort multiple timestamps', () => {
      const input: t.VideoTimestamps = {
        '00:00:10.000': { image: 'second' },
        '00:00:15.000': { image: 'third' },
        '00:00:05.000': { image: 'first' },
      };
      const result = parseTimes(input);
      expect(result).to.have.lengthOf(3);

      // Expect the results to be sorted by time in ascending order.
      expect(result[0].timestamp).to.eql('00:00:05.000');
      expect(result[1].timestamp).to.eql('00:00:10.000');
      expect(result[2].timestamp).to.eql('00:00:15.000');

      // Validate the parsed milliseconds for the first timestamp.
      expect(result[0].total.msecs).to.eql(5000);
      expect(result[0].data).to.deep.equal({ image: 'first' });
    });

    it('should throw an error if one of the timestamps has an invalid format', () => {
      const input: t.VideoTimestamps = {
        '00:00:05.000': { image: 'first' },
        invalid: { image: 'broken' },
      };
      expect(() => parseTimes(input)).to.throw('Invalid time format');
    });
  });

  describe('findTimestamp', () => {
    const timestamps: t.VideoTimestamps = {
      '00:00:10.000': { image: 'second' },
      '00:00:15.000': { image: 'third' },
      '00:00:05.000': { image: 'first' },
    };

    it('should return [undefined] if elapsed time is before the first timestamp', () => {
      // Elapsed time of 2 seconds is less than the first timestamp (5 seconds)
      const res = findTimestamp(timestamps, 2);
      expect(res).to.be.undefined;
    });

    it('should return the first timestamp when elapsed equals its time', () => {
      // Elapsed time exactly 5 seconds.
      const res = findTimestamp(timestamps, 5);
      expect(res).to.deep.equal({ image: 'first' });
    });

    it('should return the correct timestamp when elapsed falls between two timestamps', () => {
      // Elapsed time 7 seconds: the only timestamp <= 7 seconds is the first (5 seconds).
      const a = findTimestamp(timestamps, 7);
      expect(a).to.deep.equal({ image: 'first' });

      // Elapsed time 12 seconds: the latest timestamp with time <= 12 seconds is the second (10 seconds).
      const b = findTimestamp(timestamps, 12);
      expect(b).to.deep.equal({ image: 'second' });
    });

    it('should return the last timestamp if elapsed time exceeds all timestamps', () => {
      // Elapsed time 20 seconds: all timestamps are <= 20 seconds, so it returns the last one.
      const res = findTimestamp(timestamps, 20);
      expect(res).to.deep.equal({ image: 'third' });
    });
  });

  describe('isCurrentTimestamp', () => {
    const timestamps: t.VideoTimestamps = {
      '00:00:00.000': { image: 'image-0.png' },
      '00:00:05.000': { image: 'image-5.png' },
      '00:00:10.000': { image: 'image-10.png' },
    };

    it('should return [false] when current time is before the first timestamp', () => {
      // When current time is less than the first timestamp, no candidate is found.
      const currentTime: t.Secs = -1;
      expect(isCurrentTimestamp(currentTime, '00:00:00.000', timestamps)).to.be.false;
    });

    it('should return [true] when current time equals the first timestamp', () => {
      // currentTime is exactly at the first timestamp.
      const currentTime: t.Secs = 0;
      expect(isCurrentTimestamp(currentTime, '00:00:00.000', timestamps)).to.be.true;
    });

    it('should return [false] if the candidate timestamp does not match the provided timestamp', () => {
      // For currentTime 3 sec, the candidate should be '00:00:00.000', not '00:00:05.000'
      const currentTime: t.Secs = 3;
      expect(isCurrentTimestamp(currentTime, '00:00:05.000', timestamps)).to.be.false;
    });

    it('should return [true] when current time exactly matches a later timestamp', () => {
      // For currentTime 5 sec, the candidate should be '00:00:05.000'
      const currentTime: t.Secs = 5;
      expect(isCurrentTimestamp(currentTime, '00:00:05.000', timestamps)).to.be.true;
    });

    it('should return [true] when current time is between two timestamps and candidate remains unchanged', () => {
      // For currentTime 7 sec, candidate remains '00:00:05.000'
      const currentTime: t.Secs = 7;
      expect(isCurrentTimestamp(currentTime, '00:00:05.000', timestamps)).to.be.true;
    });

    it('should return [false] when the provided timestamp is not present in the timestamps', () => {
      // Provided timestamp does not exist in the timestamps object.
      const currentTime: t.Secs = 7;
      expect(isCurrentTimestamp(currentTime, '00:00:20.000', timestamps)).to.be.false;
    });
  });
});
