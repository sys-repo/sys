import { describe, expect, expectError, it } from '../../../-test.ts';
import { Fs, Pkg } from '../../common.ts';
import { withTmpDir } from '../../-test/-fixtures.ts';
import { calcAndSaveDist } from '../u.calcAndSaveDist.ts';

const ROOT = '2BAhULFYeTCbw7iEcVuqs1UqdAaJ';

describe('snapshot Dist production', () => {
  it('empty snapshot → refuse before a success path or manifest write', async () => {
    await withTmpDir(async (dir) => {
      const path = Fs.join(dir, 'dist.json');
      await expectError(() => calcAndSaveDist(dir, ROOT), 'Dist computation failed.');
      expect(await Fs.exists(path)).to.eql(false);
      await Fs.write(path, 'retained document');
      await expectError(() => calcAndSaveDist(dir, ROOT), 'Dist computation failed.');
      expect((await Fs.readText(path)).data).to.eql('retained document');
    });
  });

  it('unsafe selected path → refusal preserves the prior document', async () => {
    await withTmpDir(async (dir) => {
      const path = Fs.join(dir, 'dist.json');
      await Fs.write(Fs.join(dir, 'snapshot.json'), '{}');
      await Fs.write(Fs.join(dir, 'bad:name'), 'unsafe');
      await Fs.write(path, 'retained document');
      await expectError(() => calcAndSaveDist(dir, ROOT), 'Dist computation failed.');
      expect((await Fs.readText(path)).data).to.eql('retained document');
    });
  });

  it('snapshot bytes → supported saved inventory', async () => {
    await withTmpDir(async (dir) => {
      await Fs.write(Fs.join(dir, 'snapshot.json'), '{}');
      const result = await calcAndSaveDist(dir, ROOT);
      expect(result.path).to.eql(Fs.join(dir, 'dist.json'));
      const verified = await Pkg.Dist.Local.verify({
        dir: await Fs.realPath(dir),
        limits: { manifestBytes: 4096, entries: 10, fileBytes: 1024, totalBytes: 4096 },
      });
      expect(verified.kind).to.eql('verified');
      if (verified.kind !== 'verified') throw new Error('Expected saved snapshot content.');
      expect(verified.evidence.content).to.eql(result.dist.hash);
    });
  });
});
