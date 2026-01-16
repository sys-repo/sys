import { describe, expect, it } from '../../-test.ts';
import type { t } from '../common.ts';
import { SlugClient } from '../mod.ts';

describe('SlugClient.Url.clean', () => {
  it('trims whitespace around docids', () => {
    const raw = '  trimmed-doc  ' as t.Crdt.Id;
    expect(SlugClient.Url.clean(raw)).to.eql('trimmed-doc');
  });

  it('strips a leading crdt: prefix', () => {
    const raw = 'crdt:prefixed-doc' as t.Crdt.Id;
    expect(SlugClient.Url.clean(raw)).to.eql('prefixed-doc');
  });

  it('does not alter plain docids', () => {
    const raw = 'plain-doc' as t.Crdt.Id;
    expect(SlugClient.Url.clean(raw)).to.eql('plain-doc');
  });

  it('keeps embedded crdt: sequences in the middle of the string', () => {
    const raw = 'foo-crdt:bar' as t.Crdt.Id;
    expect(SlugClient.Url.clean(raw)).to.eql('foo-crdt:bar');
  });
});
