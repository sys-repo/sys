import {
  change,
  free,
  getHeads,
  getObjectId,
  isAutomerge,
  load,
  mark,
  marks,
  save,
  splice,
} from '@automerge/automerge';
import { Lens } from '@sys/immutable/core';
import { describe, Err, expect, it, Json, Obj } from '../-test.ts';
import { automergePair } from '../-fixtures/u.automerge.ts';
import { initialNote } from '../-fixtures/u.note.ts';
import type { t } from '../-compare/common.ts';
import { automergeReplica } from '../-compare/u/u.automerge.ts';
import { openComparison } from '../-compare/u/u.client.ts';
import { comparison } from '../-compare/u/u.spec.ts';

const worker = new URL('../-compare/u/u.worker.automerge.ts', import.meta.url);

comparison({
  name: 'Automerge',
  worker,
  replica: automergeReplica,
  formatted: [{ name: 'bold', value: true, start: 0, end: 1 }],
  draftRef: true,
  rollback: true,
  composeDraft(draft, title) {
    draft.title = title;
    mark(draft, ['text'], { start: 0, end: 1, expand: 'none' }, 'bold', true);
  },
});

describe('Automerge replica | plain snapshots and atomic text-object validation', () => {
  it('native capture → value-only snapshots cannot author changes in saved history', async () => {
    using pair = automergePair();
    const native = automergeReplica(save(pair.owner));
    try {
      const before = native.capture();
      expectValueOnly(before.value);
      expectSaved(native.save(), before);
      native.author((edit) => edit.title('Supported edit'));
      const after = native.capture();
      expect(after.value).to.eql({ ...initialNote(), title: 'Supported edit' });
      expect(before.value).to.eql(initialNote());
      expectSaved(native.save(), after);
    } finally {
      await native.dispose();
    }
  });

  it('text replacement → discard the whole fork, even when final text values are equal', async () => {
    using pair = automergePair();
    const native = automergeReplica(save(pair.owner));
    try {
      if (!native.change) throw Err.std('Expected an Automerge native draft author.');
      const before = native.capture();
      const author = native.change;
      for (const text of ['Replacement', before.value.text]) {
        expect(() =>
          author((draft) => {
            draft.title = 'Not committed';
            mark(draft, ['text'], { start: 0, end: 1, expand: 'none' }, 'bold', true);
            draft.text = text;
          })
        ).to.throw('Fixture text object replacement is unsupported.');
        expect(native.capture()).to.eql(before);
        expectSaved(native.save(), before);
      }
      author((draft) => {
        draft.title = 'Supported edit';
        splice(draft, ['text'], 1, 0, 'b');
      });
      expect(native.capture().value).to.eql({
        ...initialNote(),
        title: 'Supported edit',
        text: 'abc',
      });
      expect(native.capture().selection).to.eql([0, 2]);
      expectSaved(native.save(), native.capture());
    } finally {
      await native.dispose();
    }
  });

  it('current and retained event values → no native authoring or later receipt contamination', async () => {
    await using rig = await openComparison(worker, automergeReplica);
    const client = await rig.connect('native-replica');
    const observer = await rig.connect('async-owner');
    if (!client.ref) throw Err.std('Expected an Automerge writable ref.');
    const initial = client.view.current;
    const changes: t.Change[] = [];
    const events = client.view.events();
    events.$.subscribe((event) => changes.push(event));
    try {
      expectValueOnly(initial);
      expect(client.submissionCount).to.equal(0);
      client.transact((edit) => edit.title('First edit'));
      const [first] = await client.settle();
      expect(first.accepted).to.equal(true);
      expect(changes.length).to.equal(1);
      const values = [
        initial,
        client.view.current,
        client.ref.current,
        client.snapshot.value,
        ...changes.flatMap((event) => [
          event.before,
          event.after,
          event.native.before.value,
          event.native.after.value,
        ]),
      ];
      const retained = Obj.clone(values);
      for (const value of values) expectValueOnly(value);
      expect(client.submissionCount).to.equal(1);
      client.transact((edit) => edit.title('Second edit'));
      const receipts = await client.settle();
      expect(receipts.length).to.equal(2);
      const receipt = receipts[1];
      expect(receipt.accepted).to.equal(true);
      expect(receipt.frame.snapshot.value).to.eql({ ...initialNote(), title: 'Second edit' });
      expectSaved(receipt.frame.binary, receipt.frame.snapshot);
      expect(client.view.current).to.eql(receipt.frame.snapshot.value);
      expect(observer.view.current).to.eql(receipt.frame.snapshot.value);
      expect(values).to.eql(retained);
    } finally {
      events.dispose();
    }
  });

  for (const method of ['draft assignment', 'text lens setter'] as const) {
    it(`${method} → rejection leaves no events or submissions and the next edit succeeds`, async () => {
      await using rig = await openComparison(worker, automergeReplica);
      const client = await rig.connect('native-replica');
      if (!client.ref) throw Err.std('Expected an Automerge writable ref.');
      const ref = client.ref;
      const before = client.snapshot;
      const changes: t.Change[] = [];
      const events = ref.events();
      events.$.subscribe((event) => changes.push(event));
      try {
        ref.change(() => {});
        for (const text of ['Replacement', before.value.text]) {
          const replace = () => {
            if (method === 'draft assignment') {
              ref.change((draft) => {
                draft.text = text;
              });
            } else Lens.at<string>(ref, ['text']).set(text);
          };
          // The existing lens skips equal-value writes; direct native assignment does not.
          if (method === 'text lens setter' && text === before.value.text) {
            expect(replace).not.to.throw();
          } else expect(replace).to.throw('Fixture text object replacement is unsupported.');
          expect(client.snapshot).to.equal(before);
          expect(ref.current.text).to.equal('ac');
          expect(changes).to.eql([]);
          expect(client.submissionCount).to.equal(0);
          expect(await client.settle()).to.eql([]);
        }
        const owner = await rig.control.send('read', {});
        expect(owner.snapshot).to.eql(rig.initial.snapshot);
        expectSaved(owner.binary, before);
        ref.change((draft) => {
          draft.title = 'Supported edit';
          splice(draft, ['text'], 1, 0, 'b');
        });
        expect(ref.current).to.eql({ ...initialNote(), title: 'Supported edit', text: 'abc' });
        expect(client.snapshot.selection).to.eql([0, 2]);
        const [receipt] = await client.settle();
        expect(client.submissionCount).to.equal(1);
        expect(receipt.accepted).to.equal(true);
        expect(receipt.frame.snapshot.value).to.eql(ref.current);
        expectSaved(receipt.frame.binary, client.snapshot);
        expect(changes.length).to.equal(1);
      } finally {
        events.dispose();
      }
    });
  }
});

function expectValueOnly(value: t.FixtureNote) {
  expect(() =>
    change(value, (draft) => {
      draft.items[0].label = 'Outside edit';
    })
  ).to.throw('must be the document root');
  expect(isAutomerge(value)).to.equal(false);
  expect(Reflect.ownKeys(value)).to.have.members(['title', 'items', 'text']);
  expect(Reflect.ownKeys(value.items)).to.have.members(['0', '1', 'length']);
  expect(getObjectId(value.items)).to.equal(undefined);
  for (const item of value.items) {
    expect(Reflect.ownKeys(item)).to.have.members(['id', 'label']);
    expect(getObjectId(item)).to.equal(undefined);
  }
}

function expectSaved(binary: Uint8Array, snapshot: t.Snapshot) {
  const doc = load<t.FixtureNote>(binary);
  try {
    expect(doc).to.eql(snapshot.value);
    expect(Json.stringify(getHeads(doc))).to.equal(snapshot.basis);
    expect(marks(doc, ['text'])).to.eql(snapshot.metadata);
  } finally {
    free(doc);
  }
}
