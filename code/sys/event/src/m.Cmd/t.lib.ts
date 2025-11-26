import type { t } from './common.ts';

/**
 * Namespace-style library surface for the command bus.
 * The implementation in `m.Cmd/mod.ts` should satisfy this shape.
 *
 * Call `Cmd.make<N,P,R>()` to obtain a typed instance for a concrete
 * command set (e.g. worker commands in @sys/driver-automerge).
 */
export type CmdLib = {
  /** Type guards. */
  readonly Is: t.CmdIsLib;
  /** Transport adapters for wiring Cmd to various message endpoints. */
  readonly Transport: t.CmdTransportLib;

  /**
   * Create a typed command instance for a specific command set.
   */
  readonly make: t.CmdMakeFactory;
};

/** Options passed to `Cmd.make()` */
export type CmdMakeOptions = {
  /** Optional namespace used to disambiguate shared transports. */
  ns?: t.CmdNamespace;
};
