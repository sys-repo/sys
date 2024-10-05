import { describe, expect, it } from '../-test.ts';

import { Dates, Day } from './mod.ts';
import { StdDate } from './common.ts';
import { DateIs } from './m.Dates.Is.ts';

describe('Dates', () => {
  describe('constants (milliseconds)', () => {
    it('DAY', () => expect(Dates.DAY).eql(StdDate.DAY));
    it('HOUR', () => expect(Dates.HOUR).eql(StdDate.HOUR));
    it('MINUTE', () => expect(Dates.MINUTE).eql(StdDate.MINUTE));
    it('SECOND', () => expect(Dates.SECOND).eql(StdDate.SECOND));
    it('WEEK', () => expect(Dates.WEEK).eql(StdDate.WEEK));
  });

  it('API', () => {
    expect(Dates.parse).to.equal(StdDate.parse);
    expect(Dates.difference).to.equal(StdDate.difference);
  });

  describe('Day', () => {
    it('API', () => {
      expect(Dates.Day).to.equal(Day);
      expect(Day.ofYear).to.equal(StdDate.dayOfYear);
      expect(Day.ofYearUtc).to.equal(StdDate.dayOfYearUtc);
    });

    it('Day.ofYear', () => {
      expect(Day.ofYear(new Date('2019-03-11T03:24:00'))).to.eql(70);
    });
  });

  describe('Date.Is', () => {
    const Is = DateIs;
    it('API', () => {
      expect(Dates.Is).to.equal(Is);
      expect(Is.leapYear).to.equal(StdDate.isLeap);
      expect(Is.leapYearUtc).to.equal(StdDate.isUtcLeap);
    });
  });

  describe('StdDate ← @std/datetime', () => {
    /**
     * Tests taken from README: https://jsr.io/@std/datetime
     */
    it('dayOfYear', () => {
      expect(StdDate.dayOfYear(new Date('2019-03-11T03:24:00'))).to.eql(70);
    });

    it('isLeap', () => {
      expect(StdDate.isLeap(1970)).to.eql(false);
      expect(StdDate.isLeap(2020)).to.eql(true);
    });

    it('difference', () => {
      const a = new Date('2018-05-14');
      const b = new Date('2020-05-13');
      expect(StdDate.difference(a, b).years).to.eql(1);
    });

    it('HOUR / MINUTE / SECOND constants', () => {
      expect(StdDate.HOUR / StdDate.MINUTE).to.eql(60);
      expect(StdDate.MINUTE / StdDate.SECOND).to.eql(60);
    });
  });
});
