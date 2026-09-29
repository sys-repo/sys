import { describe, expect, expectError, Fs, it } from '../../-test.ts';
import { Pkg } from '../common.ts';
import { writeDistFiles } from '../u.dist.ts';

describe('bundle Dist production', () => {
  it('empty payload → refusal, not a successful write count', async () => {
    const tmp = await Fs.makeTempDir();
    try {
      const path = Fs.join(tmp.absolute, 'dist.json');
      await expectError(() => writeDistFiles([tmp.absolute]), 'Dist computation failed.');
      expect(await Fs.exists(path)).to.eql(false);
      await Fs.write(path, 'retained document');
      await expectError(() => writeDistFiles([tmp.absolute]), 'Dist computation failed.');
      expect((await Fs.readText(path)).data).to.eql('retained document');
    } finally {
      await Fs.remove(tmp.absolute);
    }
  });

  it('unsafe selected path → refusal preserves the prior document', async () => {
    const tmp = await Fs.makeTempDir();
    try {
      const path = Fs.join(tmp.absolute, 'dist.json');
      await Fs.write(Fs.join(tmp.absolute, 'a.txt'), 'A');
      await Fs.write(Fs.join(tmp.absolute, 'bad:name'), 'unsafe');
      await Fs.write(path, 'retained document');
      await expectError(() => writeDistFiles([tmp.absolute]), 'Dist computation failed.');
      expect((await Fs.readText(path)).data).to.eql('retained document');
    } finally {
      await Fs.remove(tmp.absolute);
    }
  });

  it('valid payload → count only the unique existing directory', async () => {
    const tmp = await Fs.makeTempDir();
    try {
      const file = Fs.join(tmp.absolute, 'a.txt');
      await Fs.write(file, 'A');
      const count = await writeDistFiles([
        tmp.absolute,
        tmp.absolute,
        Fs.join(tmp.absolute, 'missing'),
        file,
      ]);
      expect(count).to.eql(1);
      const verified = await Pkg.Dist.Local.verify({
        dir: await Fs.realPath(tmp.absolute),
        limits: { manifestBytes: 4096, entries: 10, fileBytes: 1024, totalBytes: 4096 },
      });
      expect(verified.kind).to.eql('verified');
      if (verified.kind !== 'verified') throw new Error('Expected saved bundle content.');
      expect(Object.keys(verified.evidence.content.parts)).to.eql(['a.txt']);
    } finally {
      await Fs.remove(tmp.absolute);
    }
  });
});
