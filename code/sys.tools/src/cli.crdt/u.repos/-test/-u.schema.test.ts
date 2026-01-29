import { describe, expect, it } from '../../../-test.ts';
import { CrdtRepoSchema } from '../u.schema.ts';

describe('CrdtRepoSchema', () => {
  it('validates a minimal repo', () => {
    const res = CrdtRepoSchema.validate({ sync: [] });
    expect(res.ok).to.eql(true);
  });
});
