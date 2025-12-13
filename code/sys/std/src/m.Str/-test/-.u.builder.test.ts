import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Str } from '../mod.ts';

describe('Str.builder', () => {
  /**
   * Type surface
   */
  describe('types', () => {
    it('type: Str.builder matches t.StrLib["builder"]', () => {
      expectTypeOf(Str.builder).toEqualTypeOf<t.StrLib['builder']>();
    });

    it('type: instance exposes the minimal chainable API', () => {
      const b = Str.builder();
      expectTypeOf(b.toString).toEqualTypeOf<() => string>();
      expectTypeOf(b.line).toEqualTypeOf<(input?: string) => t.StrBuilder>();
    });

    it('type: extended builder surface', () => {
      const b = Str.builder();
      expectTypeOf(b.blank).toEqualTypeOf<(count?: number) => t.StrBuilder>();
      expectTypeOf(b.empty).toEqualTypeOf<(count?: number) => t.StrBuilder>();
      expectTypeOf(b.raw).toEqualTypeOf<(text: string) => t.StrBuilder>();
      expectTypeOf(b.lines).toEqualTypeOf<(items: t.Ary<string>) => t.StrBuilder>();
      expectTypeOf(b.toText).toEqualTypeOf<(options?: t.StrBuilderToTextOptions) => string>();
    });

    it('type: indent() exposes scoped indentation API', () => {
      const b = Str.builder();
      expectTypeOf(b.indent).toEqualTypeOf<
        (spaces: number, fn: (bb: t.StrBuilder) => void) => t.StrBuilder
      >();
    });
  });

  /**
   * Options
   */
  describe('options', () => {
    it('respects defaultEmpty when line() called without args', () => {
      const b = Str.builder({ defaultEmpty: '<empty>' });
      b.line();
      expect(b.toString()).to.eql('<empty>');
    });

    it('respects custom eol (\\r\\n)', () => {
      const b = Str.builder({ eol: '\r\n' });
      b.line('foo');
      expect(b.toText({ trailingNewline: true, trimEnd: false })).to.eql('foo\r\n');
    });
  });

  /**
   * line()
   */
  describe('line()', () => {
    it('identity: line() returns the same instance for chaining', () => {
      const a = Str.builder();
      const b = a.line('one');
      expect(b).to.equal(a);
    });

    it('default: line() with no args uses Str.SPACE', () => {
      const out = Str.builder().line().toString();
      expect(out).to.eql(Str.SPACE);
    });

    it('produces one newline per call (final newline trimmed)', () => {
      const out = Str.builder().line('A').line('B').toString();
      expect(out).to.eql('A\nB');
    });

    it('preserves interior trailing spaces', () => {
      const out = Str.builder().line('A ').line('B').toString();
      expect(out).to.eql('A \nB');
    });
  });

  /**
   * blank()
   */
  describe('blank()', () => {
    it('appends intentional blank lines that are preserved at the very end', () => {
      const out = Str.builder().line('A').blank(2).toString();
      expect(out).to.eql(`A\n${Str.SPACE}\n${Str.SPACE}`);
    });

    it('preserves interior blank lines when followed by content', () => {
      const out = Str.builder().line('A').blank(2).line('B').toString();
      expect(out).to.eql(`A\n${Str.SPACE}\n${Str.SPACE}\nB`);
    });
  });

  /**
   * empty()
   */
  describe('empty()', () => {
    it('appends empty lines that are trimmed at the very end', () => {
      const out = Str.builder().line('A').empty(2).toString();
      expect(out).to.eql('A');
    });

    it('preserves interior empty lines when followed by content', () => {
      const out = Str.builder().line('A').empty(2).line('B').toString();
      expect(out).to.eql('A\n\n\nB');
    });
  });

  /**
   * raw()
   */
  describe('raw()', () => {
    it('appends verbatim text without automatic EOL', () => {
      const out = Str.builder().raw('A').raw('B').toString();
      expect(out).to.eql('AB');
    });
  });

  /**
   * lines()
   */
  describe('lines()', () => {
    it('appends each item as a line', () => {
      const out = Str.builder().lines(['A', 'B', 'C']).toString();
      expect(out).to.eql('A\nB\nC');
    });
  });

  /**
   * toText()
   */
  describe('toText()', () => {
    it('toText({ trimEnd:false }) preserves empty tail', () => {
      const b = Str.builder().line('A').empty();
      const out = b.toText({ trimEnd: false });
      expect(out).to.eql('A\n\n');
    });

    it('toText({ trailingNewline:true }) ensures exactly one final EOL', () => {
      const out = Str.builder().line('A').toText({ trailingNewline: true });
      expect(out).to.eql('A\n');
    });
  });

  /**
   * indent()
   */
  describe('indent()', () => {
    it('prefixes lines in the scoped block', () => {
      const out = Str.builder()
        .indent(2, (b) => {
          b.line('A');
          b.line('B');
        })
        .toString();

      expect(out).to.eql('  A\n  B');
    });

    it('nested indentation composes prefixes', () => {
      const out = Str.builder()
        .indent(2, (b) => {
          b.line('A');
          b.indent(2, (bb) => {
            bb.line('B');
          });
        })
        .toString();

      expect(out).to.eql('  A\n    B');
    });

    it('blank() inside indent emits visually nested whitespace', () => {
      const out = Str.builder()
        .indent(2, (b) => {
          b.line('A');
          b.blank(2);
          b.line('B');
        })
        .toString();

      expect(out).to.eql(`  A\n  ${Str.SPACE}\n  ${Str.SPACE}\n  B`);
    });
  });
});
