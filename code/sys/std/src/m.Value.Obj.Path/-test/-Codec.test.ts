import { type t, c, describe, expect, it } from '../../-test.ts';
import { Str } from '../../m.Value.Str/mod.ts';
import { Codec } from '../m.Codec.ts';
import { Path } from '../mod.ts';

describe('Path.Codec', () => {
  describe('print', () => {
    const printCodec = (codec: t.ObjectPathCodec, example: (string | number)[]) => {
      console.info(Str.SPACE);
      console.info(c.cyan(`Obj.Path.Codec.${c.bold(codec.kind)}:`));
      console.info(codec);
      console.info(c.gray('\nExample:'));
      console.info(c.cyan(`ƒ encode( [path] ):`), codec.encode(example));
      console.info(c.cyan(`ƒ decode( "path" ):`), codec.decode(codec.encode(example)));
      console.info(Str.SPACE);
    };

    it('pointer', () => {
      printCodec(Codec.pointer, ['a/b', 'c~d', 0, 'x.y', 'z[w]']);
    });

    it('dot', () => {
      printCodec(Codec.dot, ['a.b', 'c[d]', 'e\\f', 'g]h[', 'plain', 0, 10]);
    });
  });

  describe('core: RFC 6901 JSON Pointer', () => {
    describe('defaults', () => {
      it('exposes codecs and sets pointer as default', () => {
        expect(Codec.pointer.kind).to.eql('pointer');
        expect(Codec.dot.kind).to.eql('dot');

        // Default is pointer (by identity or by name):
        expect(Codec.default).to.equal(Codec.pointer);
        expect(Codec.default.kind).to.eql('pointer');
      });
    });

    describe('pointer (RFC 6901)', () => {
      it('encode: root → empty string', () => {
        expect(Codec.pointer.encode([])).to.eql('');
      });

      it('decode: empty string → root', () => {
        expect(Codec.pointer.decode('')).to.eql([]);
      });

      it('encode/decode: simple path', () => {
        const path = ['foo', 'bar', 0] as const;
        const text = Codec.pointer.encode(path as unknown as (string | number)[]);
        expect(text).to.eql('/foo/bar/0');
        expect(Codec.pointer.decode(text)).to.eql(['foo', 'bar', '0']); // ← strings
      });

      it('escape round-trip: "/" and "~" inside keys', () => {
        const path = ['a/b', 'c~d'];
        const text = Codec.pointer.encode(path);
        expect(text).to.eql('/a~1b/c~0d');
        expect(Codec.pointer.decode(text)).to.eql(['a/b', 'c~d']);
      });

      it('numeric tokens are returned as strings', () => {
        expect(Codec.pointer.decode('/arr/0')).to.eql(['arr', '0']); // ← strings
        expect(Codec.pointer.decode('/10/2')).to.eql(['10', '2']); // ← strings
      });

      it('rejects invalid non-root text not starting with "/"', () => {
        expect(() => Codec.pointer.decode('foo/bar')).to.throw(
          'Invalid JSON Pointer: must start with "/" or be "".',
        );
      });
    });

    describe('dot (developer-friendly)', () => {
      it('encode: root → empty string', () => {
        expect(Codec.dot.encode([])).to.eql('');
      });

      it('decode: empty string → root', () => {
        expect(Codec.dot.decode('')).to.eql([]);
      });

      it('encode/decode: identifiers + array indices', () => {
        const path = ['foo', 'bar', 0, 'baz', 10];
        const text = Codec.dot.encode(path);
        // identifiers join with dots; numbers become bracket indices
        expect(text).to.eql('foo.bar[0].baz[10]');
        expect(Codec.dot.decode(text)).to.eql(['foo', 'bar', 0, 'baz', 10]);
      });

      it('escape round-trip: ".", "[", "]", and "\\" inside keys', () => {
        const path = ['a.b', 'c[d]', 'e\\f', 'g]h[', 'plain'];
        const text = Codec.dot.encode(path);
        expect(text).to.eql('a\\.b.c\\[d\\].e\\\\f.g\\]h\\[.plain');
        expect(Codec.dot.decode(text)).to.eql(['a.b', 'c[d]', 'e\\f', 'g]h[', 'plain']);
      });

      it('numeric-looking bare identifiers remain strings; bracket numbers become indices', () => {
        // Bare token "0" stays a string key:
        expect(Codec.dot.decode('root.0')).to.eql(['root', '0']);
        // Bracket form turns into numbers:
        expect(Codec.dot.decode('root[0][10]')).to.eql(['root', 0, 10]);
      });

      it('errors on unclosed bracket', () => {
        expect(() => Codec.dot.decode('foo[0')).to.throw('Unclosed bracket in path.');
      });

      it('errors on dangling escape', () => {
        expect(() => Codec.dot.decode('foo\\')).to.throw('Invalid escape at end of path.'); // ← fixed
      });
    });

    describe('parity & round-trip across codecs', () => {
      const cases: (string | number)[][] = [
        [],
        ['foo'],
        ['foo', 0, 'bar'],
        ['a/b', 'c~d', 10, 'x.y', 'z[w]'],
        ['\\', '.', '[', ']', '0', '01'], // tricky keys
      ];

      it('pointer: path → encode → decode → same path', () => {
        for (const path of cases) {
          const text = Codec.pointer.encode(path);
          const back = Codec.pointer.decode(text); // strings only
          const asStrings = path.map((k) => String(k)); // preserve '01' vs '1'
          expect(back).to.eql(asStrings);
        }
      });

      it('dot: path → encode → decode → same path', () => {
        for (const path of cases) {
          const text = Codec.dot.encode(path);
          const back = Codec.dot.decode(text);
          expect(back).to.eql(path);
        }
      });

      it('interchange: encode with pointer, decode with pointer (lossless chars, not types)', () => {
        const path = ['a/b', 'c~d', 0, 'x.y', 'z[w]'];
        const text = Codec.pointer.encode(path);
        const back = Codec.pointer.decode(text); // string[]
        const asStrings = path.map((k) => String(k)); // preserve '01' vs '1'
        expect(back).to.eql(asStrings);
      });
    });
  });

  describe('Path.encode/decode (methods)', () => {
    describe('defaults', () => {
      it('encode/decode default to pointer', () => {
        const path = ['foo', 'bar', 0] as const;
        const text = Path.encode(path as unknown as (string | number)[]);
        expect(text).to.eql('/foo/bar/0');

        // default decode = pointer (strings only)
        const back = Path.decode(text);
        expect(back).to.eql(['foo', 'bar', '0']);
      });
    });

    describe('codec option', () => {
      it('codec: "dot" encodes/decodes with dot', () => {
        const path = ['foo', 'bar', 0, 'baz', 10] as const;

        const text = Path.encode(path as unknown as (string | number)[], { codec: 'dot' });
        expect(text).to.eql('foo.bar[0].baz[10]');

        const back = Path.decode(text, { codec: 'dot' });
        expect(back).to.eql(['foo', 'bar', 0, 'baz', 10]);
      });
    });

    describe('numeric option', () => {
      it('pointer + numeric: digit-only tokens → numbers', () => {
        const text = '/user/tags/0/id';
        const back = Path.decode(text, { codec: 'pointer', numeric: true });
        expect(back).to.eql(['user', 'tags', 0, 'id']);
      });

      it('pointer (default) without numeric: tokens remain strings', () => {
        const text = '/user/tags/0/id';
        const back = Path.decode(text); // default pointer, numeric=false
        expect(back).to.eql(['user', 'tags', '0', 'id']);
      });

      it('dot + numeric: numeric flag has no effect (already numbers)', () => {
        const text = 'user.tags[0].id';
        const back = Path.decode(text, { codec: 'dot', numeric: true });
        expect(back).to.eql(['user', 'tags', 0, 'id']);
      });

      it('asNumeric: post-process a decoded pointer path', () => {
        const decoded = Path.decode('/a/10/b/01'); //     ← default pointer → strings.
        const coerced = Path.asNumeric(decoded);
        expect(coerced).to.eql(['a', 10, 'b', '01']); //  ← NB: '01' preserved.
        expect(Path.asNumeric(['00', '0', '01', '10'])).to.eql(['00', 0, '01', 10]);
      });
    });

    describe('round-trip via namespace', () => {
      it('pointer: path → encode → decode → stringified path', () => {
        const cases: (string | number)[][] = [
          [],
          ['foo'],
          ['foo', 0, 'bar'],
          ['a/b', 'c~d', 10, 'x.y', 'z[w]'],
          ['\\', '.', '[', ']', '0', '01'],
        ];
        for (const path of cases) {
          const text = Path.encode(path);
          const back = Path.decode(text); // pointer, strings only
          const asStrings = path.map((k) => String(k));
          expect(back).to.eql(asStrings);
        }
      });

      it('pointer + numeric: path → encode → decode(numeric) → numeric indices', () => {
        const path = ['user', 'tags', 0, 'id'] as const;
        const text = Path.encode(path as unknown as (string | number)[]);
        const back = Path.decode(text, { numeric: true }); // pointer default + numeric
        expect(back).to.eql(['user', 'tags', 0, 'id']);
      });

      it('dot: path → encode → decode → same path', () => {
        const path = ['foo', 'bar', 0, 'baz', 10] as const;
        const text = Path.encode(path as unknown as (string | number)[], { codec: 'dot' });
        const back = Path.decode(text, { codec: 'dot' });
        expect(back).to.eql(['foo', 'bar', 0, 'baz', 10]);
      });
    });
  });
});
