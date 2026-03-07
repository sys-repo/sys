import { describe, expect, it } from '../../-test.ts';
import { Ffmpeg } from '../mod.ts';

describe(`Process: Ffmpeg`, () => {
  it('API', async () => {
    const m = await import('@sys/driver-process/ffmpeg');
    expect(m.Ffmpeg).to.equal(Ffmpeg);
  });
});
