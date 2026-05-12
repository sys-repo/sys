import { describe, expect, it } from '../../-test.ts';
import { D, type t } from '../common.ts';
import { Pull } from '../mod.ts';
import { run } from '../u.run.ts';

describe('tool: Pull', () => {
  it('API', async () => {
    const m = await import('@sys/tools/pull');
    expect(m.Pull).to.equal(Pull);
    expect(m.Pull.run).to.equal(run);
    expect(Pull.run).to.equal(run);
  });

  it('exposes canonical tool metadata', () => {
    type Id = t.PullTool.Id;
    type Name = t.PullTool.Name;

    const id: Id = D.tool.id;
    const name: Name = D.tool.name;

    expect(id).to.eql('pull');
    expect(name).to.eql('system/pull:tools');
  });
});
