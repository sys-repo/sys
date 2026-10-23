import { WebFixture } from '../../../-test.ts';

type LifecycleType = 'install' | 'activate';

type LifecycleEvent = {
  waitUntil(value: Promise<unknown>): void;
};

type TombstoneFixtureOptions = {
  names?: readonly string[];
  unregister?: () => Promise<boolean>;
  keys?: () => Promise<string[]>;
  remove?: (name: string) => Promise<boolean>;
  failAdd?: LifecycleType;
};

/** Build one denied worker substrate with observable lifecycle effects. */
export function tombstoneFixture(options: TombstoneFixtureOptions = {}) {
  const listeners = new Map<string, (event: LifecycleEvent) => void>();
  const calls: string[] = [];
  const deleted: string[] = [];
  let clientReads = 0;

  const target = {
    location: { href: 'http://127.0.0.1:8080/sw.js' },
    caches: {
      async keys() {
        calls.push('keys');
        if (options.keys) return await options.keys();
        return [...(options.names ?? [])];
      },
      async delete(name: string) {
        calls.push(`delete:${name}`);
        deleted.push(name);
        if (options.remove) return await options.remove(name);
        return true;
      },
    },
    registration: {
      async unregister() {
        calls.push('unregister');
        if (options.unregister) return await options.unregister();
        return true;
      },
    },
    skipWaiting() {
      calls.push('skipWaiting');
      return Promise.resolve();
    },
    addEventListener(type: string, listener: (event: LifecycleEvent) => void) {
      calls.push(`add:${type}`);
      if (options.failAdd === type) throw new Error(`add:${type}`);
      listeners.set(type, listener);
    },
    removeEventListener(type: string, listener: (event: LifecycleEvent) => void) {
      calls.push(`remove:${type}`);
      if (listeners.get(type) === listener) listeners.delete(type);
    },
  };
  Object.defineProperty(target, 'clients', {
    get() {
      clientReads += 1;
      throw new Error('clients-must-not-be-read');
    },
  });

  return {
    calls,
    deleted,
    listeners,
    get clientReads() {
      return clientReads;
    },
    target: target as unknown as ServiceWorkerGlobalScope,
    async dispatch(type: LifecycleType) {
      const listener = listeners.get(type);
      if (!listener) throw new Error(`Missing ${type} listener`);

      let pending: Promise<unknown> | undefined;
      listener({
        waitUntil(value) {
          calls.push(`waitUntil:${type}`);
          pending = value;
        },
      });
      if (!pending) throw new Error(`${type} listener did not retain work`);
      await pending;
    },
  };
}

/**
 * Run the public helper against one isolated actual worker-global substrate.
 * Do not overlap this process-global fixture across parallel tests.
 */
export function withWorkerTarget<T>(target: ServiceWorkerGlobalScope, run: () => T): T {
  const keys = [
    'location',
    'caches',
    'registration',
    'skipWaiting',
    'addEventListener',
    'removeEventListener',
  ] as const;
  const entries = keys.map((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    if (!descriptor) throw new Error(`Missing worker property: ${key}`);
    return {
      target: globalThis,
      key,
      descriptor: { ...descriptor, configurable: true },
    };
  });
  const properties = WebFixture.Property.mock(entries);

  try {
    return run();
  } finally {
    properties.dispose();
  }
}

/** Capture a rejected identity without weakening it to message equality. */
export async function captureFailure(run: () => Promise<unknown>): Promise<unknown> {
  try {
    await run();
  } catch (error) {
    return error;
  }
}
