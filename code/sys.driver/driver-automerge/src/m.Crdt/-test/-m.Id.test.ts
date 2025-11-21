import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { CrdtId } from '../mod.ts';
import type { t } from '../common.ts';

const VALID_ID = 'pz1U8r3FH2ubPjnBzTMtFB8Yaaw' as t.Crdt.Id; // must be a valid doc id
const VALID_URI = `crdt:${VALID_ID}`;

describe('Crdt.Id', () => {
  it('types', () => {
    expectTypeOf(CrdtId.fromUri).toEqualTypeOf<(value: string) => t.Crdt.Id | undefined>();
    expectTypeOf(CrdtId.toUri).toEqualTypeOf<(id: t.Crdt.Id) => string>();
    expectTypeOf(CrdtId.clean).toEqualTypeOf<(value: string) => t.Crdt.Id | undefined>();
  });

  describe('fromUri', () => {
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
  });

  describe('toUri', () => {
    it('valid', () => {
      const uri = CrdtId.toUri(VALID_ID);
      expect(uri).to.eql(VALID_URI);
    });

    it('does not validate id at runtime (caller responsibility)', () => {
      const bad = 'not-a-valid-id' as t.Crdt.Id;
      const uri = CrdtId.toUri(bad);
      expect(uri).to.eql(`crdt:${bad}`);
    });
  });

  describe('clean', () => {
    it('clean: normalises bare id', () => {
      const id = CrdtId.clean(VALID_ID);
      expect(id).to.eql(VALID_ID);
    });

    it('clean: normalises uri', () => {
      const id = CrdtId.clean(VALID_URI);
      expect(id).to.eql(VALID_ID);
    });

    it('clean: invalid strings → undefined', () => {
      const badStrings: string[] = ['', 'crdt:', 'crdt: ', `foo:${VALID_ID}`];
      for (const value of badStrings) {
        expect(CrdtId.clean(value)).to.eql(undefined);
      }
    });

    it('clean: non-strings → undefined', () => {
      const badInputs: unknown[] = [123, null, undefined, {}];
      for (const value of badInputs) {
        expect(CrdtId.clean(value as string)).to.eql(undefined);
      }
    });
  });
});
