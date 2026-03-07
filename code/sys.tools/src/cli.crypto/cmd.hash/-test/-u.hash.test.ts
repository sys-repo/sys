import { describe, expect, it } from '../../../-test.ts';
import { type t, Fs, Pkg, pkg } from '../../common.ts';
import { HashJobSchema, runHashJob } from '../mod.ts';

describe('cli.crypto/cmd.hash', () => {
  it('validates quick-job shape and hashes a directory without writing dist.json by default', async () => {
    const tmp = await Fs.makeTempDir();
    const dir = tmp.absolute as t.StringDir;

    try {
      await Fs.write(Fs.join(dir, 'a.txt'), 'hello\n');
      await Fs.ensureDir(Fs.join(dir, 'sub'));
      await Fs.write(Fs.join(dir, 'sub/b.txt'), 'world\n');

      const job = HashJobSchema.initial(dir);
      const checked = HashJobSchema.validate(job);
      expect(checked.ok).to.eql(true);

      const res = await runHashJob(job);
      expect(res.targetDir).to.eql(Fs.resolve(dir));
      expect(String(res.digest).startsWith('sha256-')).to.eql(true);
      expect(res.fileCount).to.eql(2);
      expect(res.dist.build.builder).to.eql(Pkg.toString(pkg));

      expect(await Fs.exists(Fs.join(dir, 'dist.json'))).to.eql(false);
    } finally {
      await Fs.remove(dir);
    }
  });

  it('is deterministic across repeated runs when content is unchanged', async () => {
    const tmp = await Fs.makeTempDir();
    const dir = tmp.absolute as t.StringDir;

    try {
      await Fs.write(Fs.join(dir, 'x.ts'), 'export const x = 1;\n');
      await Fs.write(Fs.join(dir, 'y.ts'), 'export const y = 2;\n');

      const job = HashJobSchema.initial(dir);
      const a = await runHashJob(job);
      const b = await runHashJob(job);

      expect(a.digest).to.eql(b.digest);
      expect(a.fileCount).to.eql(b.fileCount);
      expect(a.bytesTotal).to.eql(b.bytesTotal);
    } finally {
      await Fs.remove(dir);
    }
  });

  it('can write dist.json when saveDist is enabled', async () => {
    const tmp = await Fs.makeTempDir();
    const dir = tmp.absolute as t.StringDir;

    try {
      await Fs.write(Fs.join(dir, 'doc.txt'), 'docs\n');

      const res = await runHashJob({ dir, saveDist: true });
      expect(String(res.digest).startsWith('sha256-')).to.eql(true);
      expect(await Fs.exists(Fs.join(dir, 'dist.json'))).to.eql(true);
    } finally {
      await Fs.remove(dir);
    }
  });
});
