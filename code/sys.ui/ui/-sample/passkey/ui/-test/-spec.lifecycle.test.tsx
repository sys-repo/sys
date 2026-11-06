import React from 'react';
import {
  afterAll,
  beforeAll,
  Color,
  describe,
  type DevEvents,
  type DevRendererRef,
  DomMock,
  type Event,
  expect,
  it,
  LocalStorage,
  Rx,
  TestReact,
  type TestSuiteModel,
} from './common.ts';
import { Harness } from '../../-test.ui.ts';
import type { DebugSignals } from '../-spec.integration/-SPEC.Debug.tsx';
import type { DebugValues } from '../-spec.integration/-t.ts';
import { STORAGE_KEY as INTEGRATION_STORAGE } from '../-spec.integration/common.ts';
import type { DebugSignals as ViewSignals } from '../-spec/-SPEC.Debug.tsx';
import { STORAGE_KEY as VIEW_STORAGE } from '../-spec/common.ts';
import { Fixtures } from '../-spec/-u.fixtures.ts';

const specimens = [
  {
    name: 'integration',
    load: () => import('../-spec.integration/-SPEC.tsx'),
    key: INTEGRATION_STORAGE.DEV,
    text: 'Hello world',
  },
  {
    name: 'pure view',
    load: () => import('../-spec/-SPEC.tsx'),
    key: VIEW_STORAGE.DEV,
    text: 'Passkey',
  },
] as const;
const initial = { theme: 'Dark' as const, debug: false };

