import { describe, expect, it } from '../../-test.ts';
import { extractTokens } from '../u.extractTokens.ts';

describe('AliasResolver: extractTokens', () => {
  it('returns empty for no tokens', () => {
    expect(extractTokens('hello/world')).eql([]);
  });

  it('extracts a single token', () => {
    expect(extractTokens('/:core/foo')).eql([':core']);
  });

  it('extracts multiple tokens in order', () => {
    const out = extractTokens('/:core/:p2p/assets');
    expect(out).eql([':core', ':p2p']);
  });

  it('deduplicates repeated tokens', () => {
    const out = extractTokens('/:core/x/:core/y');
    expect(out).eql([':core']);
  });

  it('supports tokens with dots, dashes, underscores', () => {
    const out = extractTokens('/:core-assets/:p2p.images');
    expect(out).eql([':core-assets', ':p2p.images']);
  });

  it('does not include trailing punctuation', () => {
    const out = extractTokens('path/:core, next/:p2p!');
    expect(out).eql([':core', ':p2p']);
  });

  it('ignores ":" that are part of other words (e.g. crdt:123)', () => {
    const out = extractTokens('//crdt:123/alias/:core');
    expect(out).eql([':core']);
  });

  it('ignores protocol-style or host-style colons', () => {
    const out = extractTokens('http://example.com/:core');
    expect(out).eql([':core']);
  });
});
