import { describe, expect, it } from '../../../-test.ts';
import { Timecode } from '../common.ts';
import { CompositeVideo } from '../mod.ts';
import { SpecInfo } from '../ui.SpecInfo.tsx';
import { CompositeVideo as View } from '../ui.tsx';

describe('CompositeVideo', () => {
  it('API', () => {
    expect(CompositeVideo.Tools).to.equal(Timecode.Composite);
    expect(CompositeVideo.View.Video).to.equal(View);
    expect(CompositeVideo.View.SpecInfo).to.equal(SpecInfo);
  });
});
