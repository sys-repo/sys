import { describe, expect, it, type t } from '../../-test.ts';
import { Hash } from '../mod.ts';

describe('Hash.shorten', () => {
  const hash = 'sha256-12345678901234567890';

  it('trims surrounding whitespace before shortening', () => {
    expect(Hash.shorten(`   ${hash}   `, 3)).to.eql('sha..890');
  });

  it('empty or whitespace-only text → empty text', () => {
    expect(Hash.shorten('', 3)).to.eql('');
    expect(Hash.shorten('  ', 3)).to.eql('');
  });

  it('boolean options control prefix trimming without changing edge lengths', () => {
    expect(Hash.shorten(hash, [8, 4], true)).to.eql('12345678..7890');
    expect(Hash.shorten(hash, [8, 4], false)).to.eql('sha256-1..7890');
    expect(Hash.shorten(hash, [8, 4])).to.eql('sha256-1..7890');
  });

  it('scalar length keeps the same number of characters at each edge', () => {
    expect(Hash.shorten(hash, 6)).to.eql('sha256..567890');
  });

  it('tuple length controls the edges independently', () => {
    const actual = Hash.shorten(hash, [3, 5], { trimPrefix: true });
    expect(actual).to.eql('123..67890');
  });

  it('a zero-length edge omits the divider', () => {
    expect(Hash.shorten(hash, [0, 5], { trimPrefix: true })).to.eql('67890');
    expect(Hash.shorten(hash, [5, 0], { trimPrefix: true })).to.eql('12345');
  });

  it('custom divider joins the retained edges', () => {
    const actual = Hash.shorten(hash, [3, 5], { trimPrefix: true, divider: '-' });
    expect(actual).to.eql('123-67890');
  });

  it('length at or below the combined edge budget → unchanged text', () => {
    const cases: { input: string; length: number | [number, number] }[] = [
      { input: '1', length: 3 },
      { input: '12', length: 3 },
      { input: '123', length: 3 },
      { input: '1234', length: [1, 3] },
      { input: '1234', length: [0, 4] },
      { input: '1234', length: [4, 0] },
    ];
    for (const { input, length } of cases) {
      expect(Hash.shorten(input, length)).to.eql(input);
    }
  });

  it('one character over the combined edge budget → shortened text', () => {
    expect(Hash.shorten('12345', [1, 3])).to.eql('1..345');
  });

  it('boolean trimming recognizes algorithm prefixes with dash or colon separators', () => {
    const inputs = [
      'sha256-1234567890',
      'SHA1-1234567890',
      'sha512-1234567890',
      'md5-1234567890',
      'md5:1234567890',
    ];
    for (const input of inputs) {
      expect(Hash.shorten(input, 3, { trimPrefix: true })).to.eql('123..890');
    }
  });

  it('explicit separator choices and disabled trimming', () => {
    const cases: { input: string; trimPrefix: t.Hash.Shorten.Options['trimPrefix'] }[] = [
      { input: hash, trimPrefix: '-' },
      { input: hash, trimPrefix: true },
      { input: 'sha1:12345678901234567890', trimPrefix: ['-', ':'] },
    ];
    for (const { input, trimPrefix } of cases) {
      expect(Hash.shorten(input, 3, { trimPrefix })).to.eql('123..890');
    }
    expect(Hash.shorten(hash, 3, { trimPrefix: false })).to.eql('sha..890');
  });
});
