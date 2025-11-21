import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { CrdtId } from '../mod.ts';
import type { t } from '../common.ts';

const VALID_ID = 'pz1U8r3FH2ubPjnBzTMtFB8Yaaw' as t.Crdt.Id; // must be a valid doc id
const VALID_URI = `crdt:${VALID_ID}`;

describe('Crdt.Id', () => {
  it('types', () => {
    expectTypeOf(CrdtId.fromUri).toEqualTypeOf<(value: string) => t.Crdt.Id | undefined>();
    expectTypeOf(CrdtId.toUri).toEqualTypeOf<(id: t.Crdt.Id) => string>();
    expectTypeOf(CrdtId.clean).toEqualTypeOf<(value: string) => t.Crdt.Id>();
  });

  it('fromUri: valid', () => {
    const id = CrdtId.fromUri(VALID_URI);
    expect(id).to.eql(VALID_ID);
  });

  it('fromUri: invalid inputs', () => {
    expect(CrdtId.fromUri('')).to.eql(undefined);
    expect(CrdtId.fromUri('crdt:')).to.eql(undefined); // missing id
    expect(CrdtId.fromUri(`foo:${VALID_ID}`)).to.eql(undefined); // wrong scheme
    expect(CrdtId.fromUri(`CRDT:${VALID_ID}`)).to.eql(undefined); // case-sensitive
    expect(CrdtId.fromUri(`crdt:${VALID_ID}x`)).to.eql(undefined); // extra junk
    expect(CrdtId.fromUri(VALID_ID as unknown as string)).to.eql(undefined); // bare id
    expect(CrdtId.fromUri(undefined as unknown as string)).to.eql(undefined);
    expect(CrdtId.fromUri(null as unknown as string)).to.eql(undefined);
  });

  it('toUri', () => {
    const uri = CrdtId.toUri(VALID_ID);
    expect(uri).to.eql(VALID_URI);
  });

  it('clean: bare id', () => {
    const id = CrdtId.clean(VALID_ID);
    expect(id).to.eql(VALID_ID);
  });

  it('clean: uri', () => {
    const id = CrdtId.clean(VALID_URI);
    expect(id).to.eql(VALID_ID);
  });

  it('clean: throws on invalid string', () => {
    const badStrings: string[] = ['', 'crdt:', 'crdt: ', `foo:${VALID_ID}`];

    for (const value of badStrings) {
      const fn = () => CrdtId.clean(value);
      expect(fn).to.throw(/CrdtId\.clean: invalid CRDT id or uri/i);
    }
  });

  it('clean: throws on non-string input', () => {
    const badInputs: unknown[] = [123, null, undefined, {}];

    for (const value of badInputs) {
      const fn = () => CrdtId.clean(value as string);
      expect(fn).to.throw(/CrdtId\.clean: value must be a string\./i);
    }
  });
});
