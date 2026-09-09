import type { CliTable as CliTableFromT } from '@sys/cli/t';
import type { CliTable as CliTableFromTypes } from '@sys/cli/types';
import { c, describe, expect, expectTypeOf, it, stripAnsi, type t } from '../../../-test.ts';
import { Cli } from '../../mod.ts';
import type { CliffyTable } from '../../t.ext.ts';

type AssertFalse<T extends false> = T;
type PublicCliffyTable = { [K in keyof CliffyTable]: CliffyTable[K] };

describe('CLI: core / m.Table', () => {
  it('exposes one exact canonical type surface', () => {
    const table = Cli.Table.create();

    expectTypeOf(Cli.Table).toEqualTypeOf<t.CliTable.Lib>();
    expectTypeOf(Cli.Table).toEqualTypeOf<t.Cli.Table.Lib>();
    expectTypeOf(Cli.Table).toEqualTypeOf<CliTableFromT.Lib>();
    expectTypeOf(Cli.Table).toEqualTypeOf<CliTableFromTypes.Lib>();
    expectTypeOf(table).toEqualTypeOf<t.CliTable.Instance>();
    expectTypeOf(table).toEqualTypeOf<CliffyTable>();
    expectTypeOf(table).toEqualTypeOf<t.Cli.Table.Instance>();
    expectTypeOf(table).toEqualTypeOf<CliTableFromT.Instance>();
    expectTypeOf(table).toEqualTypeOf<CliTableFromTypes.Instance>();

    const publicShapeIsAssignable: AssertFalse<
      PublicCliffyTable extends t.CliTable.Instance ? true : false
    > = false;
    expect(publicShapeIsAssignable).to.eql(false);
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
