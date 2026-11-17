import React from 'react';
import { Harness, type t as Dev } from '@sys/ui-dev/react/devharness';
import type { TestSuiteModel } from '@sys/testing/t';
import { DomMock, expect } from '../-test.ts';
import { Is, Json, LocalStorage, Rx, type t } from '../common.ts';

/** Install storage before factory access; DomMock alone leaves ambient localStorage intact. */
export function storageFixture() {
  DomMock.polyfill();
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const storage = document.defaultView!.localStorage;
  storage.clear();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  return {
    seed(key: string, value: t.JsonMapLikeU) {
      // Use the public ref API: the package deliberately retains refs between factories.
      LocalStorage.immutable<t.JsonMapLikeU>(key, {}).reset(value);
    },
    read(key: string) {
      const bytes = storage.getItem(key);
      if (Is.nil(bytes)) throw new Error(`Missing preferences: ${key}`);
      return Json.parse<t.JsonMapLikeU>(bytes);
    },
    [Symbol.dispose]() {
      if (!Is.nil(previous)) Object.defineProperty(globalThis, 'localStorage', previous);
      else Reflect.deleteProperty(globalThis, 'localStorage');
    },
  };
}

/** Count projection attempts, including writes hidden by immutable deduplication. */
export function projectionFixture(key: string) {
  const store = LocalStorage.immutable<t.JsonMapLikeU>(key, {});
  const change = store.change;
  let count = 0;
  store.change = (...args) => {
    count++;
    return change(...args);
  };
  return {
    get count() {
      return count;
    },
    [Symbol.dispose]() {
      store.change = change;
    },
  };
}

/** Public bus/controller/context only; no copied retirement wiring or owner-internal imports. */
export async function hostFixture(suite?: TestSuiteModel) {
  using setup = new DisposableStack();
  const transport = Rx.subject<Dev.Event>();
  setup.defer(() => transport.complete());
  const instance: Dev.DevInstance = {
    id: crypto.randomUUID(),
    bus: { $: transport, fire: (event) => transport.next(event) },
  };
  const controller = setup.use(Harness.Bus.Controller({ instance }));
  let redraws = 0;
  const observation = transport.subscribe((e) => {
    if (e.type === 'sys.dev/redraw') redraws++;
  });
  setup.defer(() => observation.unsubscribe());
  if (!Is.nil(suite)) {
    const result = await controller.load.fire(suite);
    expect(result.error).to.eql(undefined);
  }
  const ctx = await controller.ctx.get();
  const resources = setup.move();
  return {
    controller,
    ctx,
    get redraws() {
      return redraws;
    },
    async run() {
      const result = await controller.run.fire();
      expect(result.error).to.eql(undefined);
      expect(result.info?.run.results?.ok).to.eql(true);
    },
    async init() {
      const test = suite?.state.tests.find((test) => test.description === 'init');
      if (Is.nil(test)) throw new Error('Missing specimen init');
      const result = await test.run({ ctx });
      expect(result.error).to.eql(undefined);
    },
    async debug<T>() {
      const props = ctx.toObject().props;
      const row = props.debug.body.renderers.at(-1);
      if (Is.nil(row)) throw new Error('Missing specimen debug row');
      const element = await row.fn({ id: row.id, state: {}, size: props.size });
      if (!React.isValidElement<{ debug: T }>(element)) throw new Error('Invalid debug element');
      return element.props.debug;
    },
    async subject() {
      const props = ctx.toObject().props;
      const renderer = props.subject.renderer;
      if (Is.nil(renderer)) throw new Error('Missing specimen subject');
      const element = await renderer.fn({ id: renderer.id, state: {}, size: props.size });
      if (!React.isValidElement(element)) throw new Error('Invalid specimen subject');
      return element;
    },
    [Symbol.dispose]() {
      resources.dispose();
    },
  };
}
