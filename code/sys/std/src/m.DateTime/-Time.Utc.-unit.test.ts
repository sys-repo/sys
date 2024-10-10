import { getUnixTime } from 'date-fns';

import { describe, expect, it } from '../-test.ts';
import { D, Time } from './mod.ts';

describe('Time.utc', () => {
  it('now', () => {
    const utc = Time.utc();
    expect(utc.date).to.eql(new Date(utc.timestamp));
    expect(utc.timestamp).to.eql(new Date(utc.date).getTime());
    expect(utc.unix).to.eql(getUnixTime(utc.date));
  });

  it('from timestamp', () => {
    const now = new Date();
    const utc = Time.utc(now);
    expect(utc.date).to.eql(now);
    expect(utc.timestamp).to.eql(now.getTime());
    expect(utc.unix).to.eql(getUnixTime(now));
  });

  it('from date', () => {
    const now = new Date();
    const utc = Time.utc(now);
    expect(utc.date).to.eql(now);
    expect(utc.timestamp).to.eql(now.getTime());
    expect(utc.unix).to.eql(getUnixTime(now));
  });
});

describe.only('Time.now', () => {
  it('now', () => {
    const d = new Date();
    const dt = d.getTime();
    const utc = Time.now;
    expect(utc.date.getTime()).to.be.within(dt - 10, dt + 10);
    expect(utc.timestamp).to.be.within(dt - 10, dt + 10);
    expect(utc.unix).to.eql(getUnixTime(d));
  });

  it('now.format()', () => {
    const template = 'yy-MM-dd';
    const now = Time.now;
    const res = now.format(template);
    expect(res).to.eql(D.format(now.date, template));
  });
});
