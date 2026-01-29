import { describe, expect, it } from '../../../-test.ts';
import { CrdtRepoSchema } from '../u.schema.ts';

describe('CrdtRepoSchema', () => {
  it('validates a minimal repo', () => {
    const res = CrdtRepoSchema.validate({ sync: [] });
    expect(res.ok).to.eql(true);
  });

  it('initial includes default ports', () => {
    const doc = CrdtRepoSchema.initial();
    expect(doc.ports).to.eql({ repo: 49494, sync: 3030 });
  });
});
