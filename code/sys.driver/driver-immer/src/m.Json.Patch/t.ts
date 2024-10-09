import type { t } from '../common.ts';

type O = Record<string, unknown>;

/* The kind of change a patch represents. */
export type PatchOperationKind = 'update' | 'replace';

/* Mutation function for safely changing the immutable value. */
export type PatchMutation<T extends O> = (draft: T, ctx: PatchMutationCtx) => void;

/* Asynchronous mutation function.  */
export type PatchMutationAsync<T extends O> = (draft: T, ctx: PatchMutationCtx) => Promise<void>;

/* Context passed to a patch mutation. */
export type PatchMutationCtx = {
  /* Convert a proxy into a simple POJO. */
  toObject<T extends O>(input: any): T;
};

/**
 * Inline copy of the `immer` Patch type.
 */
export type ArrayPatch = {
  op: t.PatchOperation['op'];
  path: t.ObjectPath;
  value?: any;
};

type A = ArrayPatch;

/**
 * Tools for working with patches.
 */
export type PatchTool = {
  /* Convert the given input to a simple object. */
  toObject<T extends O>(input: any): T;

  /* Convert the given input to a patch-set. */
  toPatchSet(forward?: A | A[], backward?: A | A[]): t.PatchSet;

  /* Determine if the given set of patches is empty. */
  isEmpty(patches: t.PatchSet): boolean;

  /* Determine if the given value is an Immer Proxy object. */
  isProxy(value: any): boolean;

  /* Function used to mutate the immutable value. */
  change<T extends O>(from: T, fn: t.PatchMutation<T> | T): t.PatchChange<T>;

  /* An Async option for mutating the object. */
  changeAsync<T extends O>(from: T, fn: t.PatchMutationAsync<T>): Promise<t.PatchChange<T>>;

  /* Apply patches to an object. */
  apply<T extends O>(from: T, patches: t.PatchOperation[] | t.PatchSet): T;
};

/* Event handle called when on patch change. */
export type PatchChangeHandler<T extends O> = (e: t.PatchChange<T>) => void;

/* Details about a patch change. */
export type PatchChange<T extends O> = {
  before: T;
  after: T;
  op: PatchOperationKind;
  patches: t.PatchSet;
  tx?: t.StringTx;
};

/**
 * A set of patches that allow for forward and backward transformations on data.
 */
export type PatchSet = { prev: t.PatchOperation[]; next: t.PatchOperation[] };
