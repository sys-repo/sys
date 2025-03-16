import { describe, expect, it } from '../-test.ts';
import { Num } from '../m.Value.Num/mod.ts';
import { Timestamp } from './mod.ts';

describe('Timestamp', () => {
  describe('parseTime', () => {
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
});
