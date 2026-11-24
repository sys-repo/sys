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
  Is,
  it,
  LocalStorage,
  Rx,
  Schedule,
  type t,
  TestReact,
  type TestSuiteModel,
  Time,
} from './common.ts';
import { Harness } from '../../../-test.ui.ts';
import { browser, transport } from '../../m.AccountRuntime/-test/u.fixture.ts';
import {
  actionButton,
  activate,
  button,
  buttons,
  element,
  exerciseAccountFlow,
  expectActions,
  pageListeners,
  valueCell,
} from './u.fixture.tsx';
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
  },
  {
    name: 'pure view',
    load: () => import('../-spec/-SPEC.tsx'),
    key: VIEW_STORAGE.DEV,
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
          expect(valueCell(res.container, 'Authentication').textContent).to.eql('Signed out');
          const reference = element(res.container, 'a[href="https://www.w3.org/TR/webauthn-3/"]');
          expect(reference.textContent).to.eql('WebAuthn · W3C');
          expect(reference.getAttribute('target')).to.eql('_blank');
          const rel = reference.getAttribute('rel')?.split(' ').sort();
          expect(rel).to.eql(['noopener', 'noreferrer']);
          expect(reference.title).to.contain('opens in a new tab');
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

  for (const when of ['during', 'after'] as const) {
    it(`dispose ${when} the first redraw → no leaked or reacquired page listeners`, async () => {
      const suite = (await import('../-spec.integration/-SPEC.tsx')).default;
      const host = controller();
      using listeners = pageListeners();
      try {
        const ctx = await host.events.ctx.get();
        const sub = host.events.$.subscribe((event) => {
          if (event.type !== 'sys.dev/redraw') return;
          sub.unsubscribe();
          if (when === 'during') host.dispose();
          else queueMicrotask(() => host.dispose());
        });
        // Await the actual suite, not a run-response on a bus we are about to dispose.
        expect((await suite.run({ ctx })).ok).to.eql(true);
        expect(ctx.is.attachable).to.eql(false);
        expect(listeners.acquired).to.eql(['pagehide', 'pageshow']);
        expect(listeners.attached.size).to.eql(0);
      } finally {
        host.dispose();
      }
    });
  }

  it('integration subject → quiet signed-out mount and presentation-only reset', async () => {
    using server = transport();
    const suite = (await import('../-spec.integration/-SPEC.tsx')).default;
    const store = LocalStorage.immutable<DebugValues>(INTEGRATION_STORAGE.DEV, initial);
    const previous = store.current;
    const host = controller();
    store.reset(initial);
    try {
      await load(host.events, suite);
      const debug = await debugOf<DebugSignals>(host.events);
      for (const theme of ['Light', 'Dark'] as const) {
        debug.props.theme.value = theme;
        debug.props.debug.value = true;
        const props = (await host.events.info.get()).render.props!;
        const subject = await render(host.events, props.subject.renderer);
        if (!React.isValidElement<t.Passkey.Props>(subject)) {
          throw new Error('Expected the registered React subject');
        }
        expect(subject.props).to.include({ theme, debug: true, view: 'panel' });

        const res = await TestReact.render(subject);
        try {
          expect(valueCell(res.container, 'Authentication').textContent).to.eql('Signed out');
          expect(valueCell(res.container, 'Operation').textContent).to.eql('Idle');
          expect(valueCell(res.container, 'Last result').textContent).to.eql('-');
          expect(valueCell(res.container, 'Account service').textContent).to.eql('Configured');
          const rpName = valueCell(res.container, 'Relying Party Name');
          expect(rpName.textContent).to.eql('Passkey Sample');
          expectActions(res.container, 'create-account', 'sign-in');
          expect(server.fetchCount).to.eql(0);
        } finally {
          React.act(() => res.dispose());
        }
      }
      using picker = await TestReact.render(await debugElement<DebugSignals>(host.events));
      await activate(button(picker.container, 'Status'));
      expect(debug.props.view.value).to.eql('status');
      expect(button(picker.container, 'Status').getAttribute('aria-pressed')).to.eql('true');
      expect(store.current).to.eql({ ...initial, debug: true });
      await activate(button(picker.container, '(reset)'));
      expect(button(picker.container, 'Panel').getAttribute('aria-pressed')).to.eql('true');
      const props = (await host.events.info.get()).render.props!;
      const subject = await render(host.events, props.subject.renderer);
      if (!React.isValidElement<t.Passkey.Props>(subject)) {
        throw new Error('Expected the registered React subject');
      }
      expect(subject.props).to.include({ ...initial, view: 'panel' });
      expect(server.fetchCount).to.eql(0);
    } finally {
      host.dispose();
      store.reset(previous);
    }
  });

  it('connected picker → changing views and resetting preserve an in-flight Add', async () => {
    using native = browser();
    using server = transport(undefined, 'localhost');
    const held = Promise.withResolvers<void>();
    const create = native.native.create;
    native.native.create = async (options) => {
      await held.promise;
      return create(options);
    };
    const suite = (await import('../-spec.integration/-SPEC.tsx')).default;
    const store = LocalStorage.immutable<DebugValues>(INTEGRATION_STORAGE.DEV, initial);
    const previous = store.current;
    const res = await TestReact.render(<Harness.UI spec={suite} />);
    const { container } = res;
    const choose = (label: string) => activate(button(container, label));
    const value = (label: string) => valueCell(container, label).textContent;
    try {
      // Harness.UI loads and runs its spec on the next turn, after the first render.
      await Time.waitFor(async () => {
        await React.act(() => Time.wait(0));
        return !!container.querySelector('[data-passkey-section="actions"]');
      });
      await activate(actionButton(container, 'sign-in'));
      const add = actionButton(container, 'add-passkey');
      await activate(add);
      const pending = `${add.textContent}: Waiting for authenticator`;
      expect(value('Operation')).to.eql(pending);
      const signal = native.signals.at(-1)!;
      const panel = ['actions', 'status', 'context'];
      const transitions = [
        ['Actions', ['actions']],
        ['Status', ['status']],
        ['Context', ['context']],
        ['Panel', panel],
        ['Context', ['context']],
        ['(reset)', panel],
      ] as const;
      for (const [control, sections] of transitions) {
        await choose(control);
        const visible = container.querySelectorAll<HTMLElement>('[data-passkey-section]');
        expect(Array.from(visible, (el) => el.dataset.passkeySection)).to.eql(sections);
        const titleProgress = '[data-passkey-title-spinner][role="progressbar"]';
        expect(!!container.querySelector(titleProgress)).to.eql(control === 'Actions');
        if (control === 'Status' || control === 'Panel' || control === '(reset)') {
          expect(value('Operation')).to.eql(pending);
          expect(value('Principal')).to.eql(server.session.account.principal);
          expect(value('Registered credentials')).to.eql('1');
        }
        expect(signal.aborted).to.eql(false);
        expect(native.calls).to.eql(['get', 'create']);
        expect(server.fetchCount).to.eql(3);
      }
      await React.act(async () => {
        held.resolve();
        await Schedule.micro();
      });
      expect(value('Operation')).to.eql('Idle');
      expect(value('Last result')).to.include(`${add.textContent} — success`);
      expect(value('Registered credentials')).to.eql('2');
      expect(server.requests.map(({ name }) => name)).to.eql([
        'session.signIn.begin',
        'session.signIn.finish',
        'passkey.add.begin',
        'passkey.add.finish',
      ]);
    } finally {
      held.resolve();
      React.act(() => res.dispose());
      store.reset(previous);
    }
  });

  it('integration → all four intents, with session ownership per live context', async () => {
    using native = browser();
    using server = transport(undefined, 'localhost');
    const suite = (await import('../-spec.integration/-SPEC.tsx')).default;
    const first = controller();
    const second = controller();
    async function mount(events: DevEvents) {
      const { subject } = (await events.info.get()).render.props!;
      expect(subject.size).to.eql({ mode: 'center', width: 360, height: undefined });
      return TestReact.render(<>{await render(events, subject.renderer)}</>);
    }
    try {
      await load(first.events, suite);
      await load(second.events, suite);
      const a = await mount(first.events);
      const b = await mount(second.events);
      try {
        expect(server.fetchCount).to.eql(0);
        expect(native.calls).to.eql([]);
        await exerciseAccountFlow(a.container);
        expect(server.requests.map(({ name }) => name)).to.eql([
          'account.create.begin',
          'account.create.finish',
          'session.revoke',
          'session.signIn.begin',
          'session.signIn.finish',
          'passkey.add.begin',
          'passkey.add.finish',
        ]);
        expect([...new Set(server.requests.map(({ url }) => url))]).to.eql([
          'http://localhost:1234/api/passkey/cmd',
        ]);
        expect(valueCell(b.container, 'Authentication').textContent).to.eql('Signed out');
        const debug = await debugOf<DebugSignals>(first.events);
        debug.props.view.value = 'status';
        const status = await mount(first.events);
        try {
          expect(valueCell(status.container, 'Authentication').textContent).to.eql('Signed in');
          expect(valueCell(status.container, 'Registered credentials').textContent).to.eql('2');
          expect(buttons(status.container)).to.eql([]);
          expect(server.fetchCount).to.eql(7);
          expect((await debugOf<DebugSignals>(second.events)).props.view.value).to.eql('panel');
        } finally {
          React.act(() => status.dispose());
        }

        React.act(() => second.dispose());
        debug.reset();
        await load(first.events, suite);
        const again = await mount(first.events);
        try {
          expect(valueCell(again.container, 'Registered credentials').textContent).to.eql('2');
          expect(native.calls).to.eql(['create', 'get', 'create']);
          expect(server.fetchCount).to.eql(7);
        } finally {
          React.act(() => again.dispose());
        }
      } finally {
        React.act(() => {
          a.dispose();
          b.dispose();
        });
      }
    } finally {
      first.dispose();
      second.dispose();
    }
  });

  it('pure subject → renders the selected view with the supplied fixture', async () => {
    const suite = (await import('../-spec/-SPEC.tsx')).default;
    const host = controller();
    try {
      await load(host.events, suite);
      const debug = await debugOf<ViewSignals>(host.events);
      const fixture = Fixtures.find((fixture) => fixture.id === 'authenticator');
      if (Is.nil(fixture)) throw new Error('Missing pending fixture');
      debug.select(fixture);
      debug.props.view.value = 'status';
      debug.props.sections.value = { status: false };
      const props = (await host.events.info.get()).render.props!;
      const subject = await render(host.events, props.subject.renderer);
      if (!React.isValidElement(subject)) throw new Error('Expected the registered React subject');
      const res = await TestReact.render(subject);
      try {
        expect(buttons(res.container)).to.eql([]);
        expect(valueCell(res.container, 'Operation').textContent).to.contain('authenticator');
      } finally {
        React.act(() => res.dispose());
      }
    } finally {
      host.dispose();
    }
  });

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
      a.props.view.value = 'context';
      a.props.sections.value = { actions: false, status: false, context: false };
      const intent = a.props.intent.value;
      first.dispose();

      await load(second.events, suite);
      const b = await debugOf<ViewSignals>(second.events);
      expect(b.props.fixture.value).to.equal(Fixtures[0]);
      expect(b.props.intent.value).to.eql(undefined);
      expect(b.props.callbacksEnabled.value).to.eql(true);
      expect(b.props.view.value).to.eql('panel');
      expect(b.props.sections.value).to.eql({ actions: true, status: true, context: true });
      expect(a.props.view.value).to.eql('context');
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
  return (await debugElement<T>(events)).props.debug;
}

async function debugElement<T>(events: DevEvents) {
  const props = (await events.info.get()).render.props!;
  expect(props.debug.body.renderers.length).to.eql(1);
  const element = await render(events, props.debug.body.renderers[0]);
  if (!React.isValidElement<{ debug: T }>(element)) {
    throw new Error('Expected the specimen debug component');
  }
  return element;
}
