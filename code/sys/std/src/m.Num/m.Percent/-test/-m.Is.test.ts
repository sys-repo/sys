import { describe, expect, it } from '../../../-test.ts';
import { Is } from '../m.Is.ts';

describe('Num.Percent.Is', () => {
  it('percent', () => {
    expect(Is.percent(0)).to.eql(true);
    expect(Is.percent(0.123)).to.eql(true);
    expect(Is.percent(1)).to.eql(true);

    expect(Is.percent(-1)).to.eql(false);
    expect(Is.percent(2)).to.eql(false);
    expect(Is.percent(Number.NaN)).to.eql(false);
    expect(Is.percent('0.5')).to.eql(false);
  });

  it('pixels', () => {
    expect(Is.pixels(-1)).to.eql(false);
    expect(Is.pixels(0)).to.eql(false);
    expect(Is.pixels(0.123)).to.eql(false);
    expect(Is.pixels(1)).to.eql(false);

    expect(Is.pixels(1.1)).to.eql(true);
    expect(Is.pixels(2)).to.eql(true);

    expect(Is.pixels(Number.NaN)).to.eql(false);
    expect(Is.pixels('2')).to.eql(false);
  });
});
