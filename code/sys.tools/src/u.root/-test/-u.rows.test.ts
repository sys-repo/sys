import { c, Cli, describe, expect, it } from '../../-test.ts';
import { rootRows } from '../u.rows.ts';

describe('Root Rows', () => {
  it('renders the pi row with helpful aliases', () => {
    const row = rootRows('primary').find((item) => item.command === 'pi');
    expect(Cli.stripAnsi(row?.columns[0] ?? '')).to.contain('@sys/tools pi');
    expect(Cli.stripAnsi(row?.columns[1] ?? '')).to.eql('(← aliases agent, harness)');
  });

  it('renders multi-alias rows with a plural alias label', () => {
    const row = rootRows('utility').find((item) => item.command === 'update');
    expect(Cli.stripAnsi(row?.columns[1] ?? '')).to.eql('(← aliases up, info)');
  });

  it('filters rows by group without changing command formatting', () => {
    expect(rootRows('primary').map((item) => item.command)).to.eql([
      'pi',
      'tmpl',
      'pull',
      'serve',
      'deploy',
    ]);
    expect(rootRows('secondary').map((item) => item.command)).to.eql([
      'shell',
      'crdt',
      'video',
      'crypto',
      'copy',
      'dsl',
    ]);
    expect(rootRows('utility').map((item) => item.command)).to.eql(['update']);
  });

  it('renders update attention with a magenta command label while preserving visible text', () => {
    const normal = rootRows('utility').find((item) => item.command === 'update');
    const highlighted = rootRows('utility', { highlightCommand: 'update' }).find((item) =>
      item.command === 'update'
    );

    expect(Cli.stripAnsi(highlighted?.columns[0] ?? '')).to.eql(
      Cli.stripAnsi(normal?.columns[0] ?? ''),
    );
    expect(highlighted?.columns[0]).to.eql(`${c.gray(c.dim('@sys/tools '))}${c.magenta('update')}`);
  });
});
