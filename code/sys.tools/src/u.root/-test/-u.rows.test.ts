import { describe, expect, it, Cli } from '../../-test.ts';
import { rootRows } from '../u.rows.ts';

describe('Root Rows', () => {
  it('renders the fn row with the displayed compatibility alias', () => {
    const row = rootRows('primary').find((item) => item.command === 'fn');
    expect(Cli.stripAnsi(row?.columns[0] ?? '')).to.contain('@sys/tools ƒn');
    expect(Cli.stripAnsi(row?.columns[1] ?? '')).to.eql('(← alias agent)');
  });

  it('renders multi-alias rows with a plural alias label', () => {
    const row = rootRows('utility').find((item) => item.command === 'update');
    expect(Cli.stripAnsi(row?.columns[1] ?? '')).to.eql('(← aliases up, info)');
  });

  it('filters rows by group without changing command formatting', () => {
    expect(rootRows('primary').map((item) => item.command)).to.eql(['fn', 'tmpl', 'pull', 'serve', 'deploy']);
    expect(rootRows('secondary').map((item) => item.command)).to.eql(['crdt', 'video', 'crypto', 'copy']);
    expect(rootRows('utility').map((item) => item.command)).to.eql(['update']);
  });
});
