import { describe, expect, it } from '../../../-test.ts';
import { Devices } from '../../Media.Devices/mod.ts';
import { Recorder } from '../../Media.Recorder/mod.ts';
import { Video } from '../../Media.Video/mod.ts';
import { AspectRatio, Is, Media } from '../mod.ts';

describe('Media', () => {
  it('API', async () => {
    const { Media: RootImport } = await import('@sys/ui-react-components');
    expect(Media).to.equal(RootImport);
    expect(Media.Video).to.equal(Video);
    expect(Media.Recorder).to.equal(Recorder);
    expect(Media.Devices).to.equal(Devices);
    expect(Media.AspectRatio).to.equal(AspectRatio);
    expect(Media.Is).to.equal(Is);
  });

  describe('AspectRatio', () => {
    const makeStream = (settings: Partial<MediaTrackSettings>): MediaStream => {
      const track = { getSettings: () => settings } as MediaStreamTrack;
      return { getVideoTracks: () => [track] } as unknown as MediaStream;
    };

    describe('AspectRatio.toNumber()', () => {
      it('picks explicit `aspectRatio` when present', () => {
        const stream = makeStream({ aspectRatio: 1.777_778 });
        expect(AspectRatio.toNumber(stream)).to.be.closeTo(1.777_778, 1e-6);
      });

      it('falls back to width / height', () => {
        const stream = makeStream({ width: 1920, height: 1080 });
        expect(AspectRatio.toNumber(stream)).to.eql(16 / 9);
      });

      it('returns 0 when no usable data', () => {
        const stream = makeStream({});
        expect(AspectRatio.toNumber(stream)).to.eql(0);
      });
    });

    describe('AspectRatio.toString()', () => {
      it('returns a reduced fraction when denominator ≤ maxDenominator', () => {
        const stream = makeStream({ width: 1280, height: 720 }); // 16 : 9
        expect(AspectRatio.toString(stream)).to.eql('16/9');
      });

      it('obeys `maxDenominator` and switches to decimal/1 when exceeded', () => {
        const stream = makeStream({ width: 1280, height: 720 });
        const text = AspectRatio.toString(stream, { maxDenominator: 4 });
        // e.g. "1.778/1"
        expect(text).to.match(/^\d+\.\d+\/1$/);
      });

      it('returns "0/1" for unknown aspect ratios', () => {
        const stream = makeStream({});
        expect(AspectRatio.toString(stream)).to.eql('0/1');
      });
    });
  });
});
