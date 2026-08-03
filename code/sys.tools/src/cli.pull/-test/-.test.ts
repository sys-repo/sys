import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import type { GithubPull as PublicGithubPull } from '@sys/tools/t';
import { D, type t } from '../common.ts';
import { GithubPull, Pull } from '../mod.ts';
import { run } from '../u.run.ts';

describe('tool: Pull', () => {
  it('API', async () => {
    const m = await import('@sys/tools/pull');
    expect(m.Pull).to.equal(Pull);
    expect(m.GithubPull).to.equal(GithubPull);
    expectTypeOf(m.GithubPull).toEqualTypeOf<t.GithubPull.Lib>();
    expectTypeOf(m.GithubPull).toEqualTypeOf<PublicGithubPull.Lib>();
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
