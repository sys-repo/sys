import type { CliTable as CliTableFromT } from '@sys/cli/t';
import { c, describe, expect, expectTypeOf, it, Str, stripAnsi, type t } from '../../../-test.ts';
import { Cli } from '../../mod.ts';
import type { CliffyTable } from '../../t.ext.ts';
import { pairs } from '../u.pairs.ts';

type AssertFalse<T extends false> = T;
type PublicCliffyTable = { [K in keyof CliffyTable]: CliffyTable[K] };

describe('CLI: core / m.Table', () => {
  it('exposes one exact canonical type surface', () => {
    const table = Cli.Table.create();
    const pair: t.Cli.Table.Pair = ['label', 'value'];

    expect(Cli.Table.pairs).to.equal(pairs);
    expectTypeOf(Cli.Table).toEqualTypeOf<t.CliTable.Lib>();
    expectTypeOf(Cli.Table).toEqualTypeOf<t.Cli.Table.Lib>();
    expectTypeOf(Cli.Table).toEqualTypeOf<CliTableFromT.Lib>();
    expectTypeOf(Cli.Table.create).toEqualTypeOf<t.Cli.Table.Create>();
    expectTypeOf(Cli.Table.create).toEqualTypeOf<CliTableFromT.Create>();
    expectTypeOf(Cli.Table.pairs).toEqualTypeOf<t.Cli.Table.Pairs>();
    expectTypeOf(Cli.Table.pairs).toEqualTypeOf<CliTableFromT.Pairs>();
    expectTypeOf(pair).toEqualTypeOf<CliTableFromT.Pair>();
    expectTypeOf(pair).toEqualTypeOf<readonly [string, string]>();
    expectTypeOf(table).toEqualTypeOf<t.CliTable.Instance>();
    expectTypeOf(table).toEqualTypeOf<CliffyTable>();
    expectTypeOf(table).toEqualTypeOf<t.Cli.Table.Instance>();
    expectTypeOf(table).toEqualTypeOf<CliTableFromT.Instance>();

    const publicShapeIsAssignable: AssertFalse<
      PublicCliffyTable extends t.CliTable.Instance ? true : false
    > = false;
    expect(publicShapeIsAssignable).to.eql(false);
  });

  it('fitted pairs → no surrounding newlines or trailing value padding', () => {
    expect(Cli.Table.pairs([], 8)).to.eql('');
    const rows: readonly t.Cli.Table.Pair[] = [['name', 'one'], ['root', 'dist/']];
    expect(Cli.Table.pairs(rows, 8)).to.eql(Str.dedent(`
      name    one
      root    dist/
    `));
    expect(rows).to.eql([['name', 'one'], ['root', 'dist/']]);
  });

  it('fitted pairs → ANSI, OSC 8 and Unicode labels align by terminal cells', () => {
    const target = new URL(`file:///fixture/${'directory/'.repeat(20)}`);
    const label = Cli.Fmt.hyperlink(c.cyan('東京'), target);
    const value = Cli.Fmt.hyperlink(c.green('value'), new URL('dist.json', target));
    const output = Cli.Table.pairs([[label, value], [c.gray('e\u0301'), 'next']], 8);

    expect(output).to.contain(label);
    expect(output).to.contain(value);
    expect(stripAnsi(output)).to.eql(Str.dedent(`
      東京    value
      e\u0301       next
    `));
    expect(output.split('\n').map(Cli.Fmt.Text.Width.measure)).to.eql([13, 12]);
  });

  it('fitted pairs → preserves independently balanced ANSI on continuation lines', () => {
    // Literal controls keep this byte-preservation proof independent of color detection.
    const label = '\x1b[31mA\x1b[0m';
    const value = '\x1b[34mone\x1b[0m';
    const output = Cli.Table.pairs([
      [`${label}\nB`, `plain\n${value}\nplain`],
      ['C', 'tail'],
    ], 4);

    expect(output).to.eql(Str.dedent(`
      ${label}   plain
      B   ${value}
          plain
      C   tail
    `));
  });

  it('fitted pairs → preserves independently closed OSC 8 links on continuation lines', () => {
    const target = new URL('https://example.test/');
    const first = Cli.Fmt.hyperlink('A', target);
    const second = Cli.Fmt.hyperlink('B', new URL('other', target));
    const value = Cli.Fmt.hyperlink('linked', new URL('value', target));
    const output = Cli.Table.pairs([
      [`${first}\n${second}`, `plain\n${value}\nplain`],
      ['C', 'tail'],
    ], 4);

    expect(output).to.eql(Str.dedent(`
      ${first}   plain
      ${second}   ${value}
          plain
      C   tail
    `));
  });

  it('fitted pairs → uneven multiline cells retain blank and continuation lines', () => {
    const output = Cli.Table.pairs([
      ['One\nTwo\nThree', 'first'],
      ['Field', 'line 1\n\nline 3'],
    ], 8);
    expect(output).to.eql(Str.dedent(`
      One     first
      Two${' '.repeat(5)}
      Three${' '.repeat(3)}
      Field   line 1
      ${' '.repeat(8)}
      ${' '.repeat(8)}line 3
    `));
  });

  it('fitted pairs → preserves empty rows and authored trailing line breaks', () => {
    const output = Cli.Table.pairs([['', ''], ['\n', 'value\n']], 2);
    // Exact padding and trailing LF-delimited empty cells are the contract under test.
    expect(output).to.eql('  \n  value\n  ');
  });

  it('fitted pairs → fitting remains the caller’s responsibility', () => {
    expect(Cli.Table.pairs([['long label', 'long value']], 4)).to.eql('long labellong value');
    expect(Cli.Table.pairs([['', 'value']], 0)).to.eql('value');
  });

  it('creates with/without params', () => {
    const a = Cli.table([]);
    const b = Cli.table();

    a.push(['foo', 'bar']);
    b.push(['foo', 'bar']);

    expect(Cli.Table.cellGap).to.eql(3);
    expect(tableLines(a)).to.eql(['foo   bar']);
    expect(tableLines(b)).to.eql(['foo   bar']);
  });

  it('renders explicit multiline text in any column', () => {
    const second = Cli.table([]);
    second.push(['Name', 'alpha\nbeta']);

    expect(tableLines(second)).to.eql([
      'Name   alpha',
      '       beta',
    ]);

    const first = Cli.table([]);
    first.push(['One\nTwo', 'value']);

    expect(tableLines(first)).to.eql([
      'One   value',
      'Two',
    ]);
  });

  it('preserves blank lines inside multiline cells', () => {
    const table = Cli.table([]);
    table.push(['Field', 'line 1\n\nline 3']);

    expect(tableLines(table)).to.eql([
      'Field   line 1',
      '',
      '        line 3',
    ]);
  });

  it('aligns multiline cells by visible width when ANSI is present', () => {
    const table = Cli.table([]);
    table.push([c.green('Name'), `${c.cyan('alpha')}\n${c.cyan('beta')}`]);
    table.push(['Longer', 'x']);

    expect(tableLines(table)).to.eql([
      'Name     alpha',
      '         beta',
      'Longer   x',
    ]);
  });
});

function tableLines(input: unknown): readonly string[] {
  const lines = stripAnsi(String(input)).split('\n').map((line) => line.trimEnd());
  while (lines[0] === '') lines.shift();
  while (lines.at(-1) === '') lines.pop();
  return lines;
}
