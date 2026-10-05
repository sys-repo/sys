import { describe, expect, it } from '../../-test.ts';
import { CellPaths } from '../u/paths.ts';

describe('CellPaths', () => {
  it('names Cell metadata paths relative to the Cell root', () => {
    expect(CellPaths.metaDir).to.eql('-config/@sys.cell');
    expect(CellPaths.descriptor).to.eql('-config/@sys.cell/cell.yaml');
    expect(CellPaths.configDir).to.eql('-config');
    expect(CellPaths.legacy.descriptor).to.eql('-cell/cell.yaml');
  });
});
