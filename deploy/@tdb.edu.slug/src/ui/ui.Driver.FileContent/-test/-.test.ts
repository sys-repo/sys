import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { type t, TreeContentDriver } from '../common.ts';
import { FileContentDriver } from '../mod.ts';

describe(`FileContentDriver`, () => {
  it('API', async () => {
    type T = t.FileContentDriver.Lib['orchestrator'];
    expect(FileContentDriver.orchestrator).to.equal(TreeContentDriver.orchestrator);
    expectTypeOf(FileContentDriver.orchestrator).toEqualTypeOf<T>();
  });
});
