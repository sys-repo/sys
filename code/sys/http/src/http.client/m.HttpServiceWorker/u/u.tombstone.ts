import { Is, type t } from '../../common.ts';
import { PkgCache } from '../../m.HttpCache/u.pkg.names.ts';
import { admit } from './u.admit.ts';

type LifecycleEvent = { waitUntil(value: Promise<unknown>): void };
type LifecycleListener = (event: LifecycleEvent) => void;
type WorkerSubstrate = {
  readonly add: (type: 'install' | 'activate', listener: LifecycleListener) => void;
  readonly remove: (type: 'install' | 'activate', listener: LifecycleListener) => void;
  readonly skipWaiting: () => Promise<void>;
  readonly unregister: () => Promise<boolean>;
  readonly cacheKeys: () => Promise<string[]>;
  readonly deleteCache: (name: string) => Promise<boolean>;
};

const INVALID_ADMISSION: t.HttpServiceWorker.Admission.Failed = Object.freeze({
  kind: 'failed',
  reason: 'invalid-url',
});

/** Bind migration behavior to the actual service-worker global and its own location. */
export const tombstone: t.HttpServiceWorker.Tombstone.Method = (args) => {
  return tombstoneAt(globalThis as unknown as ServiceWorkerGlobalScope, args);
};

/** Internal capability seam: classification and effects are bound to the same worker substrate. */
export function tombstoneAt(
  target: ServiceWorkerGlobalScope,
  args: t.HttpServiceWorker.Tombstone.Args,
): t.HttpServiceWorker.Tombstone.Result {
  const admission = admitWorkerLocation(target);
  if (admission.kind !== 'denied') return admission;

  let names: t.HttpCache.Pkg.Names | undefined;
  let substrate: WorkerSubstrate | undefined;
  try {
    names = PkgCache.names(args.pkg);
    substrate = resolveSubstrate(target);
  } catch {
    substrate = undefined;
  }
  if (!(names && substrate)) {
    return Object.freeze({ kind: 'failed', reason: 'setup-failure', admission });
  }
  const ownedNames = names;
  const worker = substrate;

  const install = async () => {
    await worker.skipWaiting();
  };
  const unregisterCurrent = async () => {
    await worker.unregister();
  };
  const clean = async () => {
    let failure: { readonly reason: unknown } | undefined;
    for (const name of await worker.cacheKeys()) {
      if (!ownedNames.isOwned(name)) continue;
      try {
        await worker.deleteCache(name);
      } catch (reason) {
        failure ??= { reason };
      }
    }
    if (failure) throw failure.reason;
  };
  const activate = async () => {
    const outcomes = await Promise.allSettled([unregisterCurrent(), clean()]);
    const failure = outcomes.find((outcome) => outcome.status === 'rejected');
    if (failure?.status === 'rejected') throw failure.reason;
  };

  const onInstall: LifecycleListener = (event) => event.waitUntil(install());
  const onActivate: LifecycleListener = (event) => event.waitUntil(activate());

  try {
    worker.add('activate', onActivate);
    worker.add('install', onInstall);
  } catch {
    removeListener(worker, 'install', onInstall);
    removeListener(worker, 'activate', onActivate);
    return Object.freeze({ kind: 'failed', reason: 'setup-failure', admission });
  }

  return Object.freeze({ kind: 'installed', admission });
}

function admitWorkerLocation(
  target: ServiceWorkerGlobalScope,
): t.HttpServiceWorker.Admission.Result {
  try {
    return admit(target.location);
  } catch {
    return INVALID_ADMISSION;
  }
}

function resolveSubstrate(target: ServiceWorkerGlobalScope): WorkerSubstrate | undefined {
  const storage = target.caches;
  const registration = target.registration;
  if (!(Is.object(storage) && Is.object(registration))) return undefined;

  const add = target.addEventListener;
  const remove = target.removeEventListener;
  const skipWaiting = target.skipWaiting;
  const unregister = registration.unregister;
  const cacheKeys = storage.keys;
  const deleteCache = storage.delete;
  if (
    !(
      Is.func(add) &&
      Is.func(remove) &&
      Is.func(skipWaiting) &&
      Is.func(unregister) &&
      Is.func(cacheKeys) &&
      Is.func(deleteCache)
    )
  ) {
    return undefined;
  }

  return {
    add: add.bind(target) as WorkerSubstrate['add'],
    remove: remove.bind(target) as WorkerSubstrate['remove'],
    skipWaiting: skipWaiting.bind(target),
    unregister: unregister.bind(registration),
    cacheKeys: cacheKeys.bind(storage),
    deleteCache: deleteCache.bind(storage),
  };
}

function removeListener(
  substrate: WorkerSubstrate,
  type: 'install' | 'activate',
  listener: LifecycleListener,
) {
  try {
    substrate.remove(type, listener);
  } catch {
    // Best effort only: the failed result never attests absence of partial listener effects.
  }
}
