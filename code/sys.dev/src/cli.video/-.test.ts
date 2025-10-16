import { describe, expect, it } from '../-test.ts';
import { Fs, Path } from './common.ts';
import { VideoTools } from './mod.ts';
import { nextOutPath } from './u.file.name.ts';

describe(`cli.video`, () => {
  it('API', async () => {
    const m = await import('@sys/dev/video');
    expect(m.VideoTools).to.equal(VideoTools);
  });

  describe('filename: nextOutPath (chained lineage)', () => {
    const touch = async (p: string) => {
      await Fs.write(p, 'x', { force: true });
      expect(await Fs.exists(p)).to.eql(true);
    };

    it('outbound (.webm → .mp4): starts at .01 with chained suffix', async () => {
      const dir = (await Fs.makeTempDir()).toString() as string;
      const src = Path.join(dir, 'clip.webm');
      await touch(src);

      const out = await nextOutPath({ src, toExt: '.mp4' });
      expect(out).to.eql(Path.join(dir, 'clip.webm.01.webm.mp4'));
    });

    it('outbound (.webm → .mp4): collision → increments (.02, .03…)', async () => {
      const dir = (await Fs.makeTempDir()).toString() as string;
      const src = Path.join(dir, 'clip.webm');
      await touch(src);
      await touch(Path.join(dir, 'clip.webm.01.webm.mp4'));
      await touch(Path.join(dir, 'clip.webm.02.webm.mp4'));

      const out = await nextOutPath({ src, toExt: '.mp4' });
      expect(out).to.eql(Path.join(dir, 'clip.webm.03.webm.mp4'));
    });

    it('return (.mp4 → .webm): keep chain and continue step', async () => {
      const dir = (await Fs.makeTempDir()).toString() as string;
      const src = Path.join(dir, 'clip.webm.01.webm.mp4');
      await touch(src);

      const out = await nextOutPath({ src, toExt: '.webm' });
      expect(out).to.eql(Path.join(dir, 'clip.webm.02.webm.mp4.webm'));
    });

    it('return (.mp4 → .webm): target collision → increments', async () => {
      const dir = (await Fs.makeTempDir()).toString() as string;
      const src = Path.join(dir, 'clip.webm.07.webm.mp4');
      await touch(src);
      await touch(Path.join(dir, 'clip.webm.08.webm.mp4.webm'));

      const out = await nextOutPath({ src, toExt: '.webm' });
      expect(out).to.eql(Path.join(dir, 'clip.webm.09.webm.mp4.webm'));
    });

    it('foreign .mp4 → .webm: starts at .01 and includes source ext in chain', async () => {
      const dir = (await Fs.makeTempDir()).toString() as string;
      const src = Path.join(dir, 'recording.mp4');
      await touch(src);

      const out = await nextOutPath({ src, toExt: '.webm' });
      expect(out).to.eql(Path.join(dir, 'recording.mp4.01.mp4.webm'));
    });

    it('foreign .mp4 → .webm: collision → increments', async () => {
      const dir = (await Fs.makeTempDir()).toString() as string;
      const src = Path.join(dir, 'session.mp4');
      await touch(src);
      await touch(Path.join(dir, 'session.mp4.01.mp4.webm'));

      const out = await nextOutPath({ src, toExt: '.webm' });
      expect(out).to.eql(Path.join(dir, 'session.mp4.02.mp4.webm'));
    });

    it('multi-dot base: preserves stem; chained peel/continue works', async () => {
      const dir = (await Fs.makeTempDir()).toString() as string;
      // Prior outbound file under chained scheme:
      const srcOut = Path.join(dir, 'weird.name.v1.webm.07.webm.mp4');
      await touch(srcOut);

      const out = await nextOutPath({ src: srcOut, toExt: '.webm' });
      expect(out).to.eql(Path.join(dir, 'weird.name.v1.webm.08.webm.mp4.webm'));
    });

    it('round-trip progression: webm → mp4 → webm → mp4 (counter monotonic, chain grows)', async () => {
      const dir = (await Fs.makeTempDir()).toString() as string;
      const src0 = Path.join(dir, 'hello.webm');
      await touch(src0);

      const out1 = await nextOutPath({ src: src0, toExt: '.mp4' });
      expect(out1).to.eql(Path.join(dir, 'hello.webm.01.webm.mp4'));
      await touch(out1);

      const out2 = await nextOutPath({ src: out1, toExt: '.webm' });
      expect(out2).to.eql(Path.join(dir, 'hello.webm.02.webm.mp4.webm'));
      await touch(out2);

      const out3 = await nextOutPath({ src: out2, toExt: '.mp4' });
      expect(out3).to.eql(Path.join(dir, 'hello.webm.03.webm.mp4.webm.mp4'));
    });
  });
});
