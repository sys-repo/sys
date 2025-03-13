import { type t, describe, expect, it } from '../../-test.ts';
import { parseTime, findTimestamp } from './u.ts';

describe('Thumnails (Timestamps)', () => {
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
});
