import { describe, expect, it, rx, type t } from '../../-test.ts';
import { testSetup, type D } from './-TEST.u.ts';

describe(
  'Doc.Events',

  /**
   * NOTE: The upstream [automerge-repo] library leaks timers.
   *       Waiting on this final test, with [sanitizeOps:false] prevents
   *       the entire suite failing because of these leaked timers.
   */
  { sanitizeResources: false, sanitizeOps: false },

  () => {
    const { store, factory } = testSetup();

    describe('lifecycle', () => {
      it('multiple instances', async () => {
        const doc = await factory();
        const events1 = doc.events();
        const events2 = doc.events();
        expect(events1).to.not.equal(events2);
      });

      describe('dispose', () => {
        it('via .dispose()', async () => {
          const doc = await factory();
          const events = doc.events();
          let fired = 0;
          events.dispose$.subscribe(() => fired++);

          expect(events.disposed).to.eql(false);
          events.dispose();
          events.dispose();
          expect(events.disposed).to.eql(true);
          expect(fired).to.eql(1);
        });

        it('via { dispose$ }', async () => {
          const doc = await factory();
          const dispose$ = new rx.Subject<void>();
          const events = doc.events(dispose$);

          let fired = 0;
          events.dispose$.subscribe(() => fired++);

          expect(events.disposed).to.eql(false);
          dispose$.next();
          dispose$.next();
          expect(events.disposed).to.eql(true);
          expect(fired).to.eql(1);
        });

        it('when parent store is disposed', async () => {
          const { store, factory } = testSetup();
          const doc = await factory();
          const events = doc.events();
          let fired = 0;
          events.dispose$.subscribe(() => fired++);

          expect(store.disposed).to.eql(false);
          expect(events.disposed).to.eql(false);
          store.dispose();

          expect(store.disposed).to.eql(true);
          expect(events.disposed).to.eql(true);
          expect(fired).to.eql(1);
        });
      });
    });

    describe('changed$', () => {
      it('fires', async () => {
        const doc = await factory();
        const events = doc.events();

        const fired: t.DocChanged<D>[] = [];
        events.changed$.subscribe((e) => fired.push(e));

        const increment = () => doc.change((d) => (d.count += 1));
        increment();
        expect(doc.current.count).to.eql(1);
        expect(fired.length).to.eql(1);

        const e = fired[0];
        expect(e.uri).to.eql(doc.uri);
        expect(e.after).to.eql(doc.current);
        expect(e.patches.length).to.eql(1);
        expect(e.patches[0].action).to.eql('put');
        expect(e.source).to.eql('change');
        expect(e.before.count).to.eql(0);
        expect(e.after.count).to.eql(1);

        events.dispose();
        increment();
        increment();
        expect(fired.length).to.eql(1); // NB: no change after dispose.
      });

      it('does not fire when value not updated', async () => {
        const doc = await factory();
        const events = doc.events();

        const fired: t.DocChanged<D>[] = [];
        events.changed$.subscribe((e) => fired.push(e));

        doc.change(() => {}); // NB: no adjustments made
        expect(fired.length).to.eql(0);

        doc.change((d) => (d.msg = 'foo'));
        expect(fired.length).to.eql(1);

        events.dispose();
      });
    });

    describe('deleted$', () => {
      it('deleted$ ← via [store.doc.delete]', async () => {
        const doc = await factory();
        const events = doc.events();

        doc.change((d) => (d.count += 5));
        expect(doc.current.count).to.eql(5);

        const fired: t.DocDeleted<D>[] = [];
        events.deleted$.subscribe((e) => fired.push(e));

        expect(await store.doc.exists(doc.uri)).to.eql(true);
        await store.doc.delete(doc.uri);
        expect(await store.doc.exists(doc.uri, { timeout: 10 })).to.eql(false);

        expect(fired.length).to.eql(1);
        expect(fired[0].uri).to.eql(doc.uri);
        expect(fired[0].doc.count).to.eql(5);

        events.dispose();
      });

      it('deleted$ ← via [repo.delete]', async () => {
        const doc = await factory();
        const events = doc.events();
        doc.change((d) => (d.count += 5));

        const fired: t.DocDeleted<D>[] = [];
        events.deleted$.subscribe((e) => fired.push(e));

        expect(await store.doc.exists(doc.uri)).to.eql(true);
        store.repo.delete(doc.uri as t.AutomergeUrl);
        expect(await store.doc.exists(doc.uri, { timeout: 10 })).to.eql(false);

        expect(fired.length).to.eql(1);
        expect(fired[0].uri).to.eql(doc.uri);
        expect(fired[0].doc.count).to.eql(5);

        events.dispose();
      });
    });

    it('|test.dispose|', () => store.dispose());
  },
);
