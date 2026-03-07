import type { t } from './common.ts';

/**
 * Factory method for creating a new Cmd invokation transaction ID.
 */
export type CmdTxFactory = () => t.StringTx;

/**
 * Command API.
 */
export type Cmd<C extends t.CmdType> = {
  readonly invoke: t.CmdInvoke<C>;
  readonly events: t.CmdEventsFactory<C>;
  readonly method: t.CmdMethodFactory<C>;
};

/**
 * A "command" event structure on an observable/syncing CRDT.
 * A mechanism for achieving distributed function invocation.
 * Primitive for building up an actor model ("message passing computer").
 */
export type CmdLib = {
  /** Type flags */
  readonly Is: t.CmdIsLib;

  /** Tools for working with paths. */
  readonly Path: t.CmdPathLib;

  /** Tools for working with change patches. */
  readonly Patch: t.CmdPatchLib;

  /** Tools for handling events related to the Cmd. */
  readonly Events: t.CmdEventsLib;

  /** Tools for working with the Cmd invokation queue. */
  readonly Queue: t.CmdQueueLib;

  /** Cmd factory method. */
  create<C extends t.CmdType>(transport: t.CmdTransport, options?: CmdCreateOptionsInput): t.Cmd<C>;

  /** Retrieve the hidden "transport" (immutable document) from a command. */
  toTransport(cmd: any): t.CmdTransport;

  /** Retrieve the hidden "paths" field from a command. */
  toPaths(cmd: any): t.CmdPaths;

  /** Retrieve the hidden "issuer" field from a command. */
  toIssuer(cmd: any): string | undefined;
};

/**
 * Loose input to the Cmd `create` factory method.
 */
export type CmdCreateOptionsInput = CmdCreateOptions | t.CmdPaths;

/**
 * Options passed to the Cmd `create` factory method.
 */
export type CmdCreateOptions = {
  tx?: t.CmdTxFactory;
  paths?: t.CmdPaths | t.ObjectPath;
  issuer?: t.StringId; // The identity (URI) of the issuer of the command.
};