describe('passkey cached-spec context lifetime', () => {
  DomMock.init({ beforeAll, afterAll });

  for (const specimen of specimens) {
    it(`${specimen.name} → re-entry restores preferences and restarts persistence`, async () => {
      const suite = (await specimen.load()).default;
      const store = LocalStorage.immutable<DebugValues>(specimen.key, initial);
      const previous = store.current;
      const first = controller();
      const second = controller();
      store.reset(initial);
      try {
        await load(first.events, suite);
        const a = await debugOf<DebugSignals>(first.events);
        a.props.theme.value = 'Light';
        a.props.debug.value = true;
        expect(store.current).to.eql({ theme: 'Light', debug: true });

        first.dispose();
        a.props.theme.value = 'Dark';
        a.props.debug.value = false;
        expect(store.current).to.eql({ theme: 'Light', debug: true });

        await load(second.events, suite);
        const b = await debugOf<DebugSignals>(second.events);
        expect(b).not.to.equal(a);
        expect(b.props.theme.value).to.eql('Light');
        expect(b.props.debug.value).to.eql(true);
        b.props.theme.value = 'Dark';
        b.props.debug.value = false;
        expect(store.current).to.eql(initial);

        // Reload/reset the same live context without recreating its effects.
        const ctx = await second.events.ctx.get();
        const background = ctx.toObject().props.host.backgroundColor;
        await load(second.events, suite);
        expect(await second.events.ctx.get()).to.equal(ctx);
        expect(await debugOf(second.events)).to.equal(b);
        expect(ctx.toObject().props.host.backgroundColor).to.eql(background);
        let redraws = 0;
        const subscription = second.events.$.subscribe((event) => {
          if (event.type === 'sys.dev/redraw') redraws++;
        });
        try {
          b.props.debug.value = true;
          expect(redraws).to.eql(1);
          expect(store.current).to.eql({ theme: 'Dark', debug: true });
        } finally {
          subscription.unsubscribe();
        }

        second.dispose();
        b.props.theme.value = 'Light';
        b.props.debug.value = false;
        expect(store.current).to.eql({ theme: 'Dark', debug: true });
      } finally {
        first.dispose();
        second.dispose();
        store.reset(previous);
      }
    });

    it(`${specimen.name} → concurrent contexts retain their own render bindings and cleanup`, async () => {
      const suite = (await specimen.load()).default;
      const store = LocalStorage.immutable<DebugValues>(specimen.key, initial);
      const previous = store.current;
      const first = controller();
      const second = controller();
      store.reset(initial);
      try {
        await load(first.events, suite);
        const a = await debugOf<DebugSignals>(first.events);
        a.props.theme.value = 'Light';
        await load(second.events, suite);
        const b = await debugOf<DebugSignals>(second.events);
        expect(b).not.to.equal(a);
        b.props.theme.value = 'Dark';
        expect(a.props.theme.value).to.eql('Light');

        const firstProps = (await first.events.info.get()).render.props!;
        const subject = await render(first.events, firstProps.subject.renderer);
        const footer = await render(first.events, firstProps.host.footer.renderer);
        if (!React.isValidElement<{ theme: string }>(footer)) {
          throw new Error('Expected a host reference element');
        }
        expect(footer.props.theme).to.eql('Light');
        const res = await TestReact.render(<>{subject}{footer}</>);
        try {
          expect(res.container.textContent).to.contain(specimen.text);
          expect(res.container.querySelector('a')?.getAttribute('target')).to.eql('_blank');
          const subjectRoot = res.container.firstElementChild!;
          const style = subjectRoot.ownerDocument.defaultView!.getComputedStyle(subjectRoot);
          expect(Color.toHex(style.color)).to.eql(Color.toHex(Color.theme('Light').fg));
        } finally {
          React.act(() => res.dispose());
        }

        first.dispose();
        a.props.debug.value = true;
        expect(store.current.debug).to.eql(false);
        b.props.debug.value = true;
        expect(store.current.debug).to.eql(true);
        second.dispose();
        b.props.debug.value = false;
        expect(store.current.debug).to.eql(true);
      } finally {
        first.dispose();
        second.dispose();
        store.reset(previous);
      }
    });
  }

  it('pure view → re-entry clears fixture/intent state without changing the previous context', async () => {
    const suite = (await import('../-spec/-SPEC.tsx')).default;
    const first = controller();
    const second = controller();
    try {
      await load(first.events, suite);
      const a = await debugOf<ViewSignals>(first.events);
      a.select(Fixtures[1]);
      a.actions.onSignIn();
      a.props.callbacksEnabled.value = false;
      const intent = a.props.intent.value;
      first.dispose();

      await load(second.events, suite);
      const b = await debugOf<ViewSignals>(second.events);
      expect(b.props.fixture.value).to.equal(Fixtures[0]);
      expect(b.props.intent.value).to.eql(undefined);
      expect(b.props.callbacksEnabled.value).to.eql(true);
      expect(a.props.fixture.value).to.equal(Fixtures[1]);
      expect(a.props.intent.value).to.equal(intent);
      expect(a.props.callbacksEnabled.value).to.eql(false);
    } finally {
      first.dispose();
      second.dispose();
    }
  });
});

/** Minimal transport for the public harness controller; no substituted context or loader. */
function controller() {
  const $ = Rx.subject<Event>();
  const bus = { $, fire: (event: Event) => $.next(event) };
  const events = Harness.Bus.Controller({ instance: { bus, id: 'passkey.lifecycle' } });
  return {
    events,
    dispose() {
      events.dispose();
      $.complete();
    },
  };
}

async function load(events: DevEvents, suite: TestSuiteModel) {
  const loaded = await events.load.fire(suite);
  expect(loaded.error).to.eql(undefined);
  expect(loaded.info?.spec).to.equal(suite);
  const result = await events.run.fire();
  expect(result.error).to.eql(undefined);
  expect(result.info?.run.results?.ok).to.eql(true);
}

async function render(events: DevEvents, renderer?: DevRendererRef) {
  if (!renderer) throw new Error('Expected a registered specimen renderer');
  const props = (await events.info.get()).render.props!;
  return renderer.fn({ id: renderer.id, state: {}, size: props.size });
}

async function debugOf<T>(events: DevEvents): Promise<T> {
  const props = (await events.info.get()).render.props!;
  expect(props.debug.body.renderers.length).to.eql(1);
  const element = await render(events, props.debug.body.renderers[0]);
  if (!React.isValidElement<{ debug: T }>(element)) {
    throw new Error('Expected the specimen debug component');
  }
  return element.props.debug;
}
