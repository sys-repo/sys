import { describe, expect, it } from '../-test.ts';
import { VideoTools } from './mod.ts';

describe(`cli.video`, () => {
  it('API', async () => {
    const m = await import('@sys/dev/video');
    expect(m.VideoTools).to.equal(VideoTools);
  });
});
