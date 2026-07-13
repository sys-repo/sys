import { type t, describe, expect, it } from '../../-test.ts';
import { Crdt } from '../../m.server/common.ts';

describe('CrdtRepo.events.ready$', { sanitizeResources: false, sanitizeOps: false }, () => {
  it('fires prop-change when repo becomes ready', async () => {
    const repo = Crdt.repo();
    const events = repo.events();
    const fired: t.CrdtRepoPropChange[] = [];

    try {
      events.prop$.subscribe((e) => fired.push(e));

      // Initially: not ready.
      expect(repo.status.ready).to.eql(false);

      // Await readiness:
      await repo.whenReady();

      // Repo is now ready.
      expect(repo.status.ready).to.eql(true);

      // Should have fired exactly one "ready" change:
      const readyChanges = fired.filter((c) => c.prop === 'status');
      expect(readyChanges.length).to.eql(1);

      const ev = readyChanges[0];
      expect(ev.before.status.ready).to.eql(false);
      expect(ev.after.status.ready).to.eql(true);

      // Events should not leak methods.
      type T = t.Crdt.Repo['sync'];
      expect((ev.before.sync as T).enable).to.eql(undefined);
      expect((ev.after.sync as T).enable).to.eql(undefined);
    } finally {
      events.dispose();
      await repo.dispose();
    }
  });

  it('emits once and completes', async () => {
    const repo = Crdt.repo();
    const events = repo.events();
    const values: boolean[] = [];
    let completed = false;

    try {
      events.ready$.subscribe({
        next: (v) => values.push(v),
        complete: () => (completed = true),
      });

      await repo.whenReady();

      expect(values).to.eql([true]); //   ← one-shot emission
      expect(completed).to.eql(true); //  ← and it completes
    } finally {
      events.dispose();
      await repo.dispose();
    }
  });
});
