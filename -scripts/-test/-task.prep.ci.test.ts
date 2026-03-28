import { describe, expect, it } from '@sys/testing/server';
import { toJsrCiPaths } from '../task.prep.ci.ts';

describe('scripts/task.prep.ci', () => {
  it('filters an explicit ordered source subset to jsr-publishable modules', () => {
    const paths = [
      'code/sys/types',
      'code/sys/std',
      'code/sys/workspace',
      'deploy/@tdb.edu.slug',
    ];

    expect(toJsrCiPaths(paths)).to.eql([
      'code/sys/types',
      'code/sys/std',
      'code/sys/workspace',
      'deploy/@tdb.edu.slug',
    ]);
  });
});
