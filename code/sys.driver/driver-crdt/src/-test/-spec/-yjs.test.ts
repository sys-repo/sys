import {
  applyUpdate,
  createAbsolutePositionFromRelativePosition,
  createRelativePositionFromTypeIndex,
  encodeStateAsUpdate,
  encodeStateVector,
  equalSnapshots,
  snapshot,
} from 'yjs';
import { describe, expect, it } from '../-test.ts';
import { initialNote } from '../-fixtures/u.note.ts';
import { projectYjs, yjsPair } from '../-fixtures/u.yjs.ts';

describe('Yjs control | shared types, projections and transaction limits', () => {
  it('native update seed → shared insertion history, independent writer identities', () => {
    using pair = yjsPair();
    expect(projectYjs(pair.owner)).to.eql(initialNote());
    expect(projectYjs(pair.peer)).to.eql(projectYjs(pair.owner));
    expect(encodeStateVector(pair.peer)).to.eql(encodeStateVector(pair.owner));
    expect(pair.peer.clientID).not.to.equal(pair.owner.clientID);
    pair.peer.getText('text').insert(1, 'b');
    expect(pair.owner.getText('text').toString()).to.equal('ac');
    applyUpdate(pair.owner, encodeStateAsUpdate(pair.peer));
    expect(pair.owner.getText('text').toString()).to.equal('abc');
  });

  it('projection edit → no native write; later native edits do not mutate retained projections', () => {
    using pair = yjsPair();
    const before = projectYjs(pair.owner);
    const editableCopy = projectYjs(pair.owner);
    editableCopy.items[1].label = 'Only a plain-object edit';
    expect(projectYjs(pair.owner).items[1].label).to.equal('Beta');
    pair.owner.getText('text').insert(1, 'b');
    expect(before.text).to.equal('ac');
    expect(projectYjs(pair.owner).text).to.equal('abc');
  });

  it('title plus formatting → one transaction update, with metadata outside the projection', () => {
    using pair = yjsPair();
    const updates: Uint8Array[] = [];
    const onUpdate = (update: Uint8Array) => updates.push(update);
    pair.owner.on('update', onUpdate);
    try {
      pair.owner.transact(() => {
        pair.owner.getMap<string>('meta').set('title', 'Formatted');
        pair.owner.getText('text').format(0, 1, { bold: true });
      });
      expect(updates.length).to.equal(1);
      expect(projectYjs(pair.owner).title).to.equal('Formatted');
      expect(projectYjs(pair.owner).text).to.equal('ac');
      expect(pair.owner.getText('text').toDelta()).to.eql([
        { insert: 'a', attributes: { bold: true } },
        { insert: 'c' },
      ]);
    } finally {
      pair.owner.off('update', onUpdate);
    }
  });

  it('annotation-only change → equal projections still produce an update', () => {
    using pair = yjsPair();
    const before = projectYjs(pair.owner);
    const updates: Uint8Array[] = [];
    const onUpdate = (update: Uint8Array) => updates.push(update);
    pair.owner.on('update', onUpdate);
    try {
      pair.owner.getText('text').format(0, 1, { bold: true });
      expect(projectYjs(pair.owner)).to.eql(before);
      expect(updates.length).to.equal(1);
      applyUpdate(pair.peer, updates[0]);
      expect(pair.peer.getText('text').toDelta()).to.eql(pair.owner.getText('text').toDelta());
    } finally {
      pair.owner.off('update', onUpdate);
    }
  });

  it('delete-only change → unchanged state vector, changed snapshot and replicated content', () => {
    using pair = yjsPair();
    const vector = encodeStateVector(pair.owner);
    const before = snapshot(pair.owner);
    pair.owner.getText('text').delete(0, 1);
    expect(encodeStateVector(pair.owner)).to.eql(vector);
    expect(equalSnapshots(before, snapshot(pair.owner))).to.equal(false);
    applyUpdate(pair.peer, encodeStateAsUpdate(pair.owner, vector));
    expect(projectYjs(pair.peer).text).to.equal('c');
  });

  it('anchored selection → relative positions follow the selected character after a peer prefix', () => {
    using pair = yjsPair();
    const text = pair.owner.getText('text');
    const anchor = createRelativePositionFromTypeIndex(text, 0);
    const focus = createRelativePositionFromTypeIndex(text, 1);
    pair.peer.getText('text').insert(0, 'X');
    applyUpdate(pair.owner, encodeStateAsUpdate(pair.peer));
    expect(text.toString()).to.equal('Xac');
    const start = createAbsolutePositionFromRelativePosition(anchor, pair.owner);
    const end = createAbsolutePositionFromRelativePosition(focus, pair.owner);
    expect(start?.type).to.equal(text);
    expect(end?.type).to.equal(text);
    expect(start?.index).to.equal(1);
    expect(end?.index).to.equal(2);
  });

  it('throw inside transact → earlier writes remain and still produce an update', () => {
    using pair = yjsPair();
    const updates: Uint8Array[] = [];
    const onUpdate = (update: Uint8Array) => updates.push(update);
    const failure = new Error('Stop after the title write');
    pair.owner.on('update', onUpdate);
    try {
      expect(() =>
        pair.owner.transact(() => {
          pair.owner.getMap<string>('meta').set('title', 'Already written');
          throw failure;
        })
      ).to.throw(failure);
      expect(projectYjs(pair.owner).title).to.equal('Already written');
      expect(updates.length).to.equal(1);
      applyUpdate(pair.peer, updates[0]);
      expect(projectYjs(pair.peer).title).to.equal('Already written');
    } finally {
      pair.owner.off('update', onUpdate);
    }
  });
});
