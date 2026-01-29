import { describe, expect, it } from '../../../-test.ts';
import { CrdtDocSchema } from '../u.schema.ts';

describe('CrdtDocSchema', () => {
  it('validates a minimal doc', () => {
    const res = CrdtDocSchema.validate({ id: 'pz1U8r3FH2ubPjnBzTMtFB8Yaaw' });
    expect(res.ok).to.eql(true);
  });

  it('rejects invalid id', () => {
    const res = CrdtDocSchema.validate({ id: 'nope' });
    expect(res.ok).to.eql(false);
  });
});
