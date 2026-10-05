import { describe, expect, it } from '../../../-test.ts';
import { Is } from '../m.Is.ts';
import { Range } from '../m.Range.ts';
import { Percent } from '../mod.ts';

describe('Num.Percent', () => {
  it('API', () => {
    expect(Percent.Is).to.equal(Is);
    expect(Percent.Range).to.equal(Range);
  });

  it('toString', () => {
    expect(Percent.toString()).to.eql('0%');
    expect(Percent.toString(0)).to.eql('0%');
    expect(Percent.toString(0.123)).to.eql('12%');
    expect(Percent.toString(1)).to.eql('100%');
  });
});
