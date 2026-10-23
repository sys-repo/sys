import { Is, Path, type t } from './common.ts';
import { dataValue, isDirectCallable, isFrozenArray, isFrozenData } from './u.is.ts';
import {
  type LeaseAuthority,
  releaseLease,
  releaseReturned,
  retainFailedOpen,
  retainReturned,
} from './u.retention.ts';

type Deferred<T> = {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
  readonly reject: (cause?: unknown) => void;
};

const freeze = Object.freeze;
const ROOTED_KEYS = freeze(['path', 'Target', 'Lease', 'Tree', 'File', 'Stage'] as const);
const NativePromise = Promise;

/** Safely captured Rooted methods used by generation opening. */
export type RootedAuthority = {
  readonly path: t.StringAbsoluteDir;
  readonly targetReceiver: object;
  readonly admit: t.FsRooted.Instance['Target']['admit'];
  readonly leaseReceiver: object;
  readonly acquire: t.FsRooted.Instance['Lease']['acquire'];
};

/** Validated lower acquisition truth. */
export type Acquisition =
  | { readonly kind: 'acquired'; readonly lease: LeaseAuthority }
  | { readonly kind: 'busy' }
  | { readonly kind: 'invalid'; readonly evidence: unknown; readonly lease?: LeaseAuthority };

/** Capture the narrow methods of one exact frozen Rooted instance. */
export function admitRooted(
  input: unknown,
  expectedRoot: t.StringAbsoluteDir,
): RootedAuthority | undefined {
  if (!isFrozenData(input, ROOTED_KEYS)) return;
  const path = dataValue(input, 'path');
  const targetReceiver = dataValue(input, 'Target');
  const leaseReceiver = dataValue(input, 'Lease');
  if (
    !Is.str(path) || path !== expectedRoot || path.includes('\0') || !Path.Is.absolute(path) ||
    !isFrozenData(targetReceiver, ['admit']) ||
    !isFrozenData(leaseReceiver, ['acquire'])
  ) {
    return;
  }
  const admit = dataValue(targetReceiver, 'admit');
  const acquire = dataValue(leaseReceiver, 'acquire');
  if (!isDirectCallable(admit) || !isDirectCallable(acquire)) return;
  return freeze({
    path,
    targetReceiver,
    admit: admit as RootedAuthority['admit'],
    leaseReceiver,
    acquire: acquire as RootedAuthority['acquire'],
  });
}

/** Admit one Rooted target while proving it denotes the caller-selected store target. */
export function admitTarget(
  input: unknown,
  selected: t.StringPath,
): t.FsRooted.Target<'directory'> | undefined {
  if (!isFrozenData(input, ['targets'])) return;
  const targets = dataValue(input, 'targets');
  if (!isFrozenArray(targets, 1) || targets.length !== 1) return;
  const target = dataValue(targets, '0');
  if (!isFrozenData(target, ['kind', 'path'])) return;
  const kind = dataValue(target, 'kind');
  const path = dataValue(target, 'path');
  if (kind !== 'directory' || !Is.str(path) || path.length === 0 || path.includes('\0')) return;

  let normalized: t.StringRelativePath;
  try {
    normalized = Path.Bounded.visible(Path.Bounded.posix(), selected);
  } catch {
    return;
  }
  if (!normalized || path !== normalized) return;
  return target as t.FsRooted.Target<'directory'>;
}

/** Admit exact busy/acquired lease evidence and capture releasable authority. */
export function admitAcquisition(
  input: unknown,
  target: t.FsRooted.Target<'directory'>,
): Acquisition {
  const lease = Is.object(input) && !Is.Native.proxy(input)
    ? captureLease(dataValue(input, 'lease'), target)
    : undefined;
  if (!isFrozenData(input, ['kind'], false)) {
    return freeze({ kind: 'invalid', evidence: input, ...(lease ? { lease } : {}) });
  }
  const kind = dataValue(input, 'kind');
  if (kind === 'busy') {
    return isFrozenData(input, ['kind', 'target']) && dataValue(input, 'target') === target
      ? freeze({ kind: 'busy' })
      : freeze({ kind: 'invalid', evidence: input, ...(lease ? { lease } : {}) });
  }

  if (kind !== 'acquired' || !isFrozenData(input, ['kind', 'lease']) || !lease) {
    return freeze({ kind: 'invalid', evidence: input, ...(lease ? { lease } : {}) });
  }
  return freeze({ kind: 'acquired', lease });
}

/** Create a frozen owner whose one terminal release is independent of opening cancellation. */
export function createOwner(
  store: t.Dist.Generation.Store.Admitted,
  lease: LeaseAuthority,
): t.Dist.Generation.Owner {
  let terminal: Promise<void> | undefined;

  const release = (): Promise<void> => {
    if (terminal) return terminal;

    const deferred = createDeferred<void>();
    terminal = deferred.promise;
    retainReturned(owner);

    const settle = async () => {
      try {
        if (!await releaseLease(lease)) {
          deferred.reject(releaseFailure());
          return;
        }
        releaseReturned(owner);
        deferred.resolve();
      } catch {
        deferred.reject(releaseFailure());
      }
    };
    void settle();
    return terminal;
  };

  const owner: t.Dist.Generation.Owner = freeze({
    store,
    release,
    [Symbol.asyncDispose]: release,
  });
  return owner;
}

/** Settle failed-open release and retain unresolved lower authority. */
export async function releaseFailedOpen(
  lease: LeaseAuthority,
): Promise<'released' | 'pending'> {
  if (await releaseLease(lease)) return 'released';
  retainFailedOpen(lease);
  return 'pending';
}

function captureLease(
  input: unknown,
  target: t.FsRooted.Target<'directory'>,
): LeaseAuthority | undefined {
  if (!isFrozenData(input, ['mode', 'targets', 'release', Symbol.asyncDispose])) return;
  const mode = dataValue(input, 'mode');
  const targets = dataValue(input, 'targets');
  const release = dataValue(input, 'release');
  const asyncDispose = dataValue(input, Symbol.asyncDispose);
  if (
    mode !== 'shared' || !isFrozenArray(targets, 1) || targets.length !== 1 ||
    dataValue(targets, '0') !== target || !isDirectCallable(release) || asyncDispose !== release
  ) {
    return;
  }
  return freeze({
    receiver: input,
    release: release as () => unknown,
    unobservable: new Set<unknown>(),
  });
}

/** Create an exact native deferred without consulting later ambient Promise statics. */
function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (cause?: unknown) => void;
  const promise = new NativePromise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return freeze({ promise, resolve, reject });
}

function releaseFailure(): Error {
  return new Error('Dist generation ownership release failed');
}
