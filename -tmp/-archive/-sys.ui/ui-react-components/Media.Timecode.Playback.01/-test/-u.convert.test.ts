import { type t, describe, it, expect } from '../../../-test.ts';
import { Convert } from '../u.convert.ts';

describe('Convert', () => {
  it('toSecs: basics', () => {
    const ms0 = 0 as t.Msecs;
    const ms1500 = 1500 as t.Msecs;

    expect(Convert.toSecs(ms0)).to.eql(0);
    expect(Convert.toSecs(ms1500)).to.eql(1.5);
  });

  it('toMsecs: basics', () => {
    const s0 = 0 as t.Secs;
    const s15 = 1.5 as t.Secs;

    expect(Convert.toMsecs(s0)).to.eql(0);
    expect(Convert.toMsecs(s15)).to.eql(1500);
  });

  it('toMsecs: rounding law (Math.round)', () => {
    const sLow = 0.0004 as t.Secs;
    const sHalf = 0.0005 as t.Secs;

    expect(Convert.toMsecs(sLow)).to.eql(0);
    expect(Convert.toMsecs(sHalf)).to.eql(1);
  });

  it('non-finite clamps to 0', () => {
    const msInf = Number.POSITIVE_INFINITY as unknown as t.Msecs;
    const sNaN = Number.NaN as unknown as t.Secs;

    expect(Convert.toSecs(msInf)).to.eql(0);
    expect(Convert.toMsecs(sNaN)).to.eql(0);
  });
});
