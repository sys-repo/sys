import type { t } from './common.ts';

/**
 * Factory for abstractly producing test conditions
 * for the standardised unit-tests.
 */
export type CmdTestSetup = () => Promise<CmdTestState>;
export type CmdTestFactory = () => Promise<t.CmdTransport>;
export type CmdTestState = t.Disposable & {
  readonly doc: t.CmdTransport;
  readonly factory: CmdTestFactory;
};
