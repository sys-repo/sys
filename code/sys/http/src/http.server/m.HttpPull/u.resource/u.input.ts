import { Is as ServerIs } from '@sys/std/is/server';

import { Arr, Fetch, Is, Num, Obj, type t, validateResponsePolicy } from '../common.ts';
import { failureRecord, RESOURCE_FAILURE, type ResourceFailure } from './u.failure.ts';
import { type ResourceSnapshot, snapshotResources } from './u.snapshot.ts';

export type PolicySnapshot = t.HttpPull.ResourcePolicy & {
  readonly sourceOrigins: ReadonlySet<string>;
};

export type PreparedStart = {
  readonly ok: true;
  readonly resources: readonly ResourceSnapshot[];
  readonly rooted: t.FsRooted.Instance;
  readonly policy: PolicySnapshot;
  readonly headers?: t.HttpFetch.Mutate.Headers;
  readonly until?: t.UntilInput;
  readonly resourceCount: number;
};

export type RejectedStart = {
  readonly ok: false;
  readonly resources: readonly ResourceSnapshot[];
  readonly records: readonly t.HttpPull.ResourceRecordFailure[];
  readonly failure: ResourceFailure;
  readonly resourceCount: number;
};

export type Preparation = PreparedStart | RejectedStart;
type RootedMethod = (...args: never[]) => unknown;

const apply = Reflect.apply;
const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;
const isFrozen = Object.isFrozen;
const objectPrototype = Object.prototype;
const ownKeys = Reflect.ownKeys;

const MAX_TRANSFER_CHUNK_BYTES = 4_294_967_295;
const KEYS = {
  START: ['resources', 'rooted', 'policy', 'credentials', 'until'],
  POLICY: [
    'response',
    'maxResources',
    'concurrency',
    'maxAttempts',
    'retryDelay',
    'maxRetryElapsed',
    'maxTotalBytes',
    'totalTimeout',
  ],
  CREDENTIAL: ['accessToken', 'headers'],
  ROOTED: ['path', 'Target', 'Lease', 'Tree', 'File', 'Stage'],
  ROOTED_TARGET: ['admit'],
  ROOTED_LEASE: ['acquire'],
  ROOTED_TREE: ['inspectSeal', 'seal', 'remove', 'removeBatch'],
  ROOTED_FILE: ['publish'],
  ROOTED_STAGE: ['create', 'discard', 'promote'],
} as const;
const DATA_UNAVAILABLE = freeze({ ok: false as const });

/** Snapshot and validate every operation authority before asynchronous work begins. */
export function prepareStart(input: unknown): Preparation {
  const snapshot = snapshotStartInput(input);
  if (!snapshot) return rejectStart([], RESOURCE_FAILURE.input, 0);

  const policy = snapshotPolicy(snapshot.policy);
  if (!policy) {
    return rejectStart([], RESOURCE_FAILURE.policy, resourceCount(snapshot.resources));
  }
  if (!Arr.isArray(snapshot.resources)) return rejectStart([], RESOURCE_FAILURE.input, 0);

  let count = 0;
  try {
    count = snapshot.resources.length;
  } catch {
    return rejectStart([], RESOURCE_FAILURE.input, 0);
  }
  if (count > policy.maxResources) return rejectStart([], RESOURCE_FAILURE.resources, count);

  const resources = snapshotResources(snapshot.resources, {
    sourceOrigins: policy.sourceOrigins,
    maxFileBytes: policy.response.maxBytes,
    maxTotalBytes: policy.maxTotalBytes,
  });
  if (!resources.ok) {
    return {
      ok: false,
      resources: resources.resources,
      records: resources.records,
      failure: resources.failure,
      resourceCount: count,
    };
  }

  const rooted = snapshotRooted(snapshot.rooted);
  if (!rooted) return rejectStart(resources.resources, RESOURCE_FAILURE.input, count);

  const credentials = snapshotCredentials(snapshot.credentials);
  if (!credentials.ok) {
    return rejectStart(resources.resources, RESOURCE_FAILURE.input, count);
  }

  return {
    ok: true,
    resources: resources.resources,
    rooted,
    policy,
    headers: credentials.headers,
    until: snapshot.until as t.UntilInput | undefined,
    resourceCount: count,
  };
}

