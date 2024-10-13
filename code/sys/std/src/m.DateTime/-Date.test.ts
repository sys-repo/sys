import { describe, expect, it } from '../-test.ts';

import * as DateFns from 'date-fns';
import { StdDate } from './common.ts';
import { Format } from './m.Date.Format.ts';
import { Is } from './m.Date.Is.ts';
import { D, Day, Time } from './mod.ts';

describe('Date', () => {
  describe('constants (milliseconds)', () => {
    it('DAY', () => expect(D.DAY).eql(StdDate.DAY));
    it('HOUR', () => expect(D.HOUR).eql(StdDate.HOUR));
    it('MINUTE', () => expect(D.MINUTE).eql(StdDate.MINUTE));
    it('SECOND', () => expect(D.SECOND).eql(StdDate.SECOND));
    it('WEEK', () => expect(D.WEEK).eql(StdDate.WEEK));
  });

  it('API', () => {
    expect(D.parse).to.equal(StdDate.parse);
    expect(D.difference).to.equal(StdDate.difference);
    expect(D.Time).to.equal(Time);
  });

  describe('Day', () => {
    it('API', () => {
      expect(D.Day).to.equal(Day);
      expect(Day.ofYear).to.equal(StdDate.dayOfYear);
      expect(Day.ofYearUtc).to.equal(StdDate.dayOfYearUtc);
    });

    it('Day.ofYear', () => {
      expect(Day.ofYear(new Date('2019-03-11T03:24:00'))).to.eql(70);
    });
  });

  describe('Date.Is', () => {
    it('API', () => {
      expect(D.Is).to.equal(Is);
      expect(Is.leapYear).to.equal(StdDate.isLeap);
      expect(Is.leapYearUtc).to.equal(StdDate.isUtcLeap);
    });
  });

  describe('Date.Foramt', () => {
    const date = new Date('2019-03-11T03:24:00');

    it('API', () => {
      expect(D.Format).to.equal(Format);
      expect(Format.toString).to.equal(DateFns.format);
      expect(Format.distance).to.equal(DateFns.formatDistance);
      expect(Format.relative).to.equal(DateFns.formatRelative);
      expect(Format.subDays).to.equal(DateFns.subDays);
    });

    it('format (toString)', () => {
      const pattern = `'Today is a' eeee`;
      const a = D.format(date, pattern);
      const b = D.Format.toString(date, pattern);
      expect(a).to.eql('Today is a Monday');
      expect(a).to.eql(b);
    });

    it('Format.distance | subdays', () => {
      const res = Format.distance(Format.subDays(date, 3), date, { addSuffix: true });
      expect(res).to.eql('3 days ago');
    });

    it('Format.relative', () => {
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
