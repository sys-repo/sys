import { describe, expect, it } from '../../-test.ts';
import { MediaRecorder } from '../Media.Recorder/mod.ts';
import { VideoStream } from '../Media.VideoStream/mod.ts';
import { Media } from './mod.ts';

describe('Media', () => {
  it('API', async () => {
    const { Media: RootImport } = await import('@sys/ui-react-components');
    expect(Media).to.equal(RootImport);
    expect(Media.VideoStream).to.equal(VideoStream);
    expect(Media.Recorder).to.equal(MediaRecorder);
  });
});
