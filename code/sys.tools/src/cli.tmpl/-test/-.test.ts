import { describe, expect, it } from '../../-test.ts';
import { D } from '../common.ts';
import type { t } from '../common.ts';

describe('tool: Tmpl', () => {
  it('exposes canonical tool metadata', () => {
    type Id = t.TmplTool.Id;
    type Name = t.TmplTool.Name;

    const id: Id = D.tool.id;
    const name: Name = D.tool.name;

    expect(id).to.eql('tmpl');
    expect(name).to.eql('system/tmpl:tools');
  });
});