/** Replace a preparation with stable rejected evidence. */
export function rejectStart(
  resources: readonly ResourceSnapshot[],
  failure: ResourceFailure,
  count: number,
): RejectedStart {
  return {
    ok: false,
    resources,
    records: Object.freeze(resources.map((resource) => failureRecord(resource, failure))),
    failure,
    resourceCount: count,
  };
}

function snapshotStartInput(input: unknown): {
  readonly resources: unknown;
  readonly rooted: unknown;
  readonly policy: unknown;
  readonly credentials: unknown;
  readonly until: unknown;
} | undefined {
  try {
    if (!Is.record(input)) return;
    if (Obj.keys(input).some((key) => !KEYS.START.includes(key as typeof KEYS.START[number]))) {
      return;
    }
    if (
      !Obj.hasOwn(input, 'resources') ||
      !Obj.hasOwn(input, 'rooted') ||
      !Obj.hasOwn(input, 'policy')
    ) {
      return;
    }
    const until = Obj.hasOwn(input, 'until') ? input.until : undefined;
    if (!Is.untilInput(until)) return;
    return Object.freeze({
      resources: input.resources,
      rooted: input.rooted,
      policy: input.policy,
      credentials: Obj.hasOwn(input, 'credentials') ? input.credentials : undefined,
      until,
    });
  } catch {
    return;
  }
}

function snapshotPolicy(input: unknown): PolicySnapshot | undefined {
  try {
    if (!Is.record(input)) return;
    if (!KEYS.POLICY.every((key) => Obj.hasOwn(input, key))) return;
    if (Obj.keys(input).some((key) => !KEYS.POLICY.includes(key as typeof KEYS.POLICY[number]))) {
      return;
    }

    const response = validateResponsePolicy(input.response);
    if (!response.ok) return;

    const maxResources = input.maxResources;
    const concurrency = input.concurrency;
    const maxAttempts = input.maxAttempts;
    const retryDelay = input.retryDelay;
    const maxRetryElapsed = input.maxRetryElapsed;
    const maxTotalBytes = input.maxTotalBytes;
    const totalTimeout = input.totalTimeout;
    if (!isSafeInt(maxResources, 0)) return;
    if (!isSafeInt(concurrency, 1)) return;
    if (!isSafeInt(maxAttempts, 1)) return;
    if (!isSafeInt(retryDelay, 0)) return;
    if (!isSafeInt(maxRetryElapsed, 0)) return;
    if (!isSafeInt(maxTotalBytes, 0)) return;
    if (!isSafeInt(totalTimeout, 1)) return;
    if (maxResources > 0 && maxAttempts > Math.floor(Num.MAX_INT / maxResources)) return;
    const maxInFlight = Math.min(maxResources, concurrency);
    const chunkHeadroom = Math.floor((Num.MAX_INT - maxTotalBytes) / MAX_TRANSFER_CHUNK_BYTES);
    if (maxInFlight > chunkHeadroom) return;

    const sourceOrigins = new Set(response.value.sourceOrigins);
    const credentialOrigins = new Set(response.value.credentialOrigins);
    const responseSnapshot: t.HttpFetch.ResponsePolicy = Object.freeze({
      maxBytes: response.value.maxBytes,
      timeout: response.value.timeout,
      maxRedirects: response.value.maxRedirects,
      progressInterval: response.value.progressInterval,
      sourceOrigins: Object.freeze([...sourceOrigins]),
      credentialOrigins: Object.freeze([...credentialOrigins]),
    });
    return Object.freeze({
      response: responseSnapshot,
      maxResources,
      concurrency,
      maxAttempts,
      retryDelay,
      maxRetryElapsed,
      maxTotalBytes,
      totalTimeout,
      sourceOrigins,
    });
  } catch {
    return;
  }
}

