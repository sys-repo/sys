import { describe, expect, it, Cli } from '../../-test.ts';
import { rootRows } from '../u.rows.ts';

describe('Root Rows', () => {
  it('uses plural alias label when multiple aliases are registered', () => {
    const row = rootRows().find((item) => item.command === 'fn');
    expect(Cli.stripAnsi(row?.columns[0] ?? '')).to.contain('@sys/tools ƒn');
    expect(Cli.stripAnsi(row?.columns[1] ?? '')).to.eql('(← alias agent)');
  });

  it('uses plural alias label for multiple aliases', () => {
    const row = rootRows().find((item) => item.command === 'update');
    expect(Cli.stripAnsi(row?.columns[1] ?? '')).to.eql('(← aliases up, info)');
  });
});
