import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Str } from '../mod.ts';

describe('Str.builder', () => {
  it('type: Str.builder matches t.StrLib["builder"]', () => {
    expectTypeOf(Str.builder).toEqualTypeOf<t.StrLib['builder']>();
  });

  it('type: instance exposes the minimal chainable API', () => {
    const b = Str.builder();
    expectTypeOf(b.toString).toEqualTypeOf<() => string>();
    expectTypeOf(b.line).toEqualTypeOf<(input?: string) => t.StrBuilder>();
  });

  it('identity: line() returns the same instance for chaining', () => {
    const a = Str.builder();
    const b = a.line('one');
    expect(b).to.equal(a); // same instance (identity)
  });

  it('default: line() with no args uses Str.SPACE', () => {
    const out = Str.builder().line().toString();
    expect(out).to.eql(Str.SPACE);
  });

  it('newline: one newline per line() call (final newline trimmed in output)', () => {
    const out = Str.builder().line('A').line('B').toString();
    expect(out).to.eql('A\nB');
  });

  it('whitespace: preserves interior spaces before EOL', () => {
    const out = Str.builder().line('A ').line('B').toString();
    expect(out).to.eql('A \nB'); // space remains because it precedes a newline
  });

  it('trim-end: removes trailing spaces/newlines at the very end only', () => {
    const out1 = Str.builder().line('A  ').toString();
    expect(out1).to.eql('A'); // trailing spaces trimmed at end

    const out2 = Str.builder().line('A').line('   ').toString();
    expect(out2).to.eql('A'); // trailing space-only line trimmed

    const out3 = Str.builder().line('A').line('').toString();
    expect(out3).to.eql('A'); // trailing empty line trimmed
  });

  it('does not alter interior layout when additional lines follow', () => {
    const out = Str.builder().line('A  ').line('B').toString();
    expect(out).to.eql('A  \nB'); // interior trailing spaces preserved
  });

  it('idempotence: toString() is stable and side-effect free', () => {
    const b = Str.builder().line('A');
    const once = b.toString();
    const twice = b.toString();
    expect(once).to.eql('A');
    expect(twice).to.eql('A');
    // can continue appending after reads
    const after = b.line('B').toString();
    expect(after).to.eql('A\nB');
  });

  it('large: joining via chunks yields expected canonical output', () => {
    const b = Str.builder();
    for (let i = 0; i < 5; i++) b.line(`L${i}`);
    const out = b.toString();
    expect(out).to.eql('L0\nL1\nL2\nL3\nL4');
  });

  it('type: extended builder surface (blank/raw/lines/toText)', () => {
    const b = Str.builder();
    expectTypeOf(b.blank).toEqualTypeOf<(count?: number) => t.StrBuilder>();
    expectTypeOf(b.raw).toEqualTypeOf<(text: string) => t.StrBuilder>();
    expectTypeOf(b.lines).toEqualTypeOf<(items: readonly string[]) => t.StrBuilder>();
    expectTypeOf(b.toText).toEqualTypeOf<(options?: t.StrBuilderToTextOptions) => string>();
  });

  it('blank(): appends empty lines that are trimmed at the very end', () => {
    const out = Str.builder().line('A').blank(2).toString();
    // final trailing blank lines are removed by trimEnd
    expect(out).to.eql('A');
  });

  it('blank(): interior blank lines are preserved when followed by content', () => {
    const out = Str.builder().line('A').blank(2).line('B').toString();
    expect(out).to.eql('A\n\n\nB'); // A<eol> + blank<eol> + blank<eol> + B
  });

  it('raw(): appends verbatim text without automatic EOL', () => {
    const out = Str.builder().raw('A').raw('B').toString();
    expect(out).to.eql('AB');
  });

  it('raw(): trailing whitespace in final chunk is trimmed by default', () => {
    const out = Str.builder().raw('A  ').toString();
    expect(out).to.eql('A');
  });

  it('lines(): appends each item as a line', () => {
    const out = Str.builder().lines(['A', 'B', 'C']).toString();
    expect(out).to.eql('A\nB\nC');
  });

  it('toText({ trimEnd: false }): preserves trailing whitespace/newlines', () => {
    const b = Str.builder().line('A').line('');
    const trimmed = b.toString(); // default: trimEnd: true
    const untrimmed = b.toText({ trimEnd: false });

    expect(trimmed).to.eql('A'); // trailing empty line removed
    expect(untrimmed).to.eql('A\n\n'); // both EOLs preserved
  });

  it('toText({ trailingNewline: true }): ensures exactly one final EOL', () => {
    const b = Str.builder().line('A');
    const out = b.toText({ trailingNewline: true });
    expect(out).to.eql('A\n');
  });

  it('toText: trimEnd then trailingNewline (stable composition)', () => {
    const b = Str.builder().line('A  ').line('   ');
    const out = b.toText({ trimEnd: true, trailingNewline: true });
    // trailing spaces and the space-only line are removed, then a single newline appended
    expect(out).to.eql('A\n');
  });
});
