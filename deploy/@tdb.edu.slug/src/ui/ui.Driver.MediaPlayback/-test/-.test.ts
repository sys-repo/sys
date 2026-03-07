import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { type t, TreeContentDriver } from '../common.ts';
import { MediaPlaybackDriver } from '../mod.ts';

describe(`MediaPlaybackDriver`, () => {
  it('API', async () => {
    type T = t.MediaPlaybackDriver.Lib['orchestrator'];
    expect(MediaPlaybackDriver.orchestrator).to.equal(TreeContentDriver.orchestrator);
    expectTypeOf(MediaPlaybackDriver.orchestrator).toEqualTypeOf<T>();
  });
});
