import { describe, expect, it } from '../../../../-test.ts';
import { isDagLike } from '../u.dag.ts';
import { cleanDocid } from '../u.docid.ts';

describe('u.docid', () => {
  it('normalizes lexical docid forms for template substitution', () => {
    expect(cleanDocid('crdt:abc123')).to.equal('abc123');
    expect(cleanDocid(' crdt:abc123 ')).to.equal('abc123');
    expect(cleanDocid('crdt:')).to.equal('');
    expect(cleanDocid('CRDT:abc123')).to.equal('CRDT:abc123');
    expect(cleanDocid('abc123')).to.equal('abc123');
    expect(cleanDocid('  abc123  ')).to.equal('abc123');
    expect(cleanDocid('foo:abc123')).to.equal('foo:abc123');
  });
});
