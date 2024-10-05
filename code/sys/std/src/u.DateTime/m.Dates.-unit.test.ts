import { describe, expect, it } from '../-test.ts';

import { Dates, Day } from './mod.ts';
import { StdDate } from './common.ts';
import { Is } from './m.Dates.u.Is.ts';
import { Format } from './m.Date.u.Format.ts';
import * as DateFns from 'date-fns';

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
    it('API', () => {
      expect(Dates.Is).to.equal(Is);
      expect(Is.leapYear).to.equal(StdDate.isLeap);
      expect(Is.leapYearUtc).to.equal(StdDate.isUtcLeap);
    });
  });

  describe('Date.Foramt', () => {
    const date = new Date('2019-03-11T03:24:00');

    it('API', () => {
      expect(Dates.Format).to.equal(Format);
      expect(Format.toString).to.equal(DateFns.format);
      expect(Format.distance).to.equal(DateFns.formatDistance);
      expect(Format.relative).to.equal(DateFns.formatRelative);
      expect(Format.subDays).to.equal(DateFns.subDays);
    });

    it('format (toString)', () => {
      const pattern = `'Today is a' eeee`;
      const a = Dates.format(date, pattern);
      const b = Dates.Format.toString(date, pattern);
      expect(a).to.eql('Today is a Monday');
      expect(a).to.eql(b);
    });

    it('Format.distance | subdays', () => {
      const res = Format.distance(Format.subDays(date, 3), date, { addSuffix: true });
      expect(res).to.eql('3 days ago');
    });

    it.only('Format.relative', () => {
      const res = Format.relative(Format.subDays(date, 3), date);
      expect(res).to.eql('last Friday at 3:24 AM');
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
