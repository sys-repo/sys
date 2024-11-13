import { describe, expect, it, type t } from '../../-test.ts';
import { DefaultTokenizer } from './Tokenizer.ts';

describe('Text.Syntax', () => {
  describe('Tokenizer', () => {
    describe('DefaultTokenizer', () => {
      it('<Component>', () => {
        const res = DefaultTokenizer('<Component>');
        expect(res.text).to.eql('<Component>');
        expect(res.parts.length).to.eql(3);

        expect(res.parts[0].kind).to.eql('Brace');
        expect(res.parts[1].kind).to.eql('Word');
        expect(res.parts[2].kind).to.eql('Brace');

        expect(res.parts[0].text).to.eql('<');
        expect(res.parts[1].text).to.eql('Component');
        expect(res.parts[2].text).to.eql('>');
      });

      it('predicate:value', () => {
        const res = DefaultTokenizer('foo:bar');

        expect(res.text).to.eql('foo:bar');
        expect(res.parts.length).to.eql(3);

        expect(res.parts[0].kind).to.eql('Predicate');
        expect(res.parts[1].kind).to.eql('Colon');
        expect(res.parts[2].kind).to.eql('Word');
      });

      describe('kinds of (contained) element words', () => {
        const test = (input: string, within: t.TextSyntaxBraceKind) => {
          const res = DefaultTokenizer(input);
          expect(res.text).to.eql(input);
          const parts = res.parts;
          expect(parts.length).to.eql(3);
          expect(parts[1].within).to.eql(within);
        };

        it('<Component>', () => {
          test('<Component>', '<>');
          test('< Component >', '<>');
        });

        it('[List]', () => {
          test('[List]', '[]');
          test('[ List ]', '[]');
        });

        it('{Object}', () => {
          test('{Object}', '{}');
          test('{ Object }', '{}');
        });
      });

      describe('within "<>" | "{}" | "[]" (element)', () => {
        it('not within brace', () => {
          const test = (input: string) => {
            const res = DefaultTokenizer(input);
            expect(res.parts.every((part) => !part.within)).to.eql(true);
          };
          test('');
          test(' ');
          test('foo');
          test('foo, bar');
          test('foo:bar');
        });

        it('is within brace', () => {
          const test = (input: string, kind: t.TextSyntaxBraceKind) => {
            const res = DefaultTokenizer(input);
            const parts = res.parts;

            expect(parts.length).to.eql(3);
            expect(parts[0].within).to.eql(undefined);
            expect(parts[1].within).to.eql(kind);
            expect(parts[2].within).to.eql(undefined);
          };

          test('{Object}', '{}');
          test('[List]', '[]');
          test('<Component>', '<>');
        });
      });
    });
  });
});
