import type { t } from '../common.ts';
export type * from './Test.PropList/t.ts';

type O = Record<string, unknown>;

/**
 * Retrieve a test model (suite | "describe").
 */
export type GetTestBundle = () => Promise<GetTestBundleResponse>;
export type GetTestBundleResponse = {
  specs: t.TestSuiteModel[];
  ctx?: O;
  timeout?: t.Msecs;
};
