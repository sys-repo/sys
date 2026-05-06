import { describe, expect, it } from '../../-test.ts';
import { ShellTools } from '../mod.ts';
import { Alias } from '../u.alias.ts';

describe('cli.shell API', () => {
  it('exports the ShellTools namespace', async () => {
    const m = await import('@sys/tools/shell');
    expect(m.ShellTools).to.equal(ShellTools);
    expect(m.ShellTools.Alias).to.equal(Alias);
  });
});
