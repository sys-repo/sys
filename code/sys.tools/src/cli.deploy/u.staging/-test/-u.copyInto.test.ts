import { withTmpDir } from '../../-test/-fixtures.ts';
import { describe, expect, Fs, it } from '../../../-test.ts';
import { copyInto } from '../u.copyInto.ts';

describe('Staging: copyInto', () => {
  it('merges directories into an existing dst (merges from prior)', async () => {
    await withTmpDir(async (tmp) => {
      const src1 = `${tmp}/src1`;
      const dst = `${tmp}/dst`;

      // dst pre-exists with prior content
      await Fs.ensureDir(`${dst}/assets`);
      await Fs.write(`${dst}/prior.txt`, 'prior');
      await Fs.write(`${dst}/assets/prior-asset.txt`, 'prior-asset');

      // src introduces new files/dirs
      await Fs.ensureDir(`${src1}/assets`);
      await Fs.write(`${src1}/new.txt`, 'new');
      await Fs.write(`${src1}/assets/new-asset.txt`, 'new-asset');

      await copyInto({ src: src1, dst, overwrite: false });

      const prior = await Fs.readText(`${dst}/prior.txt`);
      expect(prior.ok).to.eql(true);
      expect(prior.exists).to.eql(true);
      expect(prior.data).to.eql('prior');

      const priorAsset = await Fs.readText(`${dst}/assets/prior-asset.txt`);
      expect(priorAsset.ok).to.eql(true);
      expect(priorAsset.exists).to.eql(true);
      expect(priorAsset.data).to.eql('prior-asset');

      const fresh = await Fs.readText(`${dst}/new.txt`);
      expect(fresh.ok).to.eql(true);
      expect(fresh.exists).to.eql(true);
      expect(fresh.data).to.eql('new');

      const freshAsset = await Fs.readText(`${dst}/assets/new-asset.txt`);
      expect(freshAsset.ok).to.eql(true);
      expect(freshAsset.exists).to.eql(true);
      expect(freshAsset.data).to.eql('new-asset');
    });
  });

  it('overwrite=false preserves existing files (skips collisions); directories merge', async () => {
    await withTmpDir(async (tmp) => {
      const src1 = `${tmp}/src1`;
      const src2 = `${tmp}/src2`;
      const dst = `${tmp}/dst`;

      await Fs.ensureDir(`${src1}/assets`);
      await Fs.ensureDir(`${src2}/assets`);

      await Fs.write(`${src1}/a.txt`, 'first');
      await Fs.write(`${src2}/a.txt`, 'second');

      await Fs.write(`${src1}/assets/one.txt`, 'one');
      await Fs.write(`${src2}/assets/two.txt`, 'two');

      await Fs.write(`${src1}/assets/shared.txt`, 'shared-1');
      await Fs.write(`${src2}/assets/shared.txt`, 'shared-2');

      await copyInto({ src: src1, dst, overwrite: false });
      await copyInto({ src: src2, dst, overwrite: false });

      const a = await Fs.readText(`${dst}/a.txt`);
      expect(a.ok).to.eql(true);
      expect(a.exists).to.eql(true);
      expect(a.data).to.eql('first'); // collision skipped

      const one = await Fs.readText(`${dst}/assets/one.txt`);
      expect(one.ok).to.eql(true);
      expect(one.exists).to.eql(true);
      expect(one.data).to.eql('one');

      const two = await Fs.readText(`${dst}/assets/two.txt`);
      expect(two.ok).to.eql(true);
      expect(two.exists).to.eql(true);
      expect(two.data).to.eql('two');

      const shared = await Fs.readText(`${dst}/assets/shared.txt`);
      expect(shared.ok).to.eql(true);
      expect(shared.exists).to.eql(true);
      expect(shared.data).to.eql('shared-1'); // collision skipped
    });
  });

  it('overwrite=true overwrites existing files (last write wins); directories merge', async () => {
    await withTmpDir(async (tmp) => {
      const src1 = `${tmp}/src1`;
      const src2 = `${tmp}/src2`;
      const dst = `${tmp}/dst`;

      await Fs.ensureDir(`${src1}/assets`);
      await Fs.ensureDir(`${src2}/assets`);

      await Fs.write(`${src1}/a.txt`, 'first');
      await Fs.write(`${src2}/a.txt`, 'second');

      await Fs.write(`${src1}/assets/one.txt`, 'one');
      await Fs.write(`${src2}/assets/two.txt`, 'two');

      await Fs.write(`${src1}/assets/shared.txt`, 'shared-1');
      await Fs.write(`${src2}/assets/shared.txt`, 'shared-2');

      await copyInto({ src: src1, dst, overwrite: true });
      await copyInto({ src: src2, dst, overwrite: true });

      const a = await Fs.readText(`${dst}/a.txt`);
      expect(a.ok).to.eql(true);
      expect(a.exists).to.eql(true);
      expect(a.data).to.eql('second'); // overwritten

      const one = await Fs.readText(`${dst}/assets/one.txt`);
      expect(one.ok).to.eql(true);
      expect(one.exists).to.eql(true);
      expect(one.data).to.eql('one');

      const two = await Fs.readText(`${dst}/assets/two.txt`);
      expect(two.ok).to.eql(true);
      expect(two.exists).to.eql(true);
      expect(two.data).to.eql('two');

      const shared = await Fs.readText(`${dst}/assets/shared.txt`);
      expect(shared.ok).to.eql(true);
      expect(shared.exists).to.eql(true);
      expect(shared.data).to.eql('shared-2'); // last write wins
    });
  });

  it('copies a single file into an existing dst dir; respects overwrite', async () => {
    await withTmpDir(async (tmp) => {
      const srcFile = `${tmp}/src.txt`;
      const dstDir = `${tmp}/dst`;
      const dstFile = `${dstDir}/src.txt`;

      await Fs.ensureDir(dstDir);
      await Fs.write(dstFile, 'existing');
      await Fs.write(srcFile, 'incoming');

      // overwrite=false → preserve existing
      await copyInto({ src: srcFile, dst: dstFile, overwrite: false });
      const kept = await Fs.readText(dstFile);
      expect(kept.ok).to.eql(true);
      expect(kept.exists).to.eql(true);
      expect(kept.data).to.eql('existing');

      // overwrite=true → replace
      await copyInto({ src: srcFile, dst: dstFile, overwrite: true });
      const replaced = await Fs.readText(dstFile);
      expect(replaced.ok).to.eql(true);
      expect(replaced.exists).to.eql(true);
      expect(replaced.data).to.eql('incoming');
    });
  });

  it('skips .DS_Store files', async () => {
    await withTmpDir(async (tmp) => {
      const src = `${tmp}/src`;
      const dst = `${tmp}/dst`;
      await Fs.ensureDir(src);
      await Fs.write(`${src}/.DS_Store`, 'ignored');
      await Fs.write(`${src}/keep.txt`, 'keep');

      await copyInto({ src, dst, overwrite: false });

      const ds = await Fs.readText(`${dst}/.DS_Store`);
      expect(ds.exists).to.eql(false);

      const kept = await Fs.readText(`${dst}/keep.txt`);
      expect(kept.data).to.eql('keep');
    });
  });
});
