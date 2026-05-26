import { describe, expect, Fs, it } from '../../-test.ts';
import { CellMigrate } from '../u.migrate/mod.ts';

describe('CellMigrate', () => {
  it('dir → no-ops cleanly before concrete migrations are added', async () => {
    const root = Fs.resolve('./.tmp/cell.migrate.noop');

    const res = await CellMigrate.dir(root);

    expect(res).to.eql({ migrated: [], skipped: [] });
  });

  it('message → reports only actual migrated items', () => {
    expect(CellMigrate.message({ migrated: [], skipped: [] })).to.eql(undefined);
    expect(
      CellMigrate.message({
        migrated: [{ from: 'a', to: 'b' }],
        skipped: [],
      }),
    ).to.eql('Migrated 1 Cell config/runtime item.');
    expect(
      CellMigrate.message({
        migrated: [{ from: 'a', to: 'b' }, { from: 'c', to: 'd' }],
        skipped: [],
      }),
    ).to.eql('Migrated 2 Cell config/runtime items.');
  });
});
