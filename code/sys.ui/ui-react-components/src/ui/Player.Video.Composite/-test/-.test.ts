import { type t, describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { Helpers } from '../m.Composite.helpers.ts';
import { CompositeVideo } from '../mod.ts';
import { CompositeVideo as View } from '../ui.tsx';

describe('CompositeVideo', () => {
  it('API', () => {
    expect(CompositeVideo.View).to.equal(View);
    Object.entries(Helpers).forEach(([key, value]) => {
      expect((CompositeVideo as any)[key]).to.equal(value);
    });
  });
});
