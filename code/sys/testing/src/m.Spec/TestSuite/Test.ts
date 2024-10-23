import { Is, Loader, Stats, Total, Transform, Tree } from '../TestSuite.helpers/mod.ts';
import { bundle } from './Test.bundle.ts';
import { Def } from './TestSuiteModel.ts';
import type { t } from './common.ts';

const describe = Def.variants();

/**
 * Entry point to the unit-testing system.
 */
export const Test: t.Test = {
  Is,
  Tree,
  Total,
  Stats,

  using: Transform,
  describe,
  bundle,
  import: Loader.import,

  /**
   * Bundle and run a set of tests.
   */
  async run(...args: any[]) {
    const bundle = await Test.bundle.apply(null, args as any);
    return bundle.run();
  },
};
