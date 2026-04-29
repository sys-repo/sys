import { describe, expect, it } from '../../-test.ts';
import { D } from '../common.ts';
import { Pull } from '../mod.ts';
import type { t } from '../common.ts';

describe('tool: Pull', () => {
  it('API', async () => {
    const m = await import('@sys/tools/pull');
    expect(m.Pull).to.equal(Pull);
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
