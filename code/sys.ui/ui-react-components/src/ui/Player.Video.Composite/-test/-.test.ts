import { describe, expect, it } from '../../../-test.ts';
import { Timecode } from '../common.ts';
import { CompositeVideo } from '../mod.ts';
import { CompositeVideo as View } from '../ui.tsx';

describe('CompositeVideo', () => {
  it('API', () => {
    expect(CompositeVideo.View).to.equal(View);
    expect(CompositeVideo.Tools).to.equal(Timecode.Composite);
  });
});
