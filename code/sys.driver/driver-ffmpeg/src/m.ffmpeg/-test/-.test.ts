import { describe, expect, it } from '../../-test.ts';
import { Ffmpeg } from '../mod.ts';

describe(`Ffmpeg`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-ffmpeg');
    expect(m.Ffmpeg).to.equal(Ffmpeg);
  });
});
