import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import type * as t from '../../types.ts';
import { Workspace as Base } from '../../mod.ts';
import { WorkspaceTesting, Workspace } from '../mod.ts';

describe('WorkspaceTesting', () => {
  it('API', async () => {
    const m = await import('@sys/workspace/testing');
    const keys = Object.keys(Base).sort((a, b) => a.localeCompare(b));
    const testingKeys = Object.keys(Workspace).sort((a, b) => a.localeCompare(b));

    expect(m.WorkspaceTesting).to.equal(WorkspaceTesting);
    expect(m.Workspace.Test).to.equal(WorkspaceTesting);
    expect((Base as Record<string, unknown>).Test).to.eql(undefined);
    expect(testingKeys).to.eql([...keys, 'Test'].sort((a, b) => a.localeCompare(b)));

    for (const key of keys) {
      expect(Workspace[key as keyof typeof Base]).to.equal(Base[key as keyof typeof Base]);
    }

    expectTypeOf(Workspace).toMatchTypeOf<t.WorkspaceTesting.Lib>();
    expectTypeOf(Base).toMatchTypeOf<t.Workspace.Lib>();
  });
});
