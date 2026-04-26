import { describe, expect, Fs, it } from '../../-test.ts';
import { Git } from '../mod.ts';

describe('Git.init (integration)', () => {
  it('initializes a repository in the target directory', async () => {
    const probe = await Git.probe();
    if (!probe.ok) return;

    const dir = await Fs.makeTempDir({ prefix: 'git-init-' });
    const cwd = dir.absolute;
    try {
      const res = await Git.init({ cwd });
      expect(res.ok).to.eql(true);
      if (res.ok) {
        expect(res.bin).to.eql({ git: 'git' });
        expect(res.cwd).to.eql(cwd);
      }

      expect(await Fs.exists(Fs.join(cwd, '.git'))).to.eql(true);
    } finally {
      await Fs.remove(cwd);
    }
  });
});
