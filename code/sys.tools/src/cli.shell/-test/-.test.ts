import { describe, expect, it } from '../../-test.ts';
import { ShellTools } from '../mod.ts';
import { Alias } from '../u.alias.ts';
import { apply, init } from '../u.apply.ts';
import { Path } from '../u.path.ts';

describe('cli.shell API', () => {
  it('exports the ShellTools namespace', async () => {
    const m = await import('@sys/tools/shell');
    expect(m.ShellTools).to.equal(ShellTools);
    expect(m.ShellTools.init).to.equal(init);
    expect(m.ShellTools.apply).to.equal(apply);
    expect(m.ShellTools.Alias).to.equal(Alias);
    expect(m.ShellTools.Path).to.equal(Path);
  });
});
