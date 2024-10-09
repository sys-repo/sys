import type { t } from './common.ts';

type S = string;
type O = Record<string, unknown>;

/**
 * Abstract resolver paths to the location of
 * the command structure within the CRDT.
 */
export type CmdPaths = {
  queue: t.ObjectPath;
  log: t.ObjectPath;
};

/**
 * The shape of the default <CmdPaths> as an object.
 */
export type CmdPathsObject<C extends t.CmdType = t.CmdType> = {
  queue?: t.CmdQueueItem<C>[];
  log?: t.CmdLog;
};

/**
 * Tools for working with Cmd paths.
 */
export type CmdPathLib = {
  /* Type flag helpers. */
  readonly Is: CmdPathIs;

  /* Wrangle the paths object from various input types. */
  wrangle(input?: t.CmdPaths | t.ObjectPath): t.CmdPaths;

  /**
   * Factory for a resolver that reads path locations from the given abstract document.
   * This might be the root document OR a lens within a document.
   */
  resolver(input?: t.CmdPaths | t.ObjectPath): t.CmdResolver;

  /* Prepend a path to each item within a <CmdPaths> set. */
  prepend(prefix: t.ObjectPath, paths?: t.CmdPaths): t.CmdPaths;
};

/**
 * Type flags related to Cmd paths.
 */
export type CmdPathIs = {
  /* Determine if the input is a `CmdPaths` object. */
  commandPaths(input: any): input is t.CmdPaths;

  /* Determine if the input is a string array. */
  stringArray(input: any): input is string[];
};

/**
 * A path/data resolver for a command.
 */
export type CmdResolver = {
  /* The paths used by the resolver. */
  paths: t.CmdPaths;

  /* Queue related data items. */
  readonly queue: t.CmdResolverQueue;

  /* Retrieves the Cmd log. */
  log(data: O): t.CmdLog;

  /* Collapse into a simple object. */
  toObject<C extends t.CmdType>(data: O): t.CmdObject<C>;
};

/* Queue related data items. */
export type CmdResolverQueue = {
  /* The array containing the list of invoked commands. */
  list<C extends t.CmdType>(data: O): t.CmdQueueItem<C>[];

  /* Retrieves a helper for working with a single item within the queue. */
  item<C extends t.CmdType>(data: O, index?: number): t.CmdResolverQueueItem;
};

/**
 * A single queue item.
 */
export type CmdResolverQueueItem = {
  /* The item index */
  index: t.Index;

  /* The object-path to the value. */
  path: t.ObjectPath;

  /* Read the name from the item. */
  name<N extends S = S>(defaultValue?: string): N;

  /* Read the paramters object from the item. */
  params<P extends O = O>(defaultValue: P): P;

  /* Read the error from the item. */
  error<E extends O = O>(defaultValue?: E): E;

  /* Read the Tx (transaction ID) from the item. */
  tx(defaultValue?: string): string;

  /* Read the ID from the item. */
  id(defaultValue?: string): string;

  /* Read the Issue ID from the item. */
  issuer(defaultValue?: string): string;
};
