import { describe, expect, it } from '../../../-test.ts';
import { Helpers } from '../m.Helpers.ts';
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