function snapshotCredentials(input: unknown):
  | { readonly ok: true; readonly headers?: t.HttpFetch.Mutate.Headers }
  | { readonly ok: false } {
  if (input === undefined) return { ok: true };
  try {
    if (!Is.record(input)) return { ok: false };
    if (
      Obj.keys(input).some((key) =>
        !KEYS.CREDENTIAL.includes(key as typeof KEYS.CREDENTIAL[number])
      )
    ) {
      return { ok: false };
    }

    const accessToken = Obj.hasOwn(input, 'accessToken') ? input.accessToken : undefined;
    const mutate = Obj.hasOwn(input, 'headers') ? input.headers : undefined;
    if (accessToken !== undefined && !Is.str(accessToken) && !Is.func(accessToken)) {
      return { ok: false };
    }
    if (mutate !== undefined && !Is.func(mutate)) return { ok: false };

    const options = { accessToken, headers: mutate } as t.HttpFetch.DefaultHeaders.Options;
    const headers = Fetch.defaultHeaders(options);

    const entries: Array<readonly [string, string]> = [];
    headers.forEach((value, name) => entries.push(Object.freeze([name, value])));
    if (entries.length === 0) return { ok: true };
    const frozen = Object.freeze(entries);
    return {
      ok: true,
      headers: ({ set }) => {
        frozen.forEach(([name, value]) => set(name, value));
      },
    };
  } catch {
    return { ok: false };
  }
}

function resourceCount(input: unknown): number {
  try {
    return Arr.isArray(input) && Num.Is.safeInt(input.length) ? input.length : 0;
  } catch {
    return 0;
  }
}

function snapshotRooted(input: unknown): t.FsRooted.Instance | undefined {
  if (!hasExactFrozenDataShape(input, KEYS.ROOTED)) return;

  const path = ownData(input, 'path');
  const target = ownData(input, 'Target');
  const lease = ownData(input, 'Lease');
  const tree = ownData(input, 'Tree');
  const file = ownData(input, 'File');
  const stage = ownData(input, 'Stage');
  if (
    !path.ok || !Is.str(path.value) ||
    !target.ok || !hasExactFrozenDataShape(target.value, KEYS.ROOTED_TARGET) ||
    !lease.ok || !hasExactFrozenDataShape(lease.value, KEYS.ROOTED_LEASE) ||
    !tree.ok || !hasExactFrozenDataShape(tree.value, KEYS.ROOTED_TREE) ||
    !file.ok || !hasExactFrozenDataShape(file.value, KEYS.ROOTED_FILE) ||
    !stage.ok || !hasExactFrozenDataShape(stage.value, KEYS.ROOTED_STAGE)
  ) return;

  const admit = ownMethod<t.FsRooted.Instance['Target']['admit']>(target.value, 'admit');
  const acquire = ownMethod<t.FsRooted.Instance['Lease']['acquire']>(lease.value, 'acquire');
  const inspectSeal = ownMethod<t.FsRooted.Instance['Tree']['inspectSeal']>(
    tree.value,
    'inspectSeal',
  );
  const seal = ownMethod<t.FsRooted.Instance['Tree']['seal']>(tree.value, 'seal');
  const remove = ownMethod<t.FsRooted.Instance['Tree']['remove']>(tree.value, 'remove');
  const removeBatch = ownMethod<t.FsRooted.Instance['Tree']['removeBatch']>(
    tree.value,
    'removeBatch',
  );
  const publish = ownMethod<t.FsRooted.Instance['File']['publish']>(file.value, 'publish');
  const create = ownMethod<t.FsRooted.Instance['Stage']['create']>(stage.value, 'create');
  const discard = ownMethod<t.FsRooted.Instance['Stage']['discard']>(stage.value, 'discard');
  const promote = ownMethod<t.FsRooted.Instance['Stage']['promote']>(stage.value, 'promote');
  if (
    !admit || !acquire || !inspectSeal || !seal || !remove || !removeBatch || !publish || !create ||
    !discard || !promote
  ) return;

  const Target: t.FsRooted.Instance['Target'] = freeze({
    admit<K extends t.FsRooted.TargetKind>(
      targets: readonly t.FsRooted.TargetInput<K>[],
      options?: t.FsRooted.OperationOptions,
    ): Promise<t.FsRooted.Admission<K>> {
      return apply(admit, undefined, [targets, options]);
    },
  });
  const Lease: t.FsRooted.Instance['Lease'] = freeze({
    acquire(
      targets: readonly t.FsRooted.Target<'directory'>[],
      options: t.FsRooted.LeaseOptions,
    ): Promise<t.FsRooted.LeaseResult> {
      return apply(acquire, undefined, [targets, options]);
    },
  });
  const Tree: t.FsRooted.Instance['Tree'] = freeze({
    inspectSeal(
      ownedTree: t.FsRooted.OwnedTree,
      options?: t.FsRooted.OwnedTreeOptions,
    ): Promise<t.FsRooted.SealInspection> {
      return apply(inspectSeal, undefined, [ownedTree, options]);
    },
    seal(
      ownedTree: t.FsRooted.OwnedTree,
      options?: t.FsRooted.OwnedTreeOptions,
    ): Promise<t.FsRooted.SealResult> {
      return apply(seal, undefined, [ownedTree, options]);
    },
    remove(
      target: t.FsRooted.Target<'directory'>,
      options: t.FsRooted.RemoveTreeOptions,
    ): Promise<t.FsRooted.RemoveTreeResult> {
      return apply(remove, undefined, [target, options]);
    },
    removeBatch(
      targets: readonly t.StringPath[],
      options?: t.FsRooted.OperationOptions,
    ): Promise<t.FsRooted.RemoveTreeBatchResult> {
      return apply(removeBatch, undefined, [targets, options]);
    },
  });
  const File: t.FsRooted.Instance['File'] = freeze({
    publish(
      target: t.FsRooted.Target<'file'>,
      bytes: Uint8Array,
      options?: t.FsRooted.OperationOptions,
    ): Promise<t.FsRooted.FileResult> {
      return apply(publish, undefined, [target, bytes, options]);
    },
  });
  const Stage: t.FsRooted.Instance['Stage'] = freeze({
    create(options?: t.FsRooted.OperationOptions): Promise<t.FsRooted.Stage> {
      return apply(create, undefined, [options]);
    },
    discard(
      value: t.FsRooted.Stage,
      options?: t.FsRooted.OperationOptions,
    ): Promise<void> {
      return apply(discard, undefined, [value, options]);
    },
    promote(
      value: t.FsRooted.Stage,
      target: t.FsRooted.Target<'directory'>,
      options?: t.FsRooted.PromotionOptions,
    ): Promise<t.FsRooted.PromotionResult> {
      return apply(promote, undefined, [value, target, options]);
    },
  });
  return freeze({
    path: path.value as t.StringAbsoluteDir,
    Target,
    Lease,
    Tree,
    File,
    Stage,
  });
}

