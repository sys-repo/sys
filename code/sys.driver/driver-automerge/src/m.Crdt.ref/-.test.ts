import { Repo } from '@automerge/automerge-repo';

import { type t, c, describe, expect, it, rx } from '../-test.ts';
import { toAutomergeHandle, toRef } from './mod.ts';

describe('CrdtRef', { sanitizeResources: false, sanitizeOps: false }, () => {
  type T = { count: number };

  it('toAutomergeHandle', () => {
    const repo = new Repo();
    const handle = repo.create<T>({ count: 0 });
    const doc = toRef(handle);
    expect(toAutomergeHandle(doc)).to.equal(handle);
    expect(toAutomergeHandle()).to.eql(undefined);
    expect(toAutomergeHandle({} as any)).to.eql(undefined);
  });

  it('create → change → patches (sequence)', () => {
    const repo = new Repo();
    const handle = repo.create<T>({ count: 0 });

    const doc = toRef(handle);
    expect(doc.current).to.eql({ count: 0 });
    expect(typeof doc.instance).to.eql('string');
    expect(doc.disposed).to.eql(false);
    expect(doc.deleted).to.eql(false);

    console.info(c.bold(c.cyan(`\nCrdtRef<T>:\n`)), doc, '\n');

    let patches: t.CrdtPatch[] = [];
    doc.change((d) => (d.count += 1));
    doc.change((d) => (d.count += 1), { patches: (p) => patches.push(...p) });
    doc.change(
      (d) => (d.count += 1),
      (p) => patches.push(...p),
    );

    expect(doc.current.count).to.eql(3);
    expect(patches.length).to.eql(2);

    expect(patches[0].action).to.eql('put');
    expect(patches[1].action).to.eql('put');
    expect(patches[0].path).to.eql(['count']);
    expect(patches[1].path).to.eql(['count']);
  });

  describe('dispose', () => {
    it('disposed from toRef param', () => {
      const life = rx.disposable();
      const repo = new Repo();
      const handle = repo.create<T>({ count: 0 });
      const doc = toRef(handle, life);

      life.dispose();
      expect(doc.disposed).to.eql(true);
    });

    it('does not change after disposal', () => {
      const repo = new Repo();
      const handle = repo.create<T>({ count: 0 });
      const doc = toRef(handle);
      expect(doc.disposed).to.eql(false);
      expect(doc.current).to.eql({ count: 0 });

      doc.dispose();
      expect(doc.disposed).to.eql(true);

      doc.change((d) => (d.count = 1234));
      expect(doc.current).to.eql({ count: 0 });
    });

    it('events do not fire when created after disposal', () => {
      const repo = new Repo();
      const handle = repo.create<T>({ count: 0 });
      const doc = toRef(handle);
      doc.dispose();

      let fired = 0;
      const events = doc.events();
      events.$.subscribe((d) => fired++);
      expect(events.disposed).to.eql(true);

      doc.change((d) => d.count++);
      expect(fired).to.eql(0);
    });
  });
});
