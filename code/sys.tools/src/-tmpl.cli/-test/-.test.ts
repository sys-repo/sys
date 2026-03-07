import { describe, expect, it } from '../../-test.ts';
import { D } from '../common.ts';
import type { t } from '../common.ts';

describe('tool: __NAME__', () => {
  it('exposes canonical tool metadata', () => {
    type Id = t.__NAME__Tool.Id;
    type Name = t.__NAME__Tool.Name;

    const id: Id = D.tool.id;
    const name: Name = D.tool.name;

    expect(id).to.eql('__ID__');
    expect(name).to.eql('system/__ID__:tools');
  });
});
