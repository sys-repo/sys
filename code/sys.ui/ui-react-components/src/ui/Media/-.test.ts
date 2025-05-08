import { describe, expect, it } from '../../-test.ts';
import { MediaRecorder } from '../Media.Recorder/mod.ts';
import { MediaVideo } from '../Media.Video/mod.ts';
import { Media } from './mod.ts';

describe('Media', () => {
  it('API', async () => {
    const { Media: RootImport } = await import('@sys/ui-react-components');
    expect(Media).to.equal(RootImport);
    expect(Media.Video).to.equal(MediaVideo);
    expect(Media.Recorder).to.equal(MediaRecorder);
  });
});
