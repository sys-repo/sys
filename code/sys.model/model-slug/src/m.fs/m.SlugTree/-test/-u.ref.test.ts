import { describe, expect, it } from '../../../-test.ts';
import { normalizeCrdtRef } from '../u.ref.ts';

describe('SlugTreeFs.ref', () => {
  it('adds the crdt prefix when missing', () => {
    expect(normalizeCrdtRef('alpha')).to.eql('crdt:alpha');
  });

  it('normalizes urn refs to the canonical crdt form', () => {
    expect(normalizeCrdtRef('urn:crdt:beta')).to.eql('crdt:beta');
  });

  it('trims surrounding whitespace before normalizing', () => {
    expect(normalizeCrdtRef('  gamma  ')).to.eql('crdt:gamma');
  });
});
