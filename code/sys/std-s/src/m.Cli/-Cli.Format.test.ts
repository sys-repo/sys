import { describe, expect, it, type t } from '../-test.ts';
import { Format } from './mod.ts';

describe('Cli.Format', () => {
  const wrap = (outer: string) => (inner: string) => `[${outer}]${inner}[/${outer}]`;
  const green = wrap('g');
  const white = wrap('w');
  const c = { white, green } as const;

  describe('Format.path', () => {
    it('empty / invalid', () => {
      expect(Format.path('')).to.eql('');
      const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v: any) => {
        expect(Format.path(v).startsWith('[Invalid:')).to.be.true;
      });
    });

    it('no formatter function provided', () => {
      expect(Format.path('')).to.eql('');
      expect(Format.path('foo')).to.eql('foo');
      expect(Format.path('foo/bar')).to.eql('foo/bar');
    });

    it('part splitting', () => {
      const test = (path: string, expectTotal: number) => {
        const fired: t.CliPathFormatterArgs[] = [];
        const res = Format.path(path, (e) => fired.push(e));
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

    it('conditional formatting', () => {
      const path = 'foo/bar/a.ts';
      const test = (expected: string, fmt: t.CliPathFormatter) => {
        const res = Format.path(path, fmt);
        expect(res).to.eql(expected);
      };
      test('foo/bar/a.ts', () => null);
      test('foo/bar/[w]a.ts[/w]', (e) => {
        if (e.is.basename) e.change(c.white(e.text));
      });
      test('foo[g]\\[/g]bar[g]\\[/g]a.ts', (e) => {
        if (e.is.slash) e.change(c.green('\\'));
      });
    });

    it('cumlative changes', () => {
      const res = Format.path('/foo/bar', (e) => {
        if (e.index === 1) {
          e.change(c.green(e.text));
          e.change(c.white(e.text));
        }
      });
      expect(res).to.eql('/[w][g]foo[/g][/w]/bar');
    });
  });
});
