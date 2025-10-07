import { describe, expect, it, type t } from '../-test.ts';
import { Format, Path } from './mod.ts';

describe('Path.Format', () => {
  const wrap = (outer: string) => (inner: string) => `[${outer}]${inner}[/${outer}]`;
  const green = wrap('g');
  const white = wrap('w');
  const c = { white, green } as const;

  it('API', () => {
    expect(Path.Format).to.equal(Format);
  });

  describe('Format.path', () => {
    it('empty / invalid', () => {
      expect(Format.string('')).to.eql('');
      const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v: any) => {
        expect(Format.string(v).startsWith('[Invalid:')).to.be.true;
      });
    });

    it('no formatter function provided', () => {
      expect(Format.string('')).to.eql('');
      expect(Format.string('foo')).to.eql('foo');
      expect(Format.string('foo/bar')).to.eql('foo/bar');
    });

    it('part splitting', () => {
      const test = (path: string, expectTotal: number) => {
        const fired: t.PathFormatterArgs[] = [];
        const res = Format.string(path, (e) => fired.push(e));
        expect(res).to.eql(path);
        expect(fired.length).to.eql(expectTotal);
      };

      test('/foo/bar/', 5);
      test('/', 1);
      test('/foo', 2);
      test('foo/', 2);
      test('/foo/', 3);
      test('/foo/a', 4);
    });

    it('each formatter callback receives the original path', () => {
      const path = '/foo/bar/a.ts';
      const seen: string[] = [];

      const res = Format.string(path, (e) => {
        seen.push(e.path);
        if (e.is.basename) e.change(`[BASENAME:${e.part}]`);
      });

      expect(res).to.eql('/foo/bar/[BASENAME:a.ts]');
      expect(seen.length).to.be.greaterThan(0);
      expect(seen.every((p) => p === path)).to.eql(true);
    });

    it('derives kind correctly with and without trailing slash', () => {
      const kinds = (path: string) => {
        const out: t.PathFormatterPart['kind'][] = [];
        Format.string(path, (e) => out.push(e.kind));
        return out;
      };
      expect(kinds('foo/bar')).to.eql(['dirname', 'slash', 'basename']);
      expect(kinds('foo/bar/')).to.eql(['dirname', 'slash', 'basename', 'slash']);
    });

    it('conditional formatting', () => {
      const path = 'foo/bar/a.ts';
      const test = (expected: string, fmt: t.PathFormatter) => {
        const res = Format.string(path, fmt);
        expect(res).to.eql(expected);
      };
      test('foo/bar/a.ts', () => null);
      test('foo/bar/[w]a.ts[/w]', (e) => {
        if (e.is.basename) e.change(c.white(e.part));
      });
      test('foo[g]\\[/g]bar[g]\\[/g]a.ts', (e) => {
        if (e.is.slash) e.change(c.green('\\'));
      });
    });

    it('cumlative changes', () => {
      const res = Format.string('/foo/bar', (e) => {
        if (e.index === 1) {
          e.change(c.green(e.part));
          e.change(c.white(e.part));
        }
      });
      expect(res).to.eql('/[w][g]foo[/g][/w]/bar');
    });
  });
});
