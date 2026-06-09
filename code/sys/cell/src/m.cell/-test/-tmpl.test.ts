import { describe, expect, Fs, it } from '../../-test.ts';
import { CellTmpl } from '../../m.tmpl/mod.ts';
import { Cell } from '../mod.ts';
import { CellPaths } from '../u/paths.ts';

describe('CellTmpl', () => {
  it('materializes the default Cell folder', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'cell.tmpl.default.' });
    const root = tmp.absolute;

    try {
      const tmpl = CellTmpl.make('default');
      const res = await tmpl.write(root);

      expect(res.ops.filter((op) => op.kind === 'create').length).to.eql(3);
      expect(await read(root, '.gitignore')).to.eql('.env\n.pi/\n');
      expect(await read(root, 'data/README.md')).to.contain('Source documents and material');
      expect(await Fs.exists(Fs.join(root, 'view', 'README.md'))).to.eql(false);
      expect(await Fs.exists(Fs.join(root, CellPaths.descriptor))).to.eql(true);
      expect(await Fs.exists(Fs.join(root, CellPaths.legacy.descriptor))).to.eql(false);

      const cell = await Cell.load(root);
      expect(cell.descriptor).to.eql({
        kind: 'cell',
        version: 1,
      });
    } finally {
      await Fs.remove(root);
    }
  });

  it('preserves an existing .gitignore and appends default ignores once', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'cell.tmpl.default.gitignore.' });
    const root = tmp.absolute;

    try {
      await Fs.write(Fs.join(root, '.gitignore'), 'node_modules/\n');

      const tmpl = CellTmpl.make('default');
      await tmpl.write(root);
      await tmpl.write(root);

      expect(await read(root, '.gitignore')).to.eql('node_modules/\n.env\n.pi/\n');
    } finally {
      await Fs.remove(root);
    }
  });
});

async function read(root: string, path: string) {
  const res = await Fs.readText(Fs.join(root, path));
  if (!res.ok) throw res.error;
  return res.data ?? '';
}
