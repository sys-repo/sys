import { describe, expect, it } from '../../-test.ts';
import { CompositeHash } from '../../m.Hash.Composite/mod.ts';
import { Hash } from '../mod.ts';

describe('Hash.toString', () => {
  it('absent input → empty text; strings pass through without normalization', () => {
    expect(Hash.toString()).to.eql('');
    expect(Hash.toString('')).to.eql('');
    expect(Hash.toString(' sha256-abc ')).to.eql(' sha256-abc ');
  });

  it('composite snapshot → its digest, not a recomputed hash', () => {
    const input = { digest: 'sha256-snapshot', parts: { a: 'sha256-part' } };
    expect(Hash.toString(input)).to.eql('sha256-snapshot');
  });

  it('empty and populated builders → their current digest', () => {
    const empty = CompositeHash.builder();
    const populated = CompositeHash.builder().add('foo', 'abc');
    expect(Hash.toString(empty)).to.eql(empty.digest);
    expect(Hash.toString(populated)).to.eql(populated.digest);
  });

  it('unsupported runtime inputs → empty text', () => {
    const inputs = [123, true, null, 0n, Symbol('foo'), {}, [], { digest: 'incomplete' }];
    for (const input of inputs) {
      // @ts-expect-error Deliberately exercise the guard outside the typed API.
      expect(Hash.toString(input)).to.eql('');
    }
  });
});

describe('Hash.prefix', () => {
  const cases = [
    { name: 'absent', input: undefined, expected: '' },
    { name: 'empty', input: '', expected: '' },
    { name: 'no separator', input: 'foobar', expected: '' },
    { name: 'SHA256', input: 'sha256-0000', expected: 'sha256' },
    { name: 'empty digest', input: 'sha256-', expected: 'sha256' },
    { name: 'SHA1', input: 'sha1-', expected: 'sha1' },
    { name: 'custom Unicode prefix', input: 'λ-0000', expected: 'λ' },
    { name: 'first separator only', input: 'custom-part-rest', expected: 'custom' },
  ];
  for (const { name, input, expected } of cases) {
    it(name, () => {
      expect(Hash.prefix(input)).to.eql(expected);
    });
  }

  it('non-string runtime inputs → empty prefix', () => {
    const inputs = [123, true, null, 0n, Symbol('foo'), {}, []];
    for (const input of inputs) {
      // @ts-expect-error Deliberately exercise the guard outside the typed API.
      expect(Hash.prefix(input)).to.eql('');
    }
  });
});
