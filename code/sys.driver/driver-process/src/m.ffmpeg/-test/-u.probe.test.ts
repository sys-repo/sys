import { describe, expect, it } from '../../-test.ts';
import { probe } from '../u.probe.ts';
import { failOutput, okOutput, withInvokeStub } from '../../u.probe/-test/mod.ts';

describe('Ffmpeg.probe', () => {
  it('reports missing ffprobe when the executable is not found', async () => {
    await withInvokeStub(
      async () => {
        throw new Error('ENOENT: no such file or directory');
      },
      async () => {
        const result = await probe();
        expect(result.ok).to.eql(false);
        if (!result.ok) {
          expect(result.reason).to.eql('missing-ffprobe');
          expect(result.hint).to.contain('ffprobe not found');
        }
      },
    );
  });

  it('returns ffprobe only when ffmpeg is optional', async () => {
    await withInvokeStub(
      async (args) => {
        expect(args.cmd).to.eql('ffprobe');
        return okOutput();
      },
      async () => {
        const result = await probe();

        expect(result.ok).to.eql(true);
        if (result.ok) {
          expect(result.bin).to.eql({ ffprobe: 'ffprobe' });
        }
      },
    );
  });

  it('flags missing ffmpeg when required but not installed', async () => {
    await withInvokeStub(
      async (args) => {
        if (args.cmd === 'ffprobe') return okOutput();
        throw new Error('ENOENT: no such file or directory');
      },
      async () => {
        const result = await probe({ requireFfmpeg: true });

        expect(result.ok).to.eql(false);
        if (!result.ok) {
          expect(result.reason).to.eql('missing-ffmpeg');
          expect(result.hint).to.contain('ffmpeg not found');
        }
      },
    );
  });

  it('reports spawn failure when binaries exist but cannot be executed', async () => {
    await withInvokeStub(
      async (args) => {
        if (args.cmd === 'ffprobe') return okOutput();
        return failOutput('permission denied');
      },
      async () => {
        const result = await probe({ requireFfmpeg: true });

        expect(result.ok).to.eql(false);
        if (!result.ok) {
          expect(result.reason).to.eql('spawn-failed');
        }
      },
    );
  });
});
