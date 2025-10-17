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
});
