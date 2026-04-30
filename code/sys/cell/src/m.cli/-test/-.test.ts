import { describe, expect, it } from '../../-test.ts';
import { stripAnsi } from '../common.ts';
import { CellCli } from '../mod.ts';
import { FmtHelp } from '../u.help.ts';

describe(`@sys/cell/cli`, () => {
  it('API', async () => {
    const m = await import('@sys/cell/cli');
    expect(m.CellCli).to.equal(CellCli);
  });

  it('help → includes the embedded default descriptor', async () => {
    const text = stripAnsi(await FmtHelp.output());
    expect(text).to.contain('folder-shaped metamedium');
    expect(text).to.contain('validly rewritten');
    expect(text).to.contain('-config/@sys.cell/cell.yaml');
    expect(text).to.contain('kind: cell');
    expect(text).to.contain('runtime:');
  });
});
