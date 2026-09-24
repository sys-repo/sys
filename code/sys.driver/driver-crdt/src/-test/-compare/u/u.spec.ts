import { Lens } from '@sys/immutable/core';
import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Err, Immutable, Obj, type t } from '../common.ts';
import { openComparison } from './u.client.ts';

/** Same schemas and transport-legal schedules; native outcomes are not normalized into parity. */
export function comparison(spec: t.Specimen) {
  const open = () => openComparison(spec.worker, spec.replica);
  describe(`${spec.name} mutation paths | callback location, authored basis and owner acceptance`, () => {
    it('A / held stale index → explicit rejection returns the captured intent, not a wrong-target write', async () => {
      await using rig = await open();
      const client = await rig.connect('async-owner');
      const observer = await rig.connect('async-owner');
      const retained = client.view.current;
      const basis = client.snapshot.basis;
      await rig.control.send('hold', {});
      client.holdObservations();
      rig.peer.author((edit) => edit.insertItem(0, { id: 'X', label: 'Peer prefix' }));
      await rig.control.send('peer', { binary: rig.peer.save() });
      expect(observer.view.current.items.map((item) => item.id)).to.eql(['X', 'A', 'B']);
      expect(client.view.current).to.equal(retained);
      const pending = client.write({
        kind: 'label-index',
        index: 1,
        basis,
        value: 'Captured here',
      });
      await rig.control.send('arrived', {});
      expect((await rig.control.send('read', {})).snapshot.value.items[2].label).to.equal('Beta');
      await rig.control.send('release', {});
      const receipt = await pending;
      expect(receipt.accepted).to.equal(false);
      expect(receipt.reason).to.equal('stale-basis');
      expect(receipt.intent).to.eql({
        kind: 'label-index',
        index: 1,
        basis,
        value: 'Captured here',
      });
      expect(client.view.current).to.equal(retained);
      client.releaseObservations();
      expect(client.view.current.items.map((item) => item.label)).to.eql([
        'Peer prefix',
        'Alpha',
        'Beta',
      ]);
      expect(retained.items.map((item) => item.id)).to.eql(['A', 'B']);
      console.info('A positional:', client.trace);
    });

    it('A / held identity-addressed data → installed owner author edits B without claiming a transported callback', async () => {
      await using rig = await open();
      const client = await rig.connect('async-owner');
      const observer = await rig.connect('async-owner');
      const basis = client.view.current;
      const captured = 'Caller value';
      let callerEffects = 0;
      expect(client.ref).to.equal(undefined);
      expect(() =>
        client.transact(() => {
          callerEffects += 1;
        })
      ).to.throw('Async owner');
      expect(callerEffects).to.equal(0);
      await rig.control.send('hold', {});
      client.holdObservations();
      rig.peer.author((edit) => edit.insertItem(0, { id: 'X', label: 'Peer prefix' }));
      await rig.control.send('peer', { binary: rig.peer.save() });
      const pending = client.write({ kind: 'label-id', id: basis.items[1].id, value: captured });
      await rig.control.send('arrived', {});
      expect(client.view.current).to.equal(basis);
      await rig.control.send('release', {});
      const receipt = await pending;
      expect(receipt.accepted).to.equal(true);
      expect(receipt.callback).to.equal('owner');
      expect(receipt.frame.snapshot.value.items.map((item) => item.label)).to.eql([
        'Peer prefix',
        'Alpha',
        captured,
      ]);
      expect(observer.view.current).to.eql(receipt.frame.snapshot.value);
      // Ack means owner application; held client observation has not applied it.
      expect(client.view.current).to.equal(basis);
      expect(client.heldObservations).to.equal(2);
      client.releaseObservations();
      expect(client.view.current).to.eql(observer.view.current);
      expect(callerEffects).to.equal(0);
      expect(client.trace).to.include('receipt:accepted');
      expect(client.trace).to.include('observation:applied:2');
      expect(client.trace.indexOf('receipt:accepted')).to.be.lessThan(
        client.trace.indexOf('observation:applied:2'),
      );
      console.info('A ID-addressed:', client.trace);
    });

    it('B / held stale view → synchronous caller author preserves native B before worker acceptance', async () => {
      await using rig = await open();
      const client = await rig.connect('native-replica');
      const observer = await rig.connect('async-owner');
      expect(new Set([rig.initial.writer, rig.peer.writer, client.writer]).size).to.equal(3);
      const retained = client.view.current;
      const callerTrace: string[] = [];
      const events = client.view.events();
      events.$.subscribe(() => callerTrace.push('event'));
      try {
        await rig.control.send('hold', {});
        client.holdObservations();
        rig.peer.author((edit) => edit.insertItem(0, { id: 'X', label: 'Peer prefix' }));
        await rig.control.send('peer', { binary: rig.peer.save() });
        const captured = 'Authored against retained B';
        if (spec.draftRef) {
          if (!client.ref) throw Err.std('Expected an Automerge writable ref.');
          const result = client.ref.change((draft) => {
            callerTrace.push('callback');
            draft.items[1].label = captured;
          }, (patches) => {
            callerTrace.push('patches');
            expect(patches).to.eql([{ op: 'replace', path: '/items/1/label', value: captured }]);
            expect(client.view.current.items[1].label).to.equal(captured);
          });
          expectTypeOf(result).toEqualTypeOf<void>();
          expect(result).to.equal(undefined);
          callerTrace.push('returned');
          expect(callerTrace).to.eql(['callback', 'patches', 'event', 'returned']);
        } else {
          expect(client.ref).to.equal(undefined);
          client.transact((edit) => {
            callerTrace.push('callback');
            edit.label(1, captured);
          });
          callerTrace.push('returned');
          expect(callerTrace).to.eql(['callback', 'event', 'returned']);
        }
        expect(client.view.current.items.map((item) => item.id)).to.eql(['A', 'B']);
        expect(client.view.current.items[1].label).to.equal(captured);
        expect(retained.items[1].label).to.equal('Beta');
        await rig.control.send('arrived', {});
        expect((await rig.control.send('read', {})).snapshot.value.items[2].label).to.equal('Beta');
        expect(client.trace).not.to.include('receipt:accepted');
        await rig.control.send('release', {});
        const [receipt] = await client.settle();
        expect(receipt.accepted).to.equal(true);
        expect(receipt.callback).to.equal('caller');
        expect(observer.view.current.items.map((item) => item.label)).to.eql([
          'Peer prefix',
          'Alpha',
          captured,
        ]);
        expect(client.view.current.items.map((item) => item.id)).to.eql(['A', 'B']);
        client.releaseObservations();
        expect(client.view.current).to.eql(observer.view.current);
        expect(client.snapshot.basis).to.equal(receipt.frame.snapshot.basis);
        console.info('B local:', callerTrace, 'delivery:', client.trace);
      } finally {
        events.dispose();
      }
    });

    for (const mode of ['async-owner', 'native-replica'] as const) {
      it(`${mode} / title plus format → one coherent observation, with retained native context`, async () => {
        await using rig = await open();
        const client = await rig.connect(mode);
        const before = client.snapshot;
        const changes: t.Change[] = [];
        const events = client.view.events();
        events.$.subscribe((event) => changes.push(event));
        try {
          if (mode === 'async-owner') {
            const pending = client.write({ kind: 'compose', title: 'Composed', bold: true });
            expect(client.snapshot).to.equal(before);
            await pending;
          } else {
            if (spec.composeDraft) {
              if (!client.ref) throw Err.std('Native draft extension requires the writable ref.');
              client.ref.change((draft) => spec.composeDraft?.(draft, 'Composed'));
            } else {
              client.transact((edit) => {
                edit.title('Composed');
                edit.format(0, 1, true);
              });
            }
            expect(client.view.current.title).to.equal('Composed');
            expect(client.snapshot.metadata).to.eql(spec.formatted);
            await client.settle();
          }
          expect(changes.length).to.equal(1);
          expect(changes[0].after.title).to.equal('Composed');
          expect(changes[0].native.after.metadata).to.eql(spec.formatted);
          expect(changes[0].native.before).to.eql(before);
          expect(changes[0].patches).to.eql([{ op: 'replace', path: '/title', value: 'Composed' }]);
          expect(client.trace).to.include('observation:applied:1');
          expect(client.trace).to.include('receipt:accepted');
          expect(client.trace.indexOf('observation:applied:1')).to.be.lessThan(
            client.trace.indexOf('receipt:accepted'),
          );
          const after = client.snapshot;
          rig.peer.author((edit) => edit.insertText(0, 'X'));
          await rig.control.send('peer', { binary: rig.peer.save() });
          expect(client.view.current.text).to.equal('Xac');
          expect(client.snapshot.selection).to.eql([1, 2]);
          expect(before.value.title).to.equal('Note');
          expect(after.value.text).to.equal('ac');
          expect(after.metadata).to.eql(spec.formatted);
          expect(changes[0].native.after).to.eql(after);
        } finally {
          events.dispose();
        }
      });

      it(`${mode} / metadata-only and delete-only → native basis changes cannot disappear behind equal values`, async () => {
        await using rig = await open();
        const client = await rig.connect(mode);
        const before = client.snapshot;
        const changes: t.Change[] = [];
        let textPaths = 0;
        const events = client.view.events();
        events.$.subscribe((event) => changes.push(event));
        events.path(['text']).$.subscribe(() => {
          textPaths += 1;
        });
        try {
          if (mode === 'async-owner') await client.write({ kind: 'format', bold: true });
          else {
            client.transact((edit) => edit.format(0, 1, true));
            await client.settle();
          }
          expect(changes.length).to.equal(1);
          expect(changes[0].before).to.eql(changes[0].after);
          expect(changes[0].patches).to.eql([]);
          expect(changes[0].native.after.metadata).to.eql(spec.formatted);
          expect(client.snapshot.basis).not.to.equal(before.basis);
          // Value-path subscriptions are intentionally not native annotation-path subscriptions.
          expect(textPaths).to.equal(0);
          const marked = client.snapshot;
          if (mode === 'async-owner') await client.write({ kind: 'delete-text' });
          else {
            client.transact((edit) => edit.deleteText(0, 1));
            await client.settle();
          }
          expect(client.snapshot.basis).not.to.equal(marked.basis);
          expect(client.view.current.text).to.equal('c');
          expect(textPaths).to.equal(1);
          expect(marked.metadata).to.eql(spec.formatted);
        } finally {
          events.dispose();
        }
      });

      it(`${mode} / dispose one event view and then one client → surviving observer and owner remain usable`, async () => {
        await using rig = await open();
        const client = await rig.connect(mode);
        const survivor = await rig.connect('async-owner');
        const instance = client.view.instance;
        const retired = client.view.events();
        const active = client.view.events();
        let retiredCount = 0;
        const titles: string[] = [];
        retired.$.subscribe(() => {
          retiredCount += 1;
        });
        active.path(['title']).$.subscribe((event) => titles.push(event.after.title));
        retired.dispose();
        expect(retired.disposed).to.equal(true);
        try {
          if (mode === 'async-owner') {
            await client.write({ kind: 'compose', title: 'Observed', bold: true });
          } else {
            client.transact((edit) => edit.title('Observed'));
            await client.settle();
          }
          expect(retiredCount).to.equal(0);
          expect(titles).to.eql(['Observed']);
          expect(client.view.instance).to.equal(instance);
          await client.dispose();
          expect(active.disposed).to.equal(true);
          const settled = await survivor.write({
            kind: 'compose',
            title: 'Owner survives',
            bold: false,
          });
          expect(settled.accepted).to.equal(true);
          expect(survivor.view.current.title).to.equal('Owner survives');
          expect((await rig.control.send('read', {})).snapshot.value.title).to.equal(
            'Owner survives',
          );
          expect(titles).to.eql(['Observed']);
        } finally {
          active.dispose();
          retired.dispose();
        }
      });
    }

    it('B / rejected E1 followed by accepted dependent E2 → full native submission reintroduces rejected history', async () => {
      await using rig = await open();
      const client = await rig.connect('native-replica');
      await rig.control.send('admission', { allow: false });
      client.transact((edit) => {
        edit.title('Rejected E1');
        edit.insertItem(0, { id: 'Q', label: 'Created by E1' });
      });
      const [rejected] = await client.settle();
      expect(rejected.accepted).to.equal(false);
      expect(rejected.reason).to.equal('policy');
      expect(rejected.frame.snapshot.value.title).to.equal('Note');
      expect(client.view.current.title).to.equal('Rejected E1');
      await rig.control.send('admission', { allow: true });
      client.transact((edit) => edit.label(0, 'E2 depends on Q'));
      const [, accepted] = await client.settle();
      expect(accepted.accepted).to.equal(true);
      expect(accepted.frame.snapshot.value.title).to.equal('Rejected E1');
      expect(accepted.frame.snapshot.value.items[0]).to.eql({ id: 'Q', label: 'E2 depends on Q' });
      console.info('B limitation: rejecting one submission does not quarantine its native history');
    });

    it('B / reentrant author → explicit rejection without a second transaction or actor-sequence reuse', async () => {
      await using rig = await open();
      const client = await rig.connect('native-replica');
      const events = client.view.events();
      const titles: string[] = [];
      events.$.subscribe((event) => titles.push(event.after.title));
      try {
        client.transact((edit) => {
          edit.title('Outer');
          expect(() => client.transact((inner) => inner.title('Reentrant'))).to.throw(
            'Reentrant native author',
          );
          expect(titles).to.eql([]);
        });
        expect(titles).to.eql(['Outer']);
      } finally {
        events.dispose();
      }
      expect(client.view.current.title).to.equal('Outer');
      expect(client.submissionCount).to.equal(1);
      await client.settle();
      expect((await rig.control.send('read', {})).snapshot.value.title).to.equal('Outer');
    });

    it('B / callback throw → refresh and submission follow native commit truth, not error-means-no-write', async () => {
      await using rig = await open();
      const client = await rig.connect('native-replica');
      let callerEffects = 0;
      expect(() =>
        client.transact((edit) => {
          edit.title('Before throw');
          callerEffects += 1;
          throw Err.std('Author failed');
        })
      ).to.throw('Author failed');
      expect(callerEffects).to.equal(1);
      const committed = !spec.rollback;
      expect(client.view.current.title).to.equal(committed ? 'Before throw' : 'Note');
      expect(client.submissionCount).to.equal(committed ? 1 : 0);
      await client.settle();
      expect((await rig.control.send('read', {})).snapshot.value.title).to.equal(
        committed ? 'Before throw' : 'Note',
      );
    });

    if (spec.draftRef) {
      it('B / retained Automerge draft → cannot mutate native state after the callback returns', async () => {
        await using rig = await open();
        const client = await rig.connect('native-replica');
        if (!client.ref) throw Err.std('Expected a writable native draft ref.');
        let retained: t.FixtureNote | undefined;
        client.ref.change((draft) => {
          retained = draft;
          draft.title = 'In scope';
        });
        expect(() => {
          if (retained) retained.title = 'Escaped';
        }).to.throw();
        expect(client.view.current.title).to.equal('In scope');
        await client.settle();
        expect((await rig.control.send('read', {})).snapshot.value.title).to.equal('In scope');
      });

      it('B / existing immutable lens → synchronous local reads, separately owned worker receipts', async () => {
        await using rig = await open();
        const client = await rig.connect('native-replica');
        if (!client.ref) throw Err.std('Expected a writable native draft ref.');
        const title = Lens.at<string>(client.ref, ['title']);
        title.update((value) => `${value}!`);
        expect(title.get()).to.equal('Note!');
        expect(client.submissionCount).to.equal(1);
        await client.settle();
        expect((await rig.control.send('read', {})).snapshot.value.title).to.equal('Note!');
      });

      for (const mode of ['async-owner', 'native-replica'] as const) {
        it(`${mode} / heads-only peer change → an empty value patch set still carries a native observation`, async () => {
          await using rig = await open();
          const client = await rig.connect(mode);
          const before = client.snapshot;
          const changes: t.Change[] = [];
          const events = client.view.events();
          events.$.subscribe((event) => changes.push(event));
          try {
            if (!rig.peer.headsOnly) throw Err.std('Expected native heads-only authoring.');
            rig.peer.headsOnly();
            await rig.control.send('peer', { binary: rig.peer.save() });
            expect(changes.length).to.equal(1);
            expect(changes[0].patches).to.eql([]);
            expect(changes[0].before).to.eql(changes[0].after);
            expect(client.snapshot.basis).not.to.equal(before.basis);
          } finally {
            events.dispose();
          }
        });
      }
    } else {
      it('B / retained Yjs fixture author → cannot mutate native state outside its transaction', async () => {
        await using rig = await open();
        const client = await rig.connect('native-replica');
        let retained: t.Editor | undefined;
        client.transact((edit) => {
          retained = edit;
        });
        expect(() => retained?.title('Escaped')).to.throw('outside its native transaction');
        expect(client.view.current.title).to.equal('Note');
        expect(client.submissionCount).to.equal(0);
      });
    }

    it('plain proxy / stale numeric target → native application edits A, not the retained B', async () => {
      await using rig = await open();
      const proxy = Immutable.clonerRef(Obj.clone(rig.initial.snapshot.value));
      rig.peer.author((edit) => edit.insertItem(0, { id: 'X', label: 'Peer prefix' }));
      proxy.change((draft) => {
        draft.items[1].label = 'For B';
      });
      // Replay this one value-patch position: no generic patch mapper is implemented here.
      rig.peer.author((edit) => edit.label(1, proxy.current.items[1].label));
      expect(rig.peer.capture().value.items[1]).to.eql({ id: 'A', label: 'For B' });
      expect(rig.peer.capture().value.items[2]).to.eql({ id: 'B', label: 'Beta' });
    });

    it('plain proxy / reject E1 and reset → dependent E2 disappears; retaining it does not remove E1', async () => {
      await using rig = await open();
      const owner = await rig.connect('async-owner');
      const proxy = Immutable.clonerRef(Obj.clone(owner.view.current));
      proxy.change((draft) => {
        draft.title = 'E1';
      });
      proxy.change((draft) => {
        draft.title = `${draft.title} + E2`;
      });
      const pendingValue = proxy.current.title;
      await rig.control.send('admission', { allow: false });
      const rejected = await owner.write({ kind: 'compose', title: 'E1', bold: false });
      expect(rejected.accepted).to.equal(false);
      proxy.change((draft) => {
        draft.title = rejected.frame.snapshot.value.title;
      });
      expect(proxy.current.title).to.equal('Note');
      expect(pendingValue).to.equal('E1 + E2');
      // Formatting is independently missing from the proxy's value-only state.
      const before = rig.peer.capture();
      rig.peer.author((edit) => edit.format(0, 1, true));
      expect(rig.peer.capture().value).to.eql(before.value);
      expect(rig.peer.capture().metadata).not.to.eql(before.metadata);
    });
  });
}
