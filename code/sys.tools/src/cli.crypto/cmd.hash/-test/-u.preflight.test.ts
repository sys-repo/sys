import { describe, expect, it } from '../../../-test.ts';
import { type t, Fs } from '../../common.ts';
import { HashPreflight } from '../mod.ts';

describe('cli.crypto/cmd.hash/u.preflight', () => {
  it('scans file count and bytes using metadata only traversal', async () => {
    const tmp = await Fs.makeTempDir();
    const dir = tmp.absolute as t.StringDir;

    try {
      await Fs.write(Fs.join(dir, 'a.txt'), 'abc');
      await Fs.ensureDir(Fs.join(dir, 'sub'));
      await Fs.write(Fs.join(dir, 'sub/b.txt'), 'hello');

      const res = await HashPreflight.scan(dir);
      expect(res.fileCount).to.eql(2);
      expect(res.bytesTotal).to.eql(8);
      expect(res.junkFiles).to.eql([]);
      expect(res.junk).to.eql([]);
    } finally {
      await Fs.remove(dir);
    }
  });

  it('reports known junk files for pre-clean review', async () => {
    const tmp = await Fs.makeTempDir();
    const dir = tmp.absolute as t.StringDir;

    try {
      await Fs.write(Fs.join(dir, '.DS_Store'), 'junk');
      await Fs.ensureDir(Fs.join(dir, 'sub'));
      await Fs.write(Fs.join(dir, 'sub/.DS_Store'), 'junk');

      const res = await HashPreflight.scan(dir);
      expect(res.junkFiles).to.eql([Fs.join(dir, '.DS_Store'), Fs.join(dir, 'sub/.DS_Store')]);
      expect(res.junk).to.eql([
        {
          kind: '.DS_Store',
          label: '.DS_Store',
          files: [Fs.join(dir, '.DS_Store'), Fs.join(dir, 'sub/.DS_Store')],
        },
      ]);
    } finally {
      await Fs.remove(dir);
    }
  });

  it('prompts for cleanup by junk category', async () => {
    const picked = await HashPreflight.promptCleanup(
      {
        targetDir: '/x' as t.StringDir,
        fileCount: 2,
        bytesTotal: 12,
        junkFiles: ['/x/.DS_Store', '/x/sub/.DS_Store'],
        junk: [
          {
            kind: '.DS_Store',
            label: '.DS_Store',
            files: ['/x/.DS_Store', '/x/sub/.DS_Store'],
          },
        ],
      },
      async (args) => {
        expect(args.message).to.eql('Delete before calculating');
        expect(args.options.length).to.eql(1);
        return ['.DS_Store'];
      },
    );

    expect(picked).to.eql(['.DS_Store']);
  });

  it('deletes files from selected junk categories', async () => {
    const tmp = await Fs.makeTempDir();
    const dir = tmp.absolute as t.StringDir;

    try {
      const a = Fs.join(dir, '.DS_Store');
      const b = Fs.join(dir, 'sub/.DS_Store');
      await Fs.write(a, 'junk');
      await Fs.ensureDir(Fs.join(dir, 'sub'));
      await Fs.write(b, 'junk');

      const summary = await HashPreflight.scan(dir);
      const count = await HashPreflight.deleteSelected(summary, ['.DS_Store']);
      expect(count).to.eql(2);
      expect(await Fs.exists(a)).to.eql(false);
      expect(await Fs.exists(b)).to.eql(false);
    } finally {
      await Fs.remove(dir);
    }
  });

  it('triggers confirmation threshold when either files or bytes exceed defaults', () => {
    expect(
      HashPreflight.shouldConfirm({
        targetDir: '/x' as t.StringDir,
        fileCount: 101,
        bytesTotal: 0,
        junkFiles: [],
        junk: [],
      }),
    ).to.eql(true);

    expect(
      HashPreflight.shouldConfirm({
        targetDir: '/x' as t.StringDir,
        fileCount: 1,
        bytesTotal: 51 * 1024 * 1024,
        junkFiles: [],
        junk: [],
      }),
    ).to.eql(true);

    expect(
      HashPreflight.shouldConfirm({
        targetDir: '/x' as t.StringDir,
        fileCount: 100,
        bytesTotal: 50 * 1024 * 1024,
        junkFiles: [],
        junk: [],
      }),
    ).to.eql(false);
  });
});
