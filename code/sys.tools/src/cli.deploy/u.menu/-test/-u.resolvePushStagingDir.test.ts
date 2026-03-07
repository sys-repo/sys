import { describe, expect, it } from '../../../-test.ts';
import { resolvePushStagingDir } from '../u/u.resolvePushStagingDir.ts';

describe('Deploy: resolvePushStagingDir', () => {
  it('resolves staging root to absolute path', () => {
    const cwd = '/tmp/root';
    const res = resolvePushStagingDir({ cwd, stagingRootRel: './staging/site' });
    expect(res).to.eql('/tmp/root/staging/site');
  });

  it('defaults to cwd when staging root is empty', () => {
    const cwd = '/tmp/root';
    const res = resolvePushStagingDir({ cwd, stagingRootRel: '' });
    expect(res).to.eql('/tmp/root');
  });
});
