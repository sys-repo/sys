import { describe, expect, it } from '../-test.ts';
import { CompositeHash, Hash } from './mod.ts';

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

  describe('Hash.Is', () => {
    const Is = Hash.Is;

    it('Is.composite: false', () => {
      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v) => {
        expect(Is.composite(v)).to.be.false;
      });
      expect(Is.composite({ digest: '0x123' })).to.be.false;
      expect(Is.composite({ parts: {} })).to.be.false;
    });

    it('Is.composite: true', () => {
      const hash = Hash.composite();
      const obj = hash.toObject();
      expect(Is.composite(hash)).to.eql(true);
      expect(Is.composite(obj)).to.eql(true);
      expect(Is.composite({ digest: '0x123', parts: {} })).to.be.true;
    });
  });

  describe('CompositeHash', () => {
    it('API', () => {
      expect(Hash.Composite).to.equal(CompositeHash);
      expect(Hash.composite).to.equal(CompositeHash.create);
    });

    it('create', () => {
      const a = Hash.composite();
      const b = Hash.composite();
      expect(a).to.not.equal(b); // NB: Different instances.
      expect(a.digest).to.eql('');
      expect(a.parts).to.eql({});
      expect(a.length).to.eql(0);
    });

    it('add/remove', () => {
      const hash = Hash.composite();
      const b = Hash.sha256('b');
      const c = Hash.sha256('c');

      hash.add('foo', 'a').add('foo', 'b').add('bar', 'c');
      expect(hash.length).to.eql(2);
      expect(hash.parts).to.eql({
        foo: b, // NB: replaced.
        bar: c,
      });

      hash.remove('404').remove('foo');
      expect(hash.length).to.eql(1);
      expect(hash.parts).to.eql({ bar: c });
    });

    it('parts is immutable', () => {
      const hash = Hash.composite().add('foo', '123456');
      expect(hash.parts).to.not.equal(hash.parts); // NB: distinct instance on each call.
    });

    it('digest: defaults', () => {
      const a = Hash.sha256('a');
      const b = Hash.sha256('b');
      const hash = Hash.composite();
      expect(hash.digest).to.eql('');

      hash.add('foo', 'a');
      expect(hash.digest).to.eql(Hash.sha256([a].join('\n')));
      expect(hash.digest).to.eql(Hash.Composite.digest(hash.parts));

      hash.add('bar', 'b');
      expect(hash.digest).to.eql(Hash.sha256([b, a].join('\n'))); // NB: sorted by key-name.
      expect(hash.digest).to.eql(Hash.Composite.digest(hash.parts));
      expect(hash.toString()).to.eql(hash.digest);

      hash.remove('foo').remove('bar');
      expect(hash.digest).to.eql('');
    });

    it('toObject', () => {
      const hash = Hash.composite();
      const a = hash.toObject();
      expect(a.digest).to.eql('');
      expect(a.parts).to.eql({});

      hash.add('foo', 'a').add('bar', 'b');

      const b = hash.toObject();
      expect(b.digest).to.eql(hash.digest);
      expect(b.parts).to.eql(hash.parts);

      expect((a as any).add).to.eql(undefined);
    });

    it('toString', () => {
      const hash = Hash.composite();
      expect(hash.toString()).to.eql('');

      hash.add('foo', 'a').add('bar', 'b');
      expect(hash.toString()).to.eql(hash.digest);
    });

    describe('alternative hash algorithms', () => {
      it('sha256 (default)', () => {
        const a = Hash.sha256('a');
        const b = Hash.sha256('b');
        const hash = Hash.composite({ hash: 'sha256' });
        expect(hash.digest).to.eql('');
        hash.add('foo', 'a').add('bar', 'b');
        expect(hash.digest).to.eql(Hash.sha256([b, a].join('\n')));
      });

      it('sha1', () => {
        const a = Hash.sha1('a');
        const b = Hash.sha1('b');
        const hash = Hash.composite('sha1');
        expect(hash.digest).to.eql('');
        hash.add('foo', 'a').add('bar', 'b');
        expect(hash.digest).to.eql(Hash.sha1([b, a].join('\n')));
      });

      it('toHash ← ƒ(n)', () => {
        const h = Hash.composite((_value) => 'apple');
        expect(h.digest).to.eql('');
        h.add('foo', 'abc').add('bar', 'def');
        expect(h.digest).to.eql('apple');
      });
    });
  });
});
