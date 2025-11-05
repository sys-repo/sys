import { describe, expect, it } from '../../-test.ts';
import { Str } from '../common.ts';
import { Yaml } from '../mod.ts';

describe('Yaml.Range', () => {
  describe('Range.toLinePos', () => {
    const { toLinePos } = Yaml.Range;

    it('converts offsets within a single line', () => {
      const text = 'abcde';
      const [from, to] = toLinePos(text, [1, 4]);
      expect(from).to.eql({ line: 1, col: 2 });
      expect(to).to.eql({ line: 1, col: 5 });
    });

    it('converts offsets across multiple lines', () => {
      const text = Str.dedent(`
      foo
      bar
      baz
      `);
      // Offsets chosen across line breaks:
      const [from, to] = toLinePos(text, [2, 8]);
      expect(from.line).to.eql(1);
      expect(to.line).to.be.greaterThan(from.line);
    });

    it('handles 3-tuple ranges (ignoring third element)', () => {
      const text = 'a\nb\nc';
      const [from, to] = toLinePos(text, [0, 2, 5]);
      expect(from).to.eql({ line: 1, col: 1 });
      expect(to.line).to.eql(2);
    });

    it('returns first line for zero-length range', () => {
      const text = 'foo\nbar';
      const [from, to] = toLinePos(text, [0, 0]);
      expect(from).to.eql({ line: 1, col: 1 });
      expect(to).to.eql({ line: 1, col: 1 });
    });

    it('counts lines correctly with trailing newline', () => {
      const text = 'a\nb\n';
      const [from, to] = toLinePos(text, [0, text.length]);
      expect(to.line).to.eql(3);
    });

    it('handles empty string gracefully', () => {
      const [from, to] = toLinePos('', [0, 0]);
      expect(from).to.eql({ line: 1, col: 1 });
      expect(to).to.eql({ line: 1, col: 1 });
    });
  });

  describe('Range.normalize', () => {
    it('returns undefined for falsy input', () => {
      expect(Yaml.Range.normalize(undefined)).to.eql(undefined);
      expect(Yaml.Range.normalize(null)).to.eql(undefined);
    });

    it('passes through [start,end] unchanged', () => {
      const r = [3, 9] as const;
      const out = Yaml.Range.normalize(r);
      expect(out).to.eql([3, 9]);
    });

    it('passes through [start,valueEnd,nodeEnd] unchanged', () => {
      const r = [5, 12, 14] as const;
      const out = Yaml.Range.normalize(r);
      expect(out).to.eql([5, 12, 14]);
    });

    it('coerces [start,end,undefined] → [start,end]', () => {
      const r = [7, 31, undefined] as const;
      const out = Yaml.Range.normalize(r);
      expect(out).to.eql([7, 31]);
    });

    it('accepts mutable arrays (number[])', () => {
      const mutable: number[] = [2, 8];
      const out = Yaml.Range.normalize(mutable);
      expect(out).to.eql([2, 8]);
    });

    it('accepts readonly arrays (ReadonlyArray<number|undefined>)', () => {
      const readonlyArr: ReadonlyArray<number | undefined> = [10, 20, undefined] as const;
      const out = Yaml.Range.normalize(readonlyArr);
      expect(out).to.eql([10, 20]);
    });

    it('ignores elements beyond the third', () => {
      const out = Yaml.Range.normalize([1, 4, 9, 99, 123]);
      expect(out).to.eql([1, 4, 9]);
    });

    it('returns undefined for malformed arrays', () => {
      expect(Yaml.Range.normalize([])).to.eql(undefined);
      expect(Yaml.Range.normalize([5])).to.eql(undefined);
      // @ts-expect-error: bad types on purpose
      expect(Yaml.Range.normalize([1, 'x'])).to.eql(undefined);
      expect(Yaml.Range.normalize([NaN, 3])).to.eql(undefined);
      expect(Yaml.Range.normalize([2, Infinity])).to.eql(undefined);
    });

    it('is idempotent on normalized outputs', () => {
      const r1 = [2, 8] as const;
      const r2 = [10, 20, 24] as const;
      expect(Yaml.Range.normalize(Yaml.Range.normalize(r1)!)).to.eql([2, 8]);
      expect(Yaml.Range.normalize(Yaml.Range.normalize(r2)!)).to.eql([10, 20, 24]);
    });
  });
});
