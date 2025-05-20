import { describe, expect, it } from '../../-test.ts';
import { Devices } from '../Media.Devices/mod.ts';
import { Recorder } from '../Media.Recorder/mod.ts';
import { Video } from '../Media.Video/mod.ts';
import { Media } from './mod.ts';

describe('Media', () => {
  it('API', async () => {
    const { Media: RootImport } = await import('@sys/ui-react-components');
    expect(Media).to.equal(RootImport);
    expect(Media.Video).to.equal(Video);
    expect(Media.Recorder).to.equal(Recorder);
    expect(Media.Devices).to.equal(Devices);
  });
});
