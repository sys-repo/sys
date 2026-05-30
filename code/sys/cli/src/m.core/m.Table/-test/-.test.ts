import { c, describe, expect, it, stripAnsi } from '../../../-test.ts';
import { Cli } from '../../mod.ts';

describe('CLI: core / m.Table', () => {
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
