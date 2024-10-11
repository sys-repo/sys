import { describe, expect, it } from '../-test.ts';
import { Hash } from './mod.ts';

const circular: any = { foo: 123 };
circular.ref = circular;

describe('hash', () => {
  describe('SHA', () => {
    it('sha256', () => {
      const test = (input: any, endsWith: string) => {
        const a = Hash.sha256(input);
        const b = Hash.sha256(input, { prefix: false });

        expect(a).to.match(/^sha256-/);
        expect(b).to.not.match(/^sha256-/);

        expect(a).to.match(new RegExp(`${endsWith}$`));
        expect(b).to.match(new RegExp(`${endsWith}$`));
      };

      test('hello', 'ff3f354e7a');
      test(new TextEncoder().encode('hello'), '62938b9824');
      test(123, 'f7f7a27ae3');
      test('', 'a03d82e126');
      test({ msg: 'abc' }, '43991ca7b7');
      test({ foo: 123 }, '3c8235fbf9');
      test(new Uint8Array([21, 31]).buffer, 'ba420bd4bd'); // NB: Not converted to string first.
      test(undefined, '359aa9950c');
      test(null, '92f982b90b');
      test({}, 'f61caaff8a');
      test(circular, 'd5a63d31fd');
      test([], '161202b945');
      test([1, { item: 2 }], 'a6a2f3f837');
      test([1, circular], 'aa35da71e7');
      test(true, 'b44867e12b');
      test(false, '245224f8aa');
      test(123, 'f7f7a27ae3');
      test(BigInt(9999), '456a506e05');
      test(Symbol('foo'), 'b4f8db9f3e');
    });

    it('sha1', () => {
      const test = (input: any, endsWith: string) => {
        const a = Hash.sha1(input);
        const b = Hash.sha1(input, { prefix: false });

        expect(a).to.match(/^sha1-/);
        expect(b).to.not.match(/^sha1-/);

        expect(a).to.match(new RegExp(`${endsWith}$`));
        expect(b).to.match(new RegExp(`${endsWith}$`));
      };

      test(new TextEncoder().encode('hello'), 'd9aea9434d');
      test('hello', '5d06f9d0c4');
      test(123, '5ecbdbbeef');
      test('', '9e1ecb2585');
      test({ msg: 'abc' }, 'bd818251c2');
      test({ foo: 123 }, 'f3b5753ac0');
      test(new Uint8Array([21, 31]).buffer, 'b23dece0d3'); // NB: Not converted to string first.
      test(undefined, 'a24b69856e');
      test(null, '65032d6833');
      test({}, '0917b2202f');
      test(circular, '326953447b');
      test([], '302a97674c');
      test([1, { item: 2 }], '488d93ac98');
      test([1, circular], '6705b3f7e6');
      test(true, 'fc8ada44db');
      test(false, 'e14d12cb04');
      test(123, '5ecbdbbeef');
      test(BigInt(9999), '482c1bd594');
      test(Symbol('foo'), '902ba95c2a');
    });
  });

  it('asString (converter option)', () => {
    const value = 1234;
    const asString = (input: any) => `foo-${input}`;
    const res = Hash.sha256(value, { asString });
    const alt = new TextEncoder().encode(asString(value));
    expect(res).to.eql(Hash.sha256(alt));
  });

  describe('shorten', () => {
    const hash = 'sha256-1234567890';
    const uri = 'sha1:1234567890';

    it('(default)', () => {
      const res = Hash.shorten(`   ${hash}   `, 3);
      expect(res).to.eql('sha..890');
    });

    it('empty string', () => {
      expect(Hash.shorten('', 3)).to.eql('');
      expect(Hash.shorten('  ', 3)).to.eql('');
    });

    it('length: number', () => {
      const res = Hash.shorten(hash, 6);
      expect(res).to.eql('sha256..567890');
    });

    it('length: [number, number]', () => {
      const res = Hash.shorten(hash, [3, 5], { trimPrefix: true });
      expect(res).to.eql('123..67890');
    });

    it('length: [0, 5]', () => {
      const res = Hash.shorten(hash, [0, 5], { trimPrefix: true });
      expect(res).to.eql('67890');
    });

    it('length: [5, 0]', () => {
      const res = Hash.shorten(hash, [5, 0], { trimPrefix: true });
      expect(res).to.eql('12345');
    });

    it('custom divider', () => {
      const res = Hash.shorten(hash, 3, { trimPrefix: true, divider: '-' });
      expect(res).to.eql('123-890');
    });

    it('hash string already short', () => {
      const test = (value: string, length: number | [number, number]) => {
        const res = Hash.shorten(value, length);
        expect(res).to.eql(value);
      };
      test('1', 3);
      test('12', 3);
      test('123', 3);
      test('1234', [1, 3]);
      test('1234', [0, 4]);
      test('1234', [4, 0]);
    });

    describe('trim prefix', () => {
      it('true', () => {
        const test = (hash: string) => {
          const res = Hash.shorten(hash, 3, { trimPrefix: true });
          expect(res).to.eql('123..890');
        };
        test('sha256-1234567890');
        test('SHA1-1234567890');
        test('sha512-1234567890');
        test('md5-1234567890');
        test('md5:1234567890');
      });

      it('string divider', () => {
        const res1 = Hash.shorten(hash, 3, { trimPrefix: '-' });
        const res2 = Hash.shorten(hash, 3, { trimPrefix: true });
        const res3 = Hash.shorten(uri, 3, { trimPrefix: ['-', ':'] });
        const res4 = Hash.shorten(hash, 3, { trimPrefix: false });
        expect(res1).to.eql('123..890');
        expect(res2).to.eql('123..890');
        expect(res3).to.eql('123..890');
        expect(res4).to.eql('sha..890');
      });
    });
  });
});
