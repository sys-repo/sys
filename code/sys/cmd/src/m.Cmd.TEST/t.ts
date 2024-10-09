import type { t } from './common.ts';
export * from '../common/t.ts';

/**
 * Harness.
 */
export type TestArgs = {
  expect: t.Expect;
  describe: t.Describe;
  it: t.It;
};

/**
 * Common test types.
 */
export type C = C1 | C2;
export type C1 = t.CmdType<'Foo', { foo: number }>;
export type C2 = t.CmdType<'Bar', { msg?: string }>;
