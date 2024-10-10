import type { t, u } from './common.ts';

/**
 * Represents a queue of commands that have been invoked.
 * FIFO (first-in, first-out).
 */
export type CmdQueue<C extends t.CmdType = t.CmdType> = CmdQueueItem<C>[];

/* A single item within a Cmd queue. */
export type CmdQueueItem<C extends t.CmdType> = {
  name: C['name'];
  params: C['params'];
  error?: u.ExtractError<C>;
  tx: t.StringTx; // The transaction ID (used for response mapping).
  id: t.StringId; // The unique ID of the command invokation.
  issuer?: t.StringId; // The identity (URI) of the issuer of the command.
};

/**
 * A queue monitor that manages auto-purging.
 */
export type CmdQueueMonitor = t.Lifecycle & {
  readonly bounds: CmdQueueBounds;
  readonly total: CmdQueueTotals;
};

/* Cmd queue size bounds. */
export type CmdQueueBounds = {
  /* Triggers purge at this value. */
  readonly max: number;

  /* Purges to no less than this value. */
  readonly min: number;
};

/* Cmd queue totals stats. */
export type CmdQueueTotals = {
  readonly current: number;
  readonly purged: number;
  readonly complete: number;
};

/**
 * Tools for working with a Cmd queue.
 */
export type CmdQueueLib = {
  /* Collapse the queue array. */
  purge<C extends t.CmdType>(cmd: t.Cmd<C>, options?: { min?: number }): number;

  /* Derive the queue totals from the given transport. */
  totals<C extends t.CmdType>(cmd: t.Cmd<C>): t.CmdQueueTotals;

  /* Start a queue/purge monitor for the given command. */
  autopurge<C extends t.CmdType>(
    cmd: t.Cmd<C>,
    options?: t.CmdQueueAutopurgeOptions,
  ): t.CmdQueueMonitor;
};
/* Options passed to CmdQueue.autopurge. */
export type CmdQueueAutopurgeOptions = {
  min?: number;
  max?: number;
  dispose$?: t.UntilObservable;
};
