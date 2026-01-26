import { describe, expect, it, Path } from '../../../-test.ts';
import { resolveStagingTarget } from '../u/u.resolveStagingTarget.ts';

describe('Deploy: resolveStagingTarget', () => {
  it('resolves root + mapping', () => {
    const cwd = Path.resolve('/tmp/cwd');
    const res = resolveStagingTarget({
      cwd,
      stagingRootRel: './staging/tdb',
      mappingStagingRel: './slc.db.team',
    });
    expect(res).to.eql(Path.resolve(cwd, 'staging/tdb', 'slc.db.team'));
  });

  it('defaults mapping to "."', () => {
    const cwd = Path.resolve('/tmp/cwd');
    const res = resolveStagingTarget({
      cwd,
      stagingRootRel: './staging/tdb/slc.db.team',
      mappingStagingRel: '.',
    });
    expect(res).to.eql(Path.resolve(cwd, 'staging/tdb/slc.db.team'));
  });

  it('defaults empty mapping to "."', () => {
    const cwd = Path.resolve('/tmp/cwd');
    const res = resolveStagingTarget({
      cwd,
      stagingRootRel: './staging/tdb',
      mappingStagingRel: '',
    });
    expect(res).to.eql(Path.resolve(cwd, 'staging/tdb', '.'));
  });
});
