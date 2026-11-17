import React from 'react';
import { DomMock, TestReact } from '@sys/ui-react/testing/server';
import { Harness, Spec, type t as Dev } from '@sys/ui-dev/react/devharness';
import { RxBus } from '../../../sys.ui/ui-dev/src/ui.react.devharness/u/m.RxBus/mod.ts';
import type { TestSuiteModel } from '@sys/testing/t';
import { expect, Json, Rx, type t, Time } from '../-test.ts';
import { HarnessHost } from '../../../sys.ui/ui-dev/src/ui.react.devharness/ui/Harness.Host/mod.ts';
import { LocalStorage, Signal } from '../../-templates/common.ts';
import { D as Plain } from '../../-templates/tmpl.m.mod.ui/common.ts';
import { D as Controlled } from '../../-templates/tmpl.m.mod.ui.controller/common.ts';
import {
  createDebugSignals as createPlain,
  type DebugSignals as PlainDebug,
} from '../../-templates/tmpl.m.mod.ui/-spec/-SPEC.Debug.tsx';
import {
  createDebugSignals as createControlled,
  type DebugSignals as ControlledDebug,
} from '../../-templates/tmpl.m.mod.ui.controller/-spec/-SPEC.Debug.tsx';

export { HarnessHost, LocalStorage, Signal, Spec, TestReact };
export type { Dev };
export type Debug = PlainDebug | ControlledDebug;
export type Variant = 'plain' | 'controller';
export type Snapshot = { debug?: boolean; theme?: t.CommonTheme; controlled?: boolean };

export const variants = ['plain', 'controller'] as const;
export const keyFor = (variant: Variant) =>
  `dev:${variant === 'plain' ? Plain.displayName : Controlled.displayName}`;
export const settle = () => Time.wait(35);
export const createDebug = (variant: Variant) =>
  variant === 'plain' ? createPlain() : createControlled();

/** Count attempts before immutable deduplication can conceal duplicate persistence effects. */
export function projectionFixture(variant: Variant) {
  const store = LocalStorage.immutable<Snapshot>(keyFor(variant), {});
  const original = store.change;
  let count = 0;
  let failed = false;
  let failure: unknown;
  store.change = (...args) => {
    count++;
    if (failed) throw failure;
    return original(...args);
  };
  return {
    get count() {
      return count;
    },
    fail(...errors: [] | [unknown]) {
      failed = errors.length > 0;
      failure = errors[0];
    },
    [Symbol.dispose]() {
      store.change = original;
    },
  };
}

/** Use an isolated browser storage, never Deno's ambient HOME-backed localStorage. */
export function storageFixture() {
  DomMock.polyfill();
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const storage = document.defaultView!.localStorage;
  storage.clear();
  const writes: { key: string; value: string }[] = [];
  let failure: Error | undefined;
  const monitored: Storage = {
    get length() {
      return storage.length;
    },
    key: (index) => storage.key(index),
    getItem: (key) => storage.getItem(key),
    removeItem: (key) => storage.removeItem(key),
    clear: () => storage.clear(),
    setItem(key, value) {
      if (failure) throw failure;
      writes.push({ key, value });
      storage.setItem(key, value);
    },
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: monitored });
  return {
    writes,
    seed(variant: Variant, snapshot: Snapshot) {
      const key = keyFor(variant);
      storage.setItem(key, Json.stringify(snapshot));
      // Existing refs are intentionally reused; fresh-registry hydration is tested separately.
      LocalStorage.immutable<Snapshot>(key, snapshot).change((draft) => {
        Object.assign(draft, snapshot);
      });
    },
    read: (variant: Variant) => storage.getItem(keyFor(variant)),
    fail(error?: Error) {
      failure = error;
    },
    [Symbol.dispose]() {
      if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
      else Reflect.deleteProperty(globalThis, 'localStorage');
    },
  };
}

/** Fresh suite, real bus/controller/context; no implicit run or retirement wiring. */
export async function specimenFixture(variant: Variant) {
  const path = variant === 'plain' ? 'tmpl.m.mod.ui' : 'tmpl.m.mod.ui.controller';
  const url = new URL(`../../-templates/${path}/-spec/-SPEC.tsx`, import.meta.url);
  url.searchParams.set('fixture', crypto.randomUUID());
  const module = await import(url.href);
  const suite: TestSuiteModel = module.default;
  await suite.init();
  return hostFixture(suite);
}

export async function hostFixture(suite: TestSuiteModel) {
  using resources = new DisposableStack();
  const transport = RxBus<Dev.DevEvent>();
  let subscriptions = 0;
  const bus: Dev.DevInstance['bus'] = {
    $: new Rx.Observable<Dev.DevEvent>((subscriber) => {
      subscriptions++;
      const sub = transport.$.subscribe(subscriber);
      return () => {
        subscriptions--;
        sub.unsubscribe();
      };
    }),
    fire: transport.fire,
  };
  const instance = { bus, id: crypto.randomUUID() };
  const controller = resources.use(Harness.Bus.Controller({ instance }));
  const loaded = await controller.load.fire(suite);
  expect(loaded.error).to.eql(undefined);
  const ctx = await controller.ctx.get();
  const redraws: Dev.DevEvent[] = [];
  const observation = resources.use(Rx.lifecycle());
  // Outlive controller disposal so leaked requests cannot hide behind its completed event view.
  bus.$.pipe(Rx.takeUntil(observation.dispose$)).subscribe((e) => {
    if (e.type === 'sys.dev/redraw') redraws.push(e);
  });
  const owned = resources.move();
  return {
    suite,
    instance,
    controller,
    ctx,
    redraws,
    get subscriptions() {
      return subscriptions;
    },
    init() {
      const test = suite.state.tests.find((test) => test.description === 'init');
      if (!test) throw new Error('Missing specimen init');
      return test.run({ ctx });
    },
    async run() {
      const result = await controller.run.fire();
      expect(result.error).to.eql(undefined);
      expect(result.info?.run.results?.ok).to.eql(true);
      return result;
    },
    async debug(): Promise<Debug> {
      const info = await controller.info.get();
      const row = info.render.props?.debug.body.renderers.at(-1);
      if (!row) throw new Error('Missing specimen Debug renderer');
      const el = await row.fn({ id: row.id, state: {}, size: info.render.props!.size });
      if (!React.isValidElement<{ debug: Debug }>(el)) throw new Error('Missing Debug element');
      return el.props.debug;
    },
    [Symbol.dispose]() {
      owned.dispose();
    },
  } as const;
}

/** One narrowly owned async-error channel for the intentional failed-storage-write test. */
export function errorFixture(failure: Error) {
  const errors: unknown[] = [];
  const onError = (event: ErrorEvent) => {
    if (event.error !== failure) return;
    event.preventDefault();
    errors.push(event.error);
  };
  addEventListener('error', onError);
  return {
    errors,
    [Symbol.dispose]() {
      removeEventListener('error', onError);
    },
  };
}

export async function freshStorage(
  data: { variant: Variant; bytes?: string; failCreation?: boolean },
) {
  const worker = new Worker(new URL('./u.worker.ui-storage.ts', import.meta.url), {
    type: 'module',
  });
  try {
    const result = Promise.withResolvers<unknown>();
    worker.onmessage = (event) => result.resolve(event.data);
    worker.onerror = (event) => {
      event.preventDefault();
      result.reject(new Error(event.message));
    };
    worker.postMessage(data);
    return await result.promise;
  } finally {
    worker.terminate();
  }
}

export async function closeDom() {
  await settle();
  await DomMock.unpolyfill();
}
