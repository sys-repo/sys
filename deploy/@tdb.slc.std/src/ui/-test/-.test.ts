import React from 'react';
import { describe, expect, it } from '../../-test.ts';
import { CanvasLayout, LogoCanvas, LogoWordmark, VideoBackground } from '../mod.ts';
import { D } from '../ui.Video.Background/common.ts';

describe(`Standard UI Libs`, () => {
  it('API', async () => {
    const m = await import('@tdb/slc-std/ui');
    expect(m.CanvasLayout).to.equal(CanvasLayout);
    expect(m.LogoCanvas).to.equal(LogoCanvas);
    expect(m.LogoWordmark).to.equal(LogoWordmark);
    expect(m.VideoBackground).to.equal(VideoBackground);
  });

  it('VideoBackground defaults video to D.TUBES.src', () => {
    const el = VideoBackground({});
    expect(React.isValidElement<{ children?: unknown }>(el)).to.equal(true);
    if (!React.isValidElement<{ children?: unknown }>(el)) {
      throw new Error('Expected React element');
    }

    const child = el.props.children;
    expect(React.isValidElement<{ video?: string }>(child)).to.equal(true);
    if (!React.isValidElement<{ video?: string }>(child)) {
      throw new Error('Expected child React element');
    }
    expect(child.props.video).to.equal(D.TUBES.src);
  });
});
