import { describe, expect, it, Time } from '../-test.ts';
import { CompositeHash, Hash } from './mod.ts';

const circular: any = { foo: 123 };
circular.ref = circular;

describe('hash', () => {
  describe('Hash.Composite: <CompositeHash>', () => {
    it('API', () => {
      expect(Hash.Composite).to.equal(CompositeHash);
      expect(Hash.composite).to.equal(CompositeHash.builder);
    });

    it('empty', () => {
      const a = Hash.Composite.empty();
      const b = Hash.Composite.empty();
      expect(a).to.eql({ digest: '', parts: {} });
      expect(a).to.not.equal(b);
    });

    describe('Hash.Composite.build ← compsite-hash builder', () => {
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
        const data = new Uint8Array([1, 2, 3]);
        const a = Hash.sha256('a');
        const b = Hash.sha256(data);
        const hash = Hash.composite();
        expect(hash.digest).to.eql('');

        hash.add('foo', 'a');
        expect(hash.digest).to.eql(Hash.sha256([a].join('\n')));
        expect(hash.digest).to.eql(Hash.Composite.digest(hash.parts));

        hash.add('bar', data);
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

    describe('Hash.Composite.verify', () => {
      const setup = () => {
        const a = new Uint8Array([1, 2, 3]);
        const b = new Uint8Array([4, 5, 6]);
        const hash = Hash.Composite.builder().add('./apple/a', a).add('./zoo/b', b);
        return { a, b, hash };
      };

      it('verify → is valid', async () => {
        const { a, b, hash } = setup();
        const res = await CompositeHash.verify(hash, async (e) => {
          await Time.wait(0);
          if (e.part === './apple/a') return a;
          if (e.part === './zoo/b') return b;
        });

        expect(res.hash.a).to.eql(hash.toObject());
        expect(res.hash.b).to.eql(hash.toObject());
        expect(res.is.valid).to.eql(true);
        expect(res.error).to.eql(undefined);
      });

      it('verify → not valid', async () => {
        const { a, hash } = setup();
        const b = new Uint8Array([11, 22, 33]);
        const res = await CompositeHash.verify(hash, async (e) => {
          await Time.wait(0);
          if (e.part === './apple/a') return a;
          if (e.part === './zoo/b') return b;
        });

        expect(res.hash.a).to.eql(hash.toObject());
        expect(res.hash.b).to.not.eql(hash.toObject());
        expect(res.is.valid).to.eql(false);
        expect(res.error).to.eql(undefined);
      });

      describe('errors', () => {
        it('part data not retrieved', async () => {
          const { a, hash } = setup();
          const res = await CompositeHash.verify(hash, async (e) => {
            await Time.wait(0);
            if (e.part === './apple/a') return a;
          });
          expect(res.error?.message).to.include('loader did not return content for part');
        });
      });
    });
  });
});
