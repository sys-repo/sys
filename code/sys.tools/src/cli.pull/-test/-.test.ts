import { describe, expect, it } from '../../-test.ts';
import { D } from '../common.ts';
import type { t } from '../common.ts';

describe('tool: Pull', () => {
  it('exposes canonical tool metadata', () => {
    type Id = t.PullTool.Id;
    type Name = t.PullTool.Name;

    const id: Id = D.tool.id;
    const name: Name = D.tool.name;

    expect(id).to.eql('pull');
    expect(name).to.eql('system/pull:tools');
  });
});
