import { describe, expect, it } from '../-test.ts';

import { DateTime } from '../mod.ts';
// import { dayOfYear, difference, HOUR, isLeap, MINUTE, SECOND } from './mod.ts';

describe('DateTime ← "@std/datetime"', () => {
  /**
   * Tests taken from README: https://jsr.io/@std/datetime
   */
  it('dayOfYear', () => {
    expect(DateTime.dayOfYear(new Date('2019-03-11T03:24:00'))).to.eql(70);
  });

  it('isLeap', () => {
    expect(DateTime.isLeap(1970)).to.eql(false);
    expect(DateTime.isLeap(2020)).to.eql(true);
  });

  it('difference', () => {
    const a = new Date('2018-05-14');
    const b = new Date('2020-05-13');
    expect(DateTime.difference(a, b).years).to.eql(1);
  });

  it('HOUR / MINUTE / SECOND constants', () => {
    expect(DateTime.HOUR / DateTime.MINUTE).to.eql(60);
    expect(DateTime.MINUTE / DateTime.SECOND).to.eql(60);
  });
});
