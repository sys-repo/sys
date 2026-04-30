import { describe, expect, Fs, it } from '../../-test.ts';
import { CellTmpl } from '../../../-tmpl/mod.ts';
import { Cell } from '../mod.ts';

describe('CellTmpl', () => {
  it('materializes a blank Cell folder', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'cell.tmpl.blank.' });
    const root = tmp.absolute;

    try {
      const tmpl = CellTmpl.make('blank');
      const res = await tmpl.write(root);

      expect(res.ops.filter((op) => op.kind === 'create').length).to.eql(3);
      expect(await Fs.exists(Fs.join(root, 'data', 'README.md'))).to.eql(true);
      expect(await Fs.exists(Fs.join(root, 'view', 'README.md'))).to.eql(true);
      expect(await Fs.exists(Fs.join(root, '-config/@sys.cell/cell.yaml'))).to.eql(true);

      const cell = await Cell.load(root);
      expect(cell.descriptor).to.eql({
        kind: 'cell',
        version: 1,
        dsl: { root: './data' },
        views: {},
        runtime: { services: [] },
      });
    } finally {
      await Fs.remove(root);
    }
  });
});
