import { describe, expect, Fs, it } from '../../../../-test.ts';
import { clearTargetDir } from '../u.clearTargetDir.ts';

describe('cli.pull/u.bundle/u.pull → clearTargetDir', () => {
  it('clears a nested target directory inside the pull base', async () => {
    const root = await Fs.makeTempDir({ prefix: 'sys.tools.pull.u.bundle.clear-target.' });
    try {
      const baseDir = Fs.join(root.absolute, 'base');
      const targetDir = Fs.join(baseDir, 'releases/app');
      await Fs.ensureDir(targetDir);
      await Fs.write(Fs.join(targetDir, 'stale.txt'), 'stale', { force: true });

      await clearTargetDir({ baseDir, targetDir });

      expect(await Fs.exists(targetDir)).to.eql(false);
    } finally {
      await Fs.remove(root.absolute);
    }
  });

  it('rejects clearing the pull base directory itself', async () => {
    const root = await Fs.makeTempDir({ prefix: 'sys.tools.pull.u.bundle.clear-target.' });
    try {
      const baseDir = Fs.join(root.absolute, 'base');
      await Fs.ensureDir(baseDir);
      await Fs.write(Fs.join(baseDir, 'keep.txt'), 'keep', { force: true });

      let message = '';
      try {
        await clearTargetDir({ baseDir, targetDir: baseDir });
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }

      expect(message.includes('Refusing to clear outside pull base')).to.eql(true);
      expect(await Fs.exists(Fs.join(baseDir, 'keep.txt'))).to.eql(true);
    } finally {
      await Fs.remove(root.absolute);
    }
  });

  it('rejects clearing a path outside the pull base', async () => {
    const root = await Fs.makeTempDir({ prefix: 'sys.tools.pull.u.bundle.clear-target.' });
    try {
      const baseDir = Fs.join(root.absolute, 'base');
      const outside = Fs.join(root.absolute, 'outside');
      await Fs.ensureDir(baseDir);
      await Fs.ensureDir(outside);
      await Fs.write(Fs.join(outside, 'keep.txt'), 'keep', { force: true });

      let message = '';
      try {
        await clearTargetDir({ baseDir, targetDir: outside });
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }

      expect(message.includes('Refusing to clear outside pull base')).to.eql(true);
      expect(await Fs.exists(Fs.join(outside, 'keep.txt'))).to.eql(true);
    } finally {
      await Fs.remove(root.absolute);
    }
  });
});
