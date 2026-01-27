import { describe, expect, it } from '../../-test.ts';
import { normalizeCrdtRef } from '../u.ref.ts';

describe('SlugTree.ref', () => {
  it('keeps crdt refs unchanged', () => {
    expect(normalizeCrdtRef('crdt:abc')).to.eql('crdt:abc');
  });

  it('normalizes urn:crdt refs', () => {
    expect(normalizeCrdtRef('urn:crdt:xyz')).to.eql('crdt:xyz');
  });

  it('prefixes raw ids', () => {
    expect(normalizeCrdtRef('id-123')).to.eql('crdt:id-123');
  });

  it('trims whitespace', () => {
    expect(normalizeCrdtRef('  crdt:trim  ')).to.eql('crdt:trim');
  });
});

