import { describe, expect, it } from '../../-test.ts';
import { CompositeHash } from '../../m.Hash.Composite/mod.ts';
import { Hash } from '../mod.ts';

describe('Hash.Is', () => {
  const invalid = [
    { name: 'text', input: '' },
    { name: 'number', input: 123 },
    { name: 'boolean', input: true },
    { name: 'null', input: null },
    { name: 'undefined', input: undefined },
    { name: 'bigint', input: 0n },
    { name: 'symbol', input: Symbol('foo') },
    { name: 'empty object', input: {} },
    { name: 'array', input: [] },
    { name: 'missing parts', input: { digest: 'sha256-abc' } },
    { name: 'missing digest', input: { parts: {} } },
    { name: 'non-string digest', input: { digest: 123, parts: {} } },
    { name: 'null parts', input: { digest: 'sha256-abc', parts: null } },
    { name: 'non-object parts', input: { digest: 'sha256-abc', parts: 'invalid' } },
  ];
  for (const { name, input } of invalid) {
    it(`${name} → neither composite nor builder`, () => {
      expect(Hash.Is.composite(input)).to.eql(false);
      expect(Hash.Is.compositeBuilder(input)).to.eql(false);
    });
  }

  it('plain composite and builder snapshot → composite, not builder', () => {
    const plain = { digest: 'sha256-abc', parts: {} };
    const snapshot = CompositeHash.builder().add('foo', 'abc').toObject();
    for (const input of [plain, snapshot]) {
      expect(Hash.Is.composite(input)).to.eql(true);
      expect(Hash.Is.compositeBuilder(input)).to.eql(false);
    }
  });

  it('live builder → both composite and builder', () => {
    const builder = CompositeHash.builder();
    expect(Hash.Is.composite(builder)).to.eql(true);
    expect(Hash.Is.compositeBuilder(builder)).to.eql(true);
  });

  for (const field of ['length', 'add', 'remove', 'toObject', 'toString'] as const) {
    it(`builder missing ${field} → composite only`, () => {
      const builder = CompositeHash.builder();
      const incomplete = { ...builder, [field]: undefined };
      expect(Hash.Is.composite(incomplete)).to.eql(true);
      expect(Hash.Is.compositeBuilder(incomplete)).to.eql(false);
    });
  }

  it('empty requires both an empty digest and no parts', () => {
    expect(Hash.Is.empty('')).to.eql(true);
    expect(Hash.Is.empty('a')).to.eql(false);
    expect(Hash.Is.empty({ digest: '', parts: {} })).to.eql(true);
    expect(Hash.Is.empty({ digest: 'a', parts: {} })).to.eql(false);
    expect(Hash.Is.empty({ digest: '', parts: { a: 'z' } })).to.eql(false);
    expect(Hash.Is.empty({ digest: 'a', parts: { a: 'z' } })).to.eql(false);
  });
});
