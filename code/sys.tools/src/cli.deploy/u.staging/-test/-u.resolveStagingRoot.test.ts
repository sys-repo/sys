import { describe, expect, it } from '../../../-test.ts';
import { resolveStagingRoot } from '../u.resolveStagingRoot.ts';

describe('Deploy: resolveStagingRoot', () => {
  it('resolves staging root to absolute path', () => {
    const cwd = '/tmp/root';
    const res = resolveStagingRoot({ cwd, stagingRootRel: './staging/site' });
    expect(res).to.eql('/tmp/root/staging/site');
  });

  it('defaults to cwd when staging root is empty', () => {
    const cwd = '/tmp/root';
    const res = resolveStagingRoot({ cwd, stagingRootRel: '' });
    expect(res).to.eql('/tmp/root');
  });
});