function ownData(
  input: object,
  key: PropertyKey,
): Readonly<{ ok: true; value: unknown }> | Readonly<{ ok: false }> {
  try {
    const descriptor = getOwnPropertyDescriptor(input, key);
    return descriptor && descriptor.enumerable && 'value' in descriptor
      ? freeze({ ok: true as const, value: descriptor.value })
      : DATA_UNAVAILABLE;
  } catch {
    return DATA_UNAVAILABLE;
  }
}

function ownMethod<T extends RootedMethod>(input: object, key: PropertyKey): T | undefined {
  const property = ownData(input, key);
  if (
    !property.ok || !Is.func(property.value) || ServerIs.Native.proxy(property.value)
  ) return;
  return property.value as T;
}

function hasExactFrozenDataShape(
  input: unknown,
  expected: readonly PropertyKey[],
): input is object {
  if (!Is.object(input) || ServerIs.Native.proxy(input)) return false;
  try {
    if (getPrototypeOf(input) !== objectPrototype || !isFrozen(input)) return false;
    const actual = ownKeys(input);
    if (actual.length !== expected.length) return false;
    for (let index = 0; index < expected.length; index += 1) {
      const key = expected[index];
      let found = false;
      for (let candidate = 0; candidate < actual.length; candidate += 1) {
        if (actual[candidate] === key) {
          found = true;
          break;
        }
      }
      if (!found || !ownData(input, key).ok) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function isSafeInt(input: unknown, minimum: number): input is number {
  return Num.Is.safeInt(input) && input >= minimum;
}
