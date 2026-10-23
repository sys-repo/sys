import { describe, expect, expectError, it } from '../../../-test.ts';
import { Fs, Hash, Pkg, pkg, type t } from '../../common.ts';
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
      expect(res.pin).to.eql({
        scheme: 'sys.dist/v2',
        digest: Hash.sha256(Pkg.Dist.Content.encode(res.dist.hash.parts)),
      });

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
      expect(a.pin).to.eql(b.pin);
      expect(a.fileCount).to.eql(b.fileCount);
      expect(a.bytesTotal).to.eql(b.bytesTotal);
    } finally {
      await Fs.remove(dir);
    }
  });

  it('empty payload → refuse without publishing or replacing a document', async () => {
    const tmp = await Fs.makeTempDir();
    const path = Fs.join(tmp.absolute, 'dist.json');
    try {
      for (const saveDist of [false, true]) {
        await expectError(
          () => runHashJob({ dir: tmp.absolute, saveDist }),
          'Dist computation failed.',
        );
        expect(await Fs.exists(path)).to.eql(false);
      }
      const retained = 'retained document';
      await Fs.write(path, retained);
      await expectError(
        () => runHashJob({ dir: tmp.absolute, saveDist: true }),
        'Dist computation failed.',
      );
      expect((await Fs.readText(path)).data).to.eql(retained);
    } finally {
      await Fs.remove(tmp.absolute);
    }
  });

  it('unsafe selected path → refusal with or without saving preserves the prior document', async () => {
    const tmp = await Fs.makeTempDir();
    try {
      const path = Fs.join(tmp.absolute, 'dist.json');
      await Fs.write(Fs.join(tmp.absolute, 'a.txt'), 'A');
      await Fs.write(Fs.join(tmp.absolute, 'bad:name'), 'unsafe');
      await Fs.write(path, 'retained document');
      for (const saveDist of [false, true]) {
        await expectError(
          () => runHashJob({ dir: tmp.absolute, saveDist }),
          'Dist computation failed.',
        );
        expect((await Fs.readText(path)).data).to.eql('retained document');
      }
    } finally {
      await Fs.remove(tmp.absolute);
    }
  });

  it('can write dist.json when saveDist is enabled', async () => {
    const tmp = await Fs.makeTempDir();
    const dir = tmp.absolute as t.StringDir;

    try {
      await Fs.write(Fs.join(dir, 'doc.txt'), 'docs\n');

      const res = await runHashJob({ dir, saveDist: true });
      const manifest = await Fs.read(Fs.join(dir, 'dist.json'));
      expect(String(res.digest).startsWith('sha256-')).to.eql(true);
      expect(await Fs.exists(Fs.join(dir, 'dist.json'))).to.eql(true);
      expect(manifest.data).to.not.eql(undefined);
      const verified = await Pkg.Dist.Pinned.verify({
        dir: await Fs.realPath(dir),
        pin: res.pin,
        limits: { manifestBytes: 4096, entries: 10, fileBytes: 1024, totalBytes: 4096 },
      });
      expect(verified.kind).to.eql('verified');
      if (verified.kind !== 'verified') throw new Error('Expected verified saved content.');
      expect(verified.evidence.content).to.eql(res.dist.hash);
      expect(verified.evidence.manifestChecksum).to.eql(Hash.sha256(manifest.data));
    } finally {
      await Fs.remove(dir);
    }
  });
});
