import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { WorkspaceInfo } from '../mod.ts';

describe(`@sys/workspace/info`, () => {
  it('API', async () => {
    const m = await import('@sys/workspace/info');
    expect(m.WorkspaceInfo).to.equal(WorkspaceInfo);
    expectTypeOf(undefined as t.WorkspaceInfo.GlobArgs['packages'])
      .toEqualTypeOf<undefined>();
    expectTypeOf(undefined as t.WorkspaceInfo.GlobResult['packages'])
      .toEqualTypeOf<undefined>();
  });
});
