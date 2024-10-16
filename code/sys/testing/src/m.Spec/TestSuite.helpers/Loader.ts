import type { t } from './common.ts';
import { Is } from './Is.ts';

type TResult = { suite: t.TestSuiteModel; isDefault: boolean };

/**
 * Helpers for loading test suite modules.
 */
export const Loader = {
  /**
   * Import test suites from a variety of input types
   */
  async import(
    input: t.BundleImport | t.BundleImport[],
    options: { init?: boolean } = {},
  ): Promise<TResult[]> {
    type TImport = t.TestSuiteModel | Promise<any>;
    const source: TImport[] = Array.isArray(input) ? input : [input];
    const res: TResult[] = [];

    const push = (suite: t.TestSuiteModel, isDefault: boolean) => {
      const exists = res.find((item) => item?.suite === suite);
      if (!exists) res.push({ suite, isDefault });
    };

    const load = async (item: TImport) => {
      const module = Is.promise(item) ? await item : item;
      if (module === null || typeof module !== 'object') return;

      if (Is.suite(module.default)) push(module.default, true);
      if (Is.suite(item)) return push(item, false);

      Object.keys(module)
        .filter((key) => key !== 'default')
        .forEach((key) => {
          if (Is.suite(module[key])) push(module[key], false);
        });
    };

    for (const item of source) await load(item); // NB: Ordered.
    if (options.init) await Promise.all(res.map((item) => item?.suite.init()));
    return res.filter(Boolean);
  },
};
