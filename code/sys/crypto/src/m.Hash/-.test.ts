import { describe, expect, it } from '../-test.ts';
import { CompositeHash } from '../m.Hash.Composite/mod.ts';
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

      test('hello', '62938b9824');
      test(new TextEncoder().encode('hello'), '62938b9824');
      test(123, 'f7f7a27ae3');
      test('', '1b7852b855');

      test({ msg: 'abc' }, '54930e4229');
      test(JSON.stringify({ msg: 'abc' }), '54930e4229'); // NB: same as ↑ prior.

      test({ foo: 123 }, 'e197b85591');
      test(JSON.stringify({ foo: 123 }), 'e197b85591');

      test(new Uint8Array([21, 31]).buffer, 'e7495c38e6'); // NB: Not converted to string first.

      test(undefined, '359aa9950c');
      test(null, '92f982b90b');
      test({}, 'f61caaff8a');
      test(circular, '4cac6b5d1b');
      test([], '161202b945');
      test([1, { item: 2 }], '5e93f11476');
      test([1, circular], '9f1d02388a');
      test(true, 'b44867e12b');
      test(false, '245224f8aa');
      test(123, 'f7f7a27ae3');
      test(BigInt(9999), '456a506e05');
      test(Symbol('foo'), 'b4f8db9f3e');
      test(() => null, 'b29bf0f50c');
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
      test('hello', 'd9aea9434d');
      test(123, '5ecbdbbeef');
      test('', '90afd80709');
      test({ msg: 'abc' }, '97dc093ac1');
      test({ foo: 123 }, '6a241c3e11');
      test(new Uint8Array([21, 31]).buffer, 'e9ae0042a4'); // NB: Not converted to string first.
      test(undefined, 'a24b69856e');
      test(null, '65032d6833');
      test({}, '0917b2202f');
      test(circular, '569dc7d244');
      test([], '302a97674c');
      test([1, { item: 2 }], '2c5ac5b976');
      test([1, circular], 'b731d509f0');
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

  describe('Hash.toString', () => {
    it('empty', () => {
      expect(Hash.toString()).to.eql('');
      expect(Hash.toString('')).to.eql('');
      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v: any) => expect(Hash.toString(v)).to.eql(''));
    });

    it('from string', () => {
      expect(Hash.toString('0x123')).to.eql('0x123');
    });

    it('from composite', () => {
      const a = CompositeHash.builder();
      const b = CompositeHash.builder().add('foo', 'abc');
      expect(Hash.toString(a)).to.eql(a.digest);
      expect(Hash.toString(b)).to.eql(b.digest);
    });
  });

  describe('Hash.prefix', () => {
    const test = (input: string | undefined, expected: string) => {
      const res = Hash.prefix(input);
      expect(res).to.eql(expected);
    };

    it('empty', () => {
      test('', '');
      test('foobar', '');
      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v: any) => test(v, ''));
    });

    it('success', () => {
      test('sha256-0000', 'sha256');
      test('sha256-', 'sha256');
      test('sha1-', 'sha1');
      test('🐷-0x000', '🐷');
    });
  });

  describe('shorten', () => {
    const hash = 'sha256-12345678901234567890';
    const uri = 'sha1:12345678901234567890';

    it('(default)', () => {
      const res = Hash.shorten(`   ${hash}   `, 3);
      expect(res).to.eql('sha..890');
    });

    it('empty string', () => {
      expect(Hash.shorten('', 3)).to.eql('');
      expect(Hash.shorten('  ', 3)).to.eql('');
    });

    it('shorten: boolean param as option', () => {
      const a = Hash.shorten(hash, [8, 4], true);
      const b = Hash.shorten(hash, [8, 4], false);
      const c = Hash.shorten(hash, [8, 4]);
      expect(a).to.eql('12345678..7890');
      expect(b).to.eql('sha256-1..7890');
      expect(b).to.eql(c);
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

  describe('Hash.Is', () => {
    const Is = Hash.Is;

    describe('Is.composite', () => {
      it('false', () => {
        const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
        NON.forEach((v) => {
          expect(Is.composite(v)).to.be.false;
        });
        expect(Is.composite({ digest: '0x123' })).to.be.false;
        expect(Is.composite({ parts: {} })).to.be.false;
      });

      it('true', () => {
        const hash = CompositeHash.builder();
        const obj = hash.toObject();
        expect(Is.composite(hash)).to.eql(true);
        expect(Is.composite(obj)).to.eql(true);
        expect(Is.composite({ digest: '0x123', parts: {} })).to.be.true;
      });
    });

    describe('Is.compositeBuilder', () => {
      it('false', () => {
        const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
        NON.forEach((v) => {
          expect(Is.compositeBuilder(v)).to.be.false;
        });
        const hash = CompositeHash.builder();
        expect(Is.compositeBuilder(hash.toObject())).to.be.false;
        expect(Is.compositeBuilder({ digest: '0x123', parts: {} })).to.be.false;
      });

      it('true', () => {
        const hash = CompositeHash.builder();
        expect(Is.compositeBuilder(hash)).to.eql(true);
      });
    });

    describe('Is.empty', () => {
      it('empty: true', () => {
        expect(Is.empty('')).to.eql(true);
        expect(Is.empty({ digest: '', parts: {} })).to.eql(true);
      });

      it('empty: false', () => {
        expect(Is.empty('a')).to.eql(false);
        expect(Is.empty({ digest: 'a', parts: {} })).to.eql(false);
        expect(Is.empty({ digest: '', parts: { a: 'z' } })).to.eql(false);
        expect(Is.empty({ digest: 'a', parts: { a: 'z' } })).to.eql(false);
      });
    });
  });
});
