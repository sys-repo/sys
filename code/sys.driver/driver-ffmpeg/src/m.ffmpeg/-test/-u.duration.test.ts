import { describe, expect, it } from '../../-test.ts';
import { duration } from '../u.duration.ts';
import { failOutput, okOutput, withInvokeStub } from './fixture.ts';

describe('Ffmpeg.duration', () => {
  it('parses duration seconds as string and returns msecs', async () => {
    await withInvokeStub(
      async (args) => {
        expect(args.cmd).to.eql('ffprobe');
        expect(args.args).to.contain(String('-show_entries'));
        return okOutput(JSON.stringify({ format: { duration: '1.234' } }));
      },
      async () => {
        const result = await duration('file.webm');
        expect(result.ok).to.eql(true);
        if (result.ok) expect(result.msecs).to.eql(1234);
      },
    );
  });

  it('parses duration seconds as number and returns msecs', async () => {
    await withInvokeStub(
      async () => okOutput(JSON.stringify({ format: { duration: 2.5 } })),
      async () => {
        const result = await duration('file.mp4');
        expect(result.ok).to.eql(true);
        if (result.ok) expect(result.msecs).to.eql(2500);
      },
    );
  });

  it('returns parse-failed when stdout is not valid JSON', async () => {
    await withInvokeStub(
      async () => okOutput('not-json'),
      async () => {
        const result = await duration('file.webm');
        expect(result.ok).to.eql(false);
        if (!result.ok) expect(result.reason).to.eql('parse-failed');
      },
    );
  });

  it('returns parse-failed when duration field is missing', async () => {
    await withInvokeStub(
      async () => okOutput(JSON.stringify({ format: {} })),
      async () => {
        const result = await duration('file.webm');
        expect(result.ok).to.eql(false);
        if (!result.ok) expect(result.reason).to.eql('parse-failed');
      },
    );
  });

  it('returns unsupported-format for invalid media input', async () => {
    await withInvokeStub(
      async () => failOutput('Invalid data found when processing input'),
      async () => {
        const result = await duration('file.bin');
        expect(result.ok).to.eql(false);
        if (!result.ok) expect(result.reason).to.eql('unsupported-format');
      },
    );
  });

  it('returns missing-ffprobe when ffprobe is not found', async () => {
    await withInvokeStub(
      async () => {
        throw new Error('ENOENT: no such file or directory');
      },
      async () => {
        const result = await duration('file.webm');
        expect(result.ok).to.eql(false);
        if (!result.ok) expect(result.reason).to.eql('missing-ffprobe');
      },
    );
  });

  it('returns probe-failed for non-zero exit with other errors', async () => {
    await withInvokeStub(
      async () => failOutput('something went wrong'),
      async () => {
        const result = await duration('file.webm');
        expect(result.ok).to.eql(false);
        if (!result.ok) expect(result.reason).to.eql('probe-failed');
      },
    );
  });
});
