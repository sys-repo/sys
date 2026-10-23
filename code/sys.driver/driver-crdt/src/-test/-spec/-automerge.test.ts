import {
  change,
  emptyChange,
  free,
  getActorId,
  getChanges,
  getCursor,
  getCursorPosition,
  getHeads,
  getObjectId,
  load,
  mark,
  marks,
  merge,
  save,
  splice,
  view,
} from '@automerge/automerge';
import { describe, expect, Is, it, Obj, type t } from '../-test.ts';
import { automergePair } from '../-fixtures/u.automerge.ts';
import { initialNote } from '../-fixtures/u.note.ts';

describe('Automerge control | causal identity is more than equal values', () => {
  it('native clone → shared heads and object identities, independent writer identities', () => {
    using pair = automergePair();
    const { owner, peer } = pair;
    expect(owner).to.eql(initialNote());
    expect(peer).to.eql(owner);
    expect(getHeads(peer)).to.eql(getHeads(owner));
    expect(getObjectId(peer.items[1])).to.equal(getObjectId(owner.items[1]));
    expect(getActorId(peer)).not.to.equal(getActorId(owner));
    const changed = change(peer, (draft) => {
      draft.items[1].label = 'Peer edit';
    });
    expect(owner.items[1].label).to.equal('Beta');
    expect(changed.items[1].label).to.equal('Peer edit');
  });

  it('title plus text formatting → one native change, with metadata beyond plain values', () => {
    using pair = automergePair();
    const { owner, peer } = pair;
    const capturedMarks = marks(owner, ['text']);
    const formatted = change(owner, (draft) => {
      draft.title = 'Formatted';
      mark(draft, ['text'], { start: 0, end: 1, expand: 'none' }, 'bold', true);
    });
    expect(formatted.title).to.equal('Formatted');
    expect(formatted.text).to.equal('ac');
    expect(marks(formatted, ['text'])).to.eql([{ name: 'bold', value: true, start: 0, end: 1 }]);
    expect(getChanges(owner, formatted).length).to.equal(1);
    expect(owner.title).to.equal('Note');
    expect(capturedMarks).to.eql([]);
    expect(marks(peer, ['text'])).to.eql([]);
  });

  it('retained document/view → marks reads current shared-backend state', () => {
    using pair = automergePair();
    const { owner, peer } = pair;
    const basis = getHeads(owner);
    const capturedMarks = marks(owner, ['text']);
    const after = change(owner, (draft) => {
      draft.title = 'Later title';
      mark(draft, ['text'], { start: 0, end: 1, expand: 'none' }, 'bold', true);
    });
    const historical = view(after, basis);
    expect(owner.title).to.equal('Note');
    expect(historical.title).to.equal('Note');
    expect(getHeads(historical)).to.eql(basis);
    // Pinned limitation: marks() does not pass the view's heads to the native backend.
    expect(marks(owner, ['text'])).to.eql(marks(after, ['text']));
    expect(marks(historical, ['text'])).to.eql(marks(after, ['text']));
    expect(marks(after, ['text']).length).to.equal(1);
    expect(capturedMarks).to.eql([]);
    expect(marks(peer, ['text'])).to.eql([]);
  });

  it('annotation-only change → equal plain values do not mean unchanged native state', () => {
    using pair = automergePair();
    const { owner } = pair;
    const actions: string[] = [];
    const after = change(owner, {
      patchCallback: (patches) => {
        actions.push(...patches.map((patch) => patch.action));
      },
    }, (draft) => {
      mark(draft, ['text'], { start: 0, end: 1, expand: 'none' }, 'bold', true);
    });
    expect(Obj.clone(after)).to.eql(Obj.clone(owner));
    expect(actions).to.include('mark');
    expect(getHeads(after)).not.to.eql(getHeads(owner));
  });

  it('heads-only change → equal values and no patches still carry new causal history', () => {
    using pair = automergePair();
    const actions: string[] = [];
    const after = emptyChange(pair.owner, {
      patchCallback: (patches) => actions.push(...patches.map((patch) => patch.action)),
    });
    expect(Obj.clone(after)).to.eql(Obj.clone(pair.owner));
    expect(actions).to.eql([]);
    expect(getHeads(after)).not.to.eql(getHeads(pair.owner));
  });

  it('anchored selection → native cursors follow the selected character after a peer prefix', () => {
    using pair = automergePair();
    const anchor = getCursor(pair.owner, ['text'], 0);
    const focus = getCursor(pair.owner, ['text'], 1);
    const peer = change(pair.peer, (draft) => splice(draft, ['text'], 0, 0, 'X'));
    const owner = merge(pair.owner, peer);
    expect(owner.text).to.equal('Xac');
    expect(getCursorPosition(owner, ['text'], anchor)).to.equal(1);
    expect(getCursorPosition(owner, ['text'], focus)).to.equal(2);
  });

  it('text object identity → splices retain it, equal-value assignment still replaces it', () => {
    using pair = automergePair();
    const text = getObjectId(pair.owner, 'text');
    expect(Is.str(text)).to.equal(true);
    const inserted = change(pair.owner, (draft) => splice(draft, ['text'], 1, 0, 'b'));
    expect(inserted.text).to.equal('abc');
    expect(getObjectId(inserted, 'text')).to.equal(text);
    const replaced = change(inserted, (draft) => {
      draft.text = 'abc';
    });
    expect(replaced.text).to.equal(inserted.text);
    expect(getObjectId(replaced, 'text')).not.to.equal(text);
  });

  it('retained draft → a later write enters serialized history outside the mutation callback', () => {
    using pair = automergePair();
    let retained: t.FixtureNote | undefined;
    const after = change(pair.owner, (draft) => {
      retained = draft;
      draft.title = 'In scope';
    });
    if (retained) retained.title = 'Escaped';
    const reloaded = load<t.FixtureNote>(save(after));
    try {
      expect(reloaded.title).to.equal('Escaped');
    } finally {
      free(reloaded);
    }
  });

  it('throw inside change → document writes roll back, caller-local effects do not', () => {
    using pair = automergePair();
    const { owner } = pair;
    const heads = getHeads(owner);
    const failure = new Error('Stop before commit');
    const callerEffects: string[] = [];
    expect(() =>
      change(owner, (draft) => {
        draft.title = 'Not committed';
        callerEffects.push('callback ran');
        throw failure;
      })
    ).to.throw(failure);
    expect(owner).to.eql(initialNote());
    expect(getHeads(owner)).to.eql(heads);
    expect(callerEffects).to.eql(['callback ran']);
  });
});
