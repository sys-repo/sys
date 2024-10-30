import type { t, u } from './common.ts';

/** Options passed to the Cmd events factory. */
export type CmdEventsOptions = {
  paths?: t.CmdPaths;
  issuer?: t.StringId | t.StringId[];
  dispose$?: t.UntilObservable;
};

export type CmdEventsLib = {
  /** Events factory. */
  create<C extends t.CmdType>(doc?: t.CmdTransport, options?: CmdEventsOptions): t.CmdEvents<C>;

  /**
   * Scan back in a queue and find the given <last> item and
   * return the set from that point on.
   */
  unprocessed(queue: t.CmdQueue, lastProcessed: string): t.CmdQueue;
};

/**
 * Factory.
 */
export type CmdEventsFactory<C extends t.CmdType> = (dispose$?: t.UntilObservable) => CmdEvents<C>;

/**
 * Command Events API.
 */
export type CmdEvents<C extends t.CmdType> = t.Lifecycle & CmdEventsInner<C>;
type CmdEventsInner<C extends t.CmdType> = Pick<t.Lifecycle, 'dispose$' | 'disposed'> & {
  readonly $: t.Observable<CmdEvent>;
  readonly tx$: t.Observable<CmdTx<C>>;
  readonly error$: t.Observable<CmdTx<C>>;
  readonly on: t.CmdEventsOnMethod<C>;
  readonly issuer: t.CmdEventsIssuerMethod<C>;
};

/**
 * Register handlers for named events.
 */
export type CmdEventsOnMethod<C extends t.CmdType> = <N extends C['name']>(
  name: N,
  handler?: CmdEventsOnMethodHandler<u.CmdTypeMap<C>[N]>,
) => t.Observable<CmdTx<u.CmdTypeMap<C>[N]>>;
export type CmdEventsOnMethodHandler<C extends t.CmdType> = (e: CmdTx<C>) => void;

/**
 * Spawn an event structure that listens just for events from specific issuer(s).
 */
export type CmdEventsIssuerMethod<C extends t.CmdType> = (
  issuer: t.StringId | t.StringId[],
) => CmdEventsInner<C>;

/**
 * EVENT (Definitions)
 */
export type CmdEvent = CmdTxEvent;

/**
 * Fires when a command is invoked via a new transaction (eg "fire").
 */
export type CmdTxEvent<C extends t.CmdType = t.CmdType> = {
  type: 'sys.cmd/tx';
  payload: CmdTx<C>;
};

/**
 * Represents a single command transaction ("tx").
 */
export type CmdTx<C extends t.CmdType = t.CmdType> = {
  readonly name: C['name'];
  readonly params: C['params'];
  readonly error?: u.ExtractError<C>;
  readonly tx: t.StringTx;
  readonly id: t.StringId;
  readonly issuer?: t.StringId;
};
