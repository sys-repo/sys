import { describe, expect, it } from '../../../-test.ts';
import type { t } from '../common.ts';
import { StageProfileFs } from '../u.fs.ts';

describe('StageProfileFs', () => {
  it('derives a temp staging target from cwd and mount', () => {
    const cwd = '/tmp/slc-data' as t.StringDir;
    const mount = 'sample-1' as t.StringId;
    const target = StageProfileFs.target(cwd, mount);

    expect(target).to.eql('/tmp/slc-data/.tmp/staging.slc-data/sample-1');
  });
});
