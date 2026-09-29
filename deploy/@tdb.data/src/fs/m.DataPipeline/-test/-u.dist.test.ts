import { describe, expect, expectError, it } from '../../../-test.ts';
import { Fs, Pkg } from '../common.ts';
import { refreshMountDist, refreshRootDist } from '../u.dist.ts';

const cases = [
  ['mount', refreshMountDist],
  ['root', refreshRootDist],
] as const;

for (const [name, refresh] of cases) {
  describe(`data pipeline Dist production → ${name}`, () => {
    it('empty payload → refuse without returning a success path or replacing a document', async () => {
      const tmp = await Fs.makeTempDir();
      try {
        const path = Fs.join(tmp.absolute, 'dist.json');
        await expectError(() => refresh(tmp.absolute), 'Dist computation failed.');
        expect(await Fs.exists(path)).to.eql(false);
        await Fs.write(path, 'retained document');
        await expectError(() => refresh(tmp.absolute), 'Dist computation failed.');
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
        await expectError(() => refresh(tmp.absolute), 'Dist computation failed.');
        expect((await Fs.readText(path)).data).to.eql('retained document');
      } finally {
        await Fs.remove(tmp.absolute);
      }
    });

    it('valid payload → saved supported inventory', async () => {
      const tmp = await Fs.makeTempDir();
      try {
        await Fs.write(Fs.join(tmp.absolute, 'a.txt'), 'A');
        expect(await refresh(tmp.absolute)).to.eql(Fs.join(tmp.absolute, 'dist.json'));
        const verified = await Pkg.Dist.Local.verify({
          dir: await Fs.realPath(tmp.absolute),
          limits: { manifestBytes: 4096, entries: 10, fileBytes: 1024, totalBytes: 4096 },
        });
        expect(verified.kind).to.eql('verified');
      } finally {
        await Fs.remove(tmp.absolute);
      }
    });
  });
}
