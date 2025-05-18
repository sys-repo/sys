import { type t, describe, expect, it, Pkg, Time } from '../-test.ts';
import { Hash } from '../m.Hash/mod.ts';
import { FileHashUri } from './m.Uri.ts';
import { CompositeHash } from './mod.ts';

const circular: any = { foo: 123 };
circular.ref = circular;

describe('hash', () => {
  it('API', () => {
    expect(CompositeHash.Uri.File).to.equal(FileHashUri);
  });

  describe('CompositeHash: <CompositeHash> ← generate', () => {
    it('toComposite', () => {
      const builder = CompositeHash.builder().add('foo', '1234');
      const a = CompositeHash.toComposite(builder);
      const b = CompositeHash.toComposite(builder.toObject());
      const c = CompositeHash.toComposite(); // NB: "empty"

      expect(Hash.Is.composite(a)).to.eql(true);
      expect(Hash.Is.composite(b)).to.eql(true);
      expect(Hash.Is.composite(c)).to.eql(true);

      expect(Hash.Is.compositeBuilder(a)).to.eql(false);
      expect(Hash.Is.compositeBuilder(b)).to.eql(false);
      expect(Hash.Is.compositeBuilder(c)).to.eql(false);

      expect(Hash.Is.empty(a)).to.eql(false);
      expect(Hash.Is.empty(b)).to.eql(false);
      expect(Hash.Is.empty(c)).to.eql(true);
    });

    describe('CompositeHash.build ← compsite-hash builder', () => {
      it('create', () => {
        const a = CompositeHash.builder();
        const b = CompositeHash.builder();
        expect(a).to.not.equal(b); // NB: Different instances.
        expect(a.digest).to.eql('');
        expect(a.parts).to.eql({});
        expect(a.length).to.eql(0);
      });

      it('create ← with {initial} items object', () => {
        const hash = CompositeHash.builder({
          initial: [
            { key: 'foo', value: 1 },
            { key: 'bar', value: 2 },
          ],
        });
        expect(hash.length).to.eql(2);
        expect(hash.parts['foo']).to.eql(Hash.sha256(1));
        expect(hash.parts['bar']).to.eql(Hash.sha256(2));
      });

      it('create ← with [initial] items array', () => {
        const hash = CompositeHash.builder([
          { key: 'foo', value: 1 },
          { key: 'bar', value: 2 },
        ]);
        expect(hash.length).to.eql(2);
        expect(hash.parts['foo']).to.eql(Hash.sha256(1));
        expect(hash.parts['bar']).to.eql(Hash.sha256(2));
      });

      it('{algo} parameter', () => {
        const algo = () => '0x1234';
        const a = CompositeHash.builder();
        const b = CompositeHash.builder({ algo: 'sha1' });
        const c = CompositeHash.builder({ algo: 'sha256' });
        const d = CompositeHash.builder({ algo });

        expect(a.algo).to.eql('sha256');
        expect(b.algo).to.eql('sha1');
        expect(c.algo).to.eql('sha256');
        expect(d.algo).to.eql(algo);
      });

      it('add/remove', () => {
        const hash = CompositeHash.builder();
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
        const hash = CompositeHash.builder().add('foo', '123456');
        expect(hash.parts).to.not.equal(hash.parts); // NB: distinct instance on each call.
      });

      it('digest: defaults', () => {
        const data = new Uint8Array([1, 2, 3]);
        const a = Hash.sha256('a');
        const b = Hash.sha256(data);
        const hash = CompositeHash.builder();
        expect(hash.digest).to.eql('');

        hash.add('foo', 'a');
        expect(hash.digest).to.eql(Hash.sha256([a].join('\n')));
        expect(hash.digest).to.eql(CompositeHash.digest(hash.parts));

        hash.add('bar', data);
        expect(hash.digest).to.eql(Hash.sha256([b, a].join('\n'))); // NB: sorted by key-name.
        expect(hash.digest).to.eql(CompositeHash.digest(hash.parts));
        expect(hash.toString()).to.eql(hash.digest);

        hash.remove('foo').remove('bar');
        expect(hash.digest).to.eql('');
      });

      it('toObject', () => {
        const hash = CompositeHash.builder();
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
        const hash = CompositeHash.builder();
        expect(hash.toString()).to.eql('');

        hash.add('foo', 'a').add('bar', 'b');
        expect(hash.toString()).to.eql(hash.digest);
      });

      describe('alternative hash algorithms', () => {
        it('sha256 (default)', () => {
          const a = Hash.sha256('a');
          const b = Hash.sha256('b');
          const hash = CompositeHash.builder({ algo: 'sha256' });
          expect(hash.digest).to.eql('');
          hash.add('foo', 'a').add('bar', 'b');
          expect(hash.digest).to.eql(Hash.sha256([b, a].join('\n')));
        });

        it('sha1', () => {
          const a = Hash.sha1('a');
          const b = Hash.sha1('b');
          const hash = CompositeHash.builder('sha1');
          expect(hash.digest).to.eql('');
          hash.add('foo', 'a').add('bar', 'b');
          expect(hash.digest).to.eql(Hash.sha1([b, a].join('\n')));
        });

        it('toHash ← ƒ(n)', () => {
          const h = CompositeHash.builder((_value) => 'apple');
          expect(h.digest).to.eql('');
          h.add('foo', 'abc').add('bar', 'def');
          expect(h.digest).to.eql('apple');
        });
      });
    });

    describe('CompositeHash.verify', () => {
      const setup = () => {
        const a = new Uint8Array([1, 2, 3]);
        const b = new Uint8Array([4, 5, 6]);
        const hash = CompositeHash.builder().add('./apple/a', a).add('./zoo/b', b);
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

      it('verify → NOT valid (subject data differs from {hash})', async () => {
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

      it('verify → NOT valid (different hash algoriths used)', async () => {
        // NB: this test also proves the {hash:algo} parameter works.
        const test = async (algo: t.HashAlgoInput) => {
          const sample = setup();
          const res = await CompositeHash.verify(sample.hash, {
            algo,
            async loader(e) {
              await Time.wait(0);
              if (e.part === './apple/a') return sample.a;
              if (e.part === './zoo/b') return sample.b;
            },
          });
          expect(res.is.valid).to.eql(false);
        };

        await test('sha1');
        await test(() => '0x1234');
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

  describe('CompositeHash.size ← parts', () => {
    it('sum: 3-files', () => {
      const builder = CompositeHash.builder()
        .add('a.ts', new Uint8Array([1, 2, 3]))
        .add('b.ts', new Uint8Array([1, 2]))
        .add('c.ts', new Uint8Array([1]));
      const hash = CompositeHash.toComposite(builder);
      const result = CompositeHash.size(hash.parts);
      expect(result).to.eql(6);
    });

    it('sum: filterd to 2-files', () => {
      const builder = CompositeHash.builder()
        .add('pkg/a.ts', new Uint8Array([1, 2, 3]))
        .add('pkg/b.ts', new Uint8Array([1, 2]))
        .add('foo.ts', new Uint8Array([999]));
      const hash = CompositeHash.toComposite(builder);
      const result = CompositeHash.size(hash.parts, (e) => Pkg.Dist.Is.codePath(e.path));
      expect(result).to.eql(5);
    });

    it('sum: no file content in URI', () => {
      const builder = CompositeHash.builder()
        .add('pkg/a.ts', 'string')
        .add('pkg/b.ts', 'not-file-no-size');

      const hash = CompositeHash.toComposite(builder);
      const res = CompositeHash.size(hash.parts);
      expect(res).to.eql(undefined);
    });
  });

  describe('FileHashUri', () => {
    it('toUri', () => {
      const a = FileHashUri.toUri('sha256-0000');
      const b = FileHashUri.toUri('sha256-0000', 1234);
      expect(a).to.eql('sha256-0000');
      expect(b).to.eql('sha256-0000:size=1234');
    });

    describe('FileHashUri.fromUri', () => {
      const { fromUri } = FileHashUri;

      it('returns empty hash for non-string inputs', () => {
        const bads = [123, true, null, {}, [], BigInt(0), Symbol()];
        bads.forEach((v: any) => {
          expect(fromUri(v)).to.eql({ hash: '' });
        });
      });

      it('returns empty hash for invalid format strings', () => {
        expect(fromUri('')).to.eql({ hash: '' });
        expect(fromUri('sha256-')).to.eql({ hash: '' });
        expect(fromUri('sha256-XYZ:size=123')).to.eql({ hash: '' }); // non-hex.
        expect(fromUri('sha256-abc123:size=12three')).to.eql({ hash: '' }); // bad bytes.
        expect(fromUri('totally-not-it')).to.eql({ hash: '' });
      });

      it('parses a valid hash without bytes', () => {
        expect(fromUri('sha256-abcdef012345')).to.eql({
          hash: 'sha256-abcdef012345',
        });
      });

      it('parses a valid hash with bytes', () => {
        expect(fromUri('sha256-abcdef012345:size=4096')).to.eql({
          hash: 'sha256-abcdef012345',
          bytes: 4096,
        });
      });
    });
  });
});
