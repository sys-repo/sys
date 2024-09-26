import { describe, expect, it } from '../-test.ts';

import { DateTime } from '../mod.ts';
import { dayOfYear, difference, HOUR, isLeap, MINUTE, SECOND } from './mod.ts';

describe('DateTime ← "@std/datetime"', () => {
  it('DateTime (lib)', () => {
    expect(DateTime.dayOfYear).to.equal(dayOfYear);
    expect(DateTime.isLeap).to.equal(isLeap);
    expect(DateTime.difference).to.equal(difference);
    expect(DateTime.HOUR).to.equal(HOUR);
    expect(DateTime.MINUTE).to.equal(MINUTE);
    expect(DateTime.SECOND).to.equal(SECOND);
  });

  /**
   * Tests taken from README: https://jsr.io/@std/datetime
   */
  it('dayOfYear', () => {
    expect(dayOfYear(new Date('2019-03-11T03:24:00'))).to.eql(70);
  });

  it('isLeap', () => {
    expect(isLeap(1970)).to.eql(false);
    expect(isLeap(2020)).to.eql(true);
  });

  it('difference', () => {
    const a = new Date('2018-05-14');
    const b = new Date('2020-05-13');
    expect(difference(a, b).years).to.eql(1);
  });

  it('HOUR / MINUTE / SECOND constants', () => {
    expect(HOUR / MINUTE).to.eql(60);
    expect(MINUTE / SECOND).to.eql(60);
  });
});
