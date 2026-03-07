import { describe, expect, it, Fs } from '../../../-test.ts';
import { type t } from '../../common.ts';
import { computeReleaseDist } from '../u.pull/u.pull.github.ts';

describe('cli.pull/u.bundle/u.pull.github', () => {
  it('computes and saves dist.json for release output directory', async () => {
    const root = await Fs.makeTempDir({ prefix: 'sys.tools.pull.u.bundle.release.' });
    const dir = Fs.join(root.absolute, 'release') as t.StringDir;
    try {
      await Fs.ensureDir(dir);
      await Fs.write(Fs.join(dir, 'artifact.txt'), 'hello', { force: true });

      const dist = await computeReleaseDist(dir);
      const distPath = Fs.join(dir, 'dist.json');

      expect(await Fs.exists(distPath)).to.eql(true);
      expect(String(dist.hash.digest).trim().length > 0).to.eql(true);
    } finally {
      await Fs.remove(root.absolute);
    }
  });
});
