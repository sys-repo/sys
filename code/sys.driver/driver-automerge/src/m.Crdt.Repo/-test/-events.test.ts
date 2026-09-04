import { describe, expect, it, Rx } from '../../-test.ts';
import { Crdt } from '../../m.server/common.ts';

describe('CrdtRepo.events', () => {
  it('dispose lifecycle', async () => {
    const life = Rx.lifecycle();
    const repo = Crdt.repo();
    const a = repo.events();
    const b = repo.events(life.dispose$);
    const c = repo.events();

    try {
      expect(a.disposed).to.eql(false);
      expect(b.disposed).to.eql(false);
      expect(c.disposed).to.eql(false);

      life.dispose();
      expect(a.disposed).to.eql(false);
      expect(b.disposed).to.eql(true);
      expect(c.disposed).to.eql(false);

      a.dispose();
      expect(a.disposed).to.eql(true);

      await repo.dispose();
      expect(c.disposed).to.eql(true);
    } finally {
      a.dispose();
      b.dispose();
      c.dispose();
      await repo.dispose();
    }
  });
});
