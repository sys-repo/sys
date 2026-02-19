import { describe, expect, it, Fs } from '../../../-test.ts';
import { type t } from '../../common.ts';
import { assertSafeDistPath, resolveDistFile } from '../u.github.release.fs.ts';

describe('cli.pull/u.bundle → github release fs helpers', () => {
  it('assertSafeDistPath rejects unsafe values', () => {
    const bad = ['', '/dist.json', '../dist.json', 'a/../dist.json'];
    for (const value of bad) {
      let error: unknown;
      try {
        assertSafeDistPath(value as t.StringPath);
      } catch (err) {
        error = err;
      }
      expect(Boolean(error)).to.eql(true);
    }
  });

  it('resolveDistFile finds nested dist by suffix', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'pull-gh-resolve-dist-' });
    try {
      const dir = Fs.join(tmp.absolute, 'bundle', 'nested');
      await Fs.ensureDir(dir);
      await Fs.write(Fs.join(dir, 'dist.json'), '{}', { force: true });

      const distFile = await resolveDistFile({
        extractedDir: tmp.absolute as t.StringDir,
        distPath: 'nested/dist.json' as t.StringPath,
      });

      expect(distFile.endsWith('/bundle/nested/dist.json')).to.eql(true);
    } finally {
      await Fs.remove(tmp.absolute, { log: false });
    }
  });
});
