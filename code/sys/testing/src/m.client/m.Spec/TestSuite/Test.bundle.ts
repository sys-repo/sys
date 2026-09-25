import { Loader } from '../TestSuite.helpers/mod.ts';
import { Def } from './TestSuiteModel.ts';
import type { t } from './common.ts';

const describe = Def.variants();

/**
 * Bundle together a suite of tests from different ES modules,
 * either statically or dynamically imported.
 */
export async function bundle(...args: any[]) {
  const param1 = args[0];
  const param2 = typeof param1 === 'string' ? args[1] : param1;
  const suites = (await Loader.import(param2)).map((e) => e.suite);
  const name = typeof param1 === 'string' ? param1 : Wrangle.rootName(suites);

  if (suites.length === 1) {
    // Single suite only.
    const root = suites[0];
    root.state.description = name; // NB: Ensure any explicit name passed to bundle is used on the singlular root.
    return root;
  } else {
    // Multiple suites.
    const root = describe(name);
    return root.merge(...suites);
  }
}

/**
 * [Helpers]
 */

const Wrangle = {
  rootName(suites: t.TestSuiteModel[]) {
    return suites.length === 1 ? suites[0].state.description : 'Tests';
  },
};
