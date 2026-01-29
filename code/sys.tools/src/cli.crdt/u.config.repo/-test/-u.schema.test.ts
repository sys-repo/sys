import { describe, expect, it } from '../../../-test.ts';
import { CrdtRepoSchema } from '../u.schema.ts';

describe('CrdtRepoSchema', () => {
  it('validates a minimal repo', () => {
    const res = CrdtRepoSchema.validate({ sync: [] });
    expect(res.ok).to.eql(true);
  });

  it('normalizes enabled defaults', () => {
    const doc = CrdtRepoSchema.normalize({ sync: [{ endpoint: 'localhost:3030' }] });
    expect(doc.sync).to.eql([{ endpoint: 'localhost:3030', enabled: true }]);
  });

  it('initial includes default ports', () => {
    const doc = CrdtRepoSchema.initial();
    expect(doc.ports).to.eql({ repo: 49494, sync: 3030 });
  });
});
