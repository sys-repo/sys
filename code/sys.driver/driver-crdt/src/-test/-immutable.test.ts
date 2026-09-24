import { Immutable } from '@sys/immutable/rfc6902';
import { Lens } from '@sys/immutable/core';
import { describe, expect, expectTypeOf, it, type t } from './-test.ts';
import { initialNote } from './-fixtures/u.note.ts';

describe('Immutable control | caller timing and retained values', () => {
  it('change → caller capture, patches and current are available before return', () => {
    const ref = Immutable.clonerRef(initialNote());
    const events = ref.events();
    const trace: string[] = [];
    const capturedTitle = 'Written here';
    const changes: t.ImmutableChange<t.FixtureNote, t.Rfc6902PatchOperation>[] = [];
    events.$.subscribe((e) => {
      trace.push('event');
      changes.push(e);
    });
    try {
      const result = ref.change((draft) => {
        trace.push('callback');
        draft.title = capturedTitle;
      }, (patches) => {
        trace.push('patches');
        expect(patches).to.eql([{ op: 'replace', path: '/title', value: capturedTitle }]);
        expect(ref.current.title).to.equal(capturedTitle);
      });
      trace.push('returned');
      expectTypeOf(result).toEqualTypeOf<void>();
      expect(result).to.equal(undefined);
      expect(trace).to.eql(['callback', 'patches', 'event', 'returned']);
      expect(changes.length).to.equal(1);
      expect(changes[0].before.title).to.equal('Note');
      expect(changes[0].after).to.equal(ref.current);
    } finally {
      events.dispose();
    }
  });

  it('later changes → retained before/after values and ref identity stay stable', () => {
    const ref = Immutable.clonerRef(initialNote());
    const instance = ref.instance;
    const before = ref.current;
    ref.change((draft) => {
      draft.items[1].label = 'First edit';
    });
    const after = ref.current;
    ref.change((draft) => {
      draft.items[1].label = 'Later edit';
    });
    expect(before.items[1].label).to.equal('Beta');
    expect(after.items[1].label).to.equal('First edit');
    expect(ref.current.items[1].label).to.equal('Later edit');
    expect(ref.instance).to.equal(instance);
  });

  it('dispose one event view → the other still receives path-filtered changes', () => {
    const ref = Immutable.clonerRef(initialNote());
    const retired = ref.events();
    const survivor = ref.events();
    const retiredTitles: string[] = [];
    const survivingTitles: string[] = [];
    retired.$.subscribe((e) => retiredTitles.push(e.after.title));
    survivor.path(['title']).$.subscribe((e) => survivingTitles.push(e.after.title));
    try {
      retired.dispose();
      ref.change((draft) => {
        draft.items[0].label = 'Not a title change';
      });
      ref.change((draft) => {
        draft.title = 'Still observed';
      });
      expect(retiredTitles).to.eql([]);
      expect(survivingTitles).to.eql(['Still observed']);
      expect(survivor.disposed).to.equal(false);
    } finally {
      retired.dispose();
      survivor.dispose();
    }
  });

  it('existing lens ensure/update → writes are visible to the next synchronous read', () => {
    const ref = Immutable.clonerRef<{ title?: string }>({});
    const title = Lens.at<string>(ref, ['title']);
    expect(title.ensure('Seed')).to.equal('Seed');
    expect(ref.current.title).to.equal('Seed');
    title.update((value) => `${value}!`);
    expect(title.get()).to.equal('Seed!');
  });
});
