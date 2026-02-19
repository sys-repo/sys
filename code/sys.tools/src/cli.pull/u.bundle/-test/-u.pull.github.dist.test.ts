import { describe, expect, it, Fs, slug } from '../../../-test.ts';
import { type t } from '../../common.ts';
import { computeReleaseDist } from '../u.pull/u.pull.github.ts';

describe('cli.pull/u.bundle/u.pull.github', () => {
  it('computes and saves dist.json for release output directory', async () => {
    const dir = Fs.resolve(`./.tmp/test/u.bundle/${slug()}/release`) as t.StringDir;
    await Fs.ensureDir(dir);
    await Fs.write(Fs.join(dir, 'artifact.txt'), 'hello', { force: true });

    const dist = await computeReleaseDist(dir);
    const distPath = Fs.join(dir, 'dist.json');

    expect(await Fs.exists(distPath)).to.eql(true);
    expect(String(dist.hash.digest).trim().length > 0).to.eql(true);
  });
});
