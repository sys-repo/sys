import type { t } from './common.ts';

/**
 * Factory for abstractly producing test conditions
 * for the standardised unit-tests.
 */
export type CmdTestSetup = () => Promise<CmdTestState>;

/* Factory that produces Cmd transports (aka. Immutable<T> documents). */
export type CmdTestFactory = () => Promise<t.CmdTransport> | t.CmdTransport;

/* State container for a Cmd test. */
export type CmdTestState = t.Disposable & {
  /* The tansport (Immutable<T> document). */
  readonly doc: t.CmdTransport;

  /* Factory for producing new Cmd transports. */
  readonly factory: CmdTestFactory;
};
