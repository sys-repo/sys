import React from 'react';
import { Harness } from '../../../-test.ui.ts';
import { accepted, browser, transport } from '../../m.Account.Runtime/-test/u.fixture.ts';
import integration from '../-spec.integration/-SPEC.tsx';
import pure from '../-spec/-SPEC.tsx';
import { STORAGE_KEY as integrationKey } from '../-spec.integration/common.ts';
import { STORAGE_KEY as pureKey } from '../-spec/common.ts';
import type { DebugSignals, DebugValues } from '../-spec.integration/-t.ts';
import type { DebugSignals as ViewSignals } from '../-spec/-SPEC.Debug.tsx';
import {
  afterAll,
  beforeAll,
  describe,
  type DevRendererRef,
  DomMock,
  type Event,
  expect,
  it,
  LocalStorage,
  Rx,
  type t,
  TestReact,
  type TestSuiteModel,
  Time,
} from './common.ts';
import {
  actionButton,
  activate,
  button,
  element,
  exerciseAccountFlow,
  pageListeners,
  valueCell,
} from './u.fixture.tsx';

const defaults = { theme: 'Dark' as const, debug: false };

describe('passkey specimen ownership', () => {
  DomMock.init({ beforeAll, afterAll });

  for (const [suite, key] of [[integration, integrationKey], [pure, pureKey]] as const) {
    it(`${key.DEV}: re-entry → preferences survive, disposed bindings cannot write`, async () => {
      using _server = transport();
      using cleanup = new DisposableStack();
      const store = LocalStorage.immutable<DebugValues>(key.DEV, defaults);
      const previous = store.current;
      cleanup.defer(() => store.reset(previous));
      store.reset(defaults);
      using first = host();
      await first.load(suite);
      const a = (await first.sidebar()).props.debug;
      a.props.theme.value = 'Light';
      a.props.view.value = 'status';
      if (suite === pure) (await first.sidebar<ViewSignals>()).props.debug.actions.onSignIn();
      first.dispose();
      a.props.theme.value = 'Dark';
      using second = host();
      await second.load(suite);
      const b = (await second.sidebar()).props.debug;
      expect([b.props.theme.value, b.props.view.value]).to.eql(['Light', 'panel']);
      if (suite === pure) {
        const view = (await second.sidebar<ViewSignals>()).props.debug;
        expect(view.props.intent.value).to.eql(undefined);
      }
      const ctx = await second.events.ctx.get();
      await second.load(suite);
      expect(await second.events.ctx.get()).to.equal(ctx);
      expect((await second.sidebar()).props.debug).to.equal(b);
      let redraws = 0;
      const sub = second.events.$.subscribe((event) => {
        if (event.type === 'sys.dev/redraw') redraws++;
      });
      try {
        b.props.debug.value = true;
        expect(redraws).to.eql(1);
        expect(store.current).to.eql({ theme: 'Light', debug: true });
      } finally {
        sub.unsubscribe();
      }
    });
  }

  it('dispose during first redraw → the cached suite cannot reacquire a page owner', async () => {
    using _server = transport();
    using owner = host();
    using listeners = pageListeners();
    const ctx = await owner.events.ctx.get();
    const sub = owner.events.$.subscribe((event) => {
      if (event.type !== 'sys.dev/redraw') return;
      sub.unsubscribe();
      owner.dispose();
    });
    expect((await integration.run({ ctx })).ok).to.eql(true);
    expect(listeners.acquired).to.have.members(['pagehide', 'pageshow']);
    expect(listeners.attached.size).to.eql(0);
  });

  it('page departure and restoration → the mounted sidebar follows live WebAuthn context', async () => {
    using _native = browser();
    using _server = transport();
    using owner = host();
    await owner.load(integration);
    using sidebar = await TestReact.render(await owner.sidebar());
    const webAuthn = () => valueCell(sidebar.container, 'WebAuthn').textContent;
    expect(webAuthn()).to.eql('Available');

    // Synthetic page events exercise the binding, not a browser BFCache hit.
    const page = globalThis.window;
    React.act(() => page.dispatchEvent(new page.Event('pagehide')));
    expect(webAuthn()).to.eql('Unknown: Not checked');
    const restore = Object.assign(new page.Event('pageshow'), { persisted: true });
    React.act(() => page.dispatchEvent(restore));
    expect(webAuthn()).to.eql('Available');
  });

  it('one host read → subject and sidebar both go from unknown to observed zero', async () => {
    using server = transport();
    const reply = Promise.withResolvers<void>();
    server.handlers['service.stats'] = async () => {
      await reply.promise;
      return accepted({ accounts: 0, registeredPasskeys: 0, validSessions: 0 });
    };
    using owner = host();
    try {
      await owner.load(integration);
      using subject = await TestReact.render(await owner.subject());
      using sidebar = await TestReact.render(await owner.sidebar());
      const counts = (root: HTMLElement) => valueCell(root, 'Total accounts').textContent;
      const accounts = () => [counts(subject.container), counts(sidebar.container)];
      expect(accounts()).to.eql(['-', '-']);
      React.act(() => reply.resolve());
      await Time.waitFor(async () => {
        await React.act(() => Time.wait(0));
        return accounts().every((count) => count === '0');
      });
      expect(server.requests.map(({ name, url, authorization }) => ({ name, url, authorization })))
        .to.eql([{
          name: 'service.stats',
          url: 'http://localhost:1234/api/passkey/cmd',
          authorization: null,
        }]);
      expect(valueCell(subject.container, 'Authentication').textContent).to.eql('Signed out');
      await activate(button(sidebar.container, 'Status'));
      using status = await TestReact.render(await owner.subject());
      expect(valueCell(status.container, 'Authentication').textContent).to.eql('Signed out');
      expect(status.container.querySelector('[data-passkey-service]')).to.eql(null);
      expect(counts(sidebar.container)).to.eql('0');
    } finally {
      reply.resolve();
    }
  });

  it('refused stats → service available on both views even with no counts or session', async () => {
    using server = transport();
    server.handlers['service.stats'] = () => ({ kind: 'rejected', code: 'invalid-request' });
    using owner = host();
    await owner.load(integration);
    using subject = await TestReact.render(await owner.subject());
    using sidebar = await TestReact.render(await owner.sidebar());
    for (const { container } of [subject, sidebar]) {
      const section = element(container, '[data-passkey-service]');
      await Time.waitFor(async () => {
        await React.act(() => Time.wait(0));
        return section.textContent?.includes('Counts unavailable');
      });
      const bullet = element(section, '[role="img"][aria-label^="Accounts API:"]');
      expect(bullet.title).to.eql('Accounts API: available');
    }
    expect(valueCell(subject.container, 'Authentication').textContent).to.eql('Signed out');
    expect(server.requests.map(({ name }) => name)).to.eql(['service.stats']);
  });

  it('mounted picker and Reset → the subject redraws without restarting held Add', async () => {
    using native = browser();
    using server = transport(undefined, 'localhost');
    const held = Promise.withResolvers<void>();
    const create = native.native.create;
    native.native.create = async (options) => {
      await held.promise;
      return create(options);
    };
    const store = LocalStorage.immutable<DebugValues>(integrationKey.DEV, defaults);
    const previous = store.current;
    const mounted = await TestReact.render(<Harness.UI spec={integration} />);
    const { container } = mounted;
    const subjectSelector = '[data-component$=":ComponentHost"]';
    const actionsSelector = '[data-passkey-section="actions"]';
    try {
      await Time.waitFor(async () => {
        await React.act(() => Time.wait(0));
        return !!container.querySelector(`${subjectSelector} ${actionsSelector}`);
      });
      const subject = element(container, subjectSelector);
      await activate(actionButton(subject, 'sign-in'));
      await activate(actionButton(subject, 'add-passkey'));
      const pending = valueCell(subject, 'Operation').textContent;
      expect(pending).to.include('Waiting for authenticator');
      const signal = native.signals.at(-1);

      await activate(button(container, 'Status'));
      expect(element(container, subjectSelector)).to.equal(subject);
      expect(subject.querySelector(actionsSelector)).to.eql(null);
      expect(valueCell(subject, 'Operation').textContent).to.eql(pending);
      await activate(button(container, '(reset)'));
      expect(element(container, subjectSelector)).to.equal(subject);
      element(subject, actionsSelector);
      expect(valueCell(subject, 'Operation').textContent).to.eql(pending);
      expect(signal?.aborted).to.eql(false);

      React.act(() => held.resolve());
      await Time.waitFor(async () => {
        await React.act(() => Time.wait(0));
        return valueCell(subject, 'Registered credentials').textContent === '2';
      });
      expect(valueCell(subject, 'Operation').textContent).to.eql('Idle');
      expect(native.calls).to.eql(['get', 'create']);
      expect(server.requests.filter(({ name }) => name === 'passkey.add.finish')).to.have.length(1);
    } finally {
      held.resolve();
      React.act(() => mounted.dispose());
      store.reset(previous);
    }
  });

  it('subject unmount during Add → same pending work completes once after remount', async () => {
    using native = browser();
    using server = transport(undefined, 'localhost');
    using listeners = pageListeners();
    using owner = host();
    const held = Promise.withResolvers<void>();
    const create = native.native.create;
    native.native.create = async (options) => {
      await held.promise;
      return create(options);
    };
    await owner.load(integration);
    const store = LocalStorage.immutable<DebugValues>(integrationKey.DEV, defaults);
    const previous = store.current;
    const operation = (root: HTMLElement) => valueCell(root, 'Operation').textContent;
    try {
      {
        using first = await TestReact.render(await owner.subject());
        await activate(actionButton(first.container, 'sign-in'));
        await activate(actionButton(first.container, 'add-passkey'));
        expect(operation(first.container)).to.include('Waiting for authenticator');
      }
      await React.act(() => owner.load(integration));
      using next = await TestReact.render(await owner.subject(), { strict: true });
      expect(operation(next.container)).to.include('Waiting for authenticator');
      expect(native.signals.at(-1)?.aborted).to.eql(false);
      expect(listeners.acquired).to.have.members(['pagehide', 'pageshow']);
      React.act(() => held.resolve());
      await Time.waitFor(async () => {
        await React.act(() => Time.wait(0));
        return valueCell(next.container, 'Registered credentials').textContent === '2';
      });
      expect(native.calls).to.eql(['get', 'create']);
      const commands = server.requests.map(({ name }) => name).filter((name) =>
        name !== 'service.stats'
      );
      expect(commands).to.eql([
        'session.signIn.begin',
        'session.signIn.finish',
        'passkey.add.begin',
        'passkey.add.finish',
      ]);
    } finally {
      held.resolve();
      store.reset(previous);
    }
  });

  it('two live contexts → separate observations, sessions, and view choices', async () => {
    using _native = browser();
    using server = transport(undefined, 'localhost');
    using first = host();
    using other = host();
    let reads = 0;
    server.handlers['service.stats'] = () =>
      accepted({ accounts: ++reads, registeredPasskeys: 0, validSessions: 0 });
    await first.load(integration);
    const subjectA = await first.subject();
    const serviceA = subjectA.props.controller.service;
    await Time.waitFor(() => serviceA.current().kind === 'observed');
    await other.load(integration);
    const subjectB = await other.subject();
    const serviceB = subjectB.props.controller.service;
    await Time.waitFor(() => serviceB.current().kind === 'observed');
    using a = await TestReact.render(subjectA);
    using b = await TestReact.render(subjectB);
    const accountsA = () => valueCell(a.container, 'Total accounts').textContent;
    expect(accountsA()).to.eql('1');
    expect(valueCell(b.container, 'Total accounts').textContent).to.eql('2');
    await exerciseAccountFlow(a.container);
    expect(valueCell(b.container, 'Authentication').textContent).to.eql('Signed out');
    const { debug } = (await first.sidebar()).props;
    debug.props.view.value = 'status';
    expect((await first.subject()).props.view).to.eql('status');
    expect((await other.subject()).props.view).to.eql('panel');
    React.act(other.dispose);
    expect(serviceB.current()).to.eql({ kind: 'not-observed' });
    expect(accountsA()).to.eql('1');
    await activate(actionButton(a.container, 'sign-out'));
    expect(valueCell(a.container, 'Authentication').textContent).to.eql('Signed out');
  });

  it('pure fixture selection → subject changes without an account request or intent', async () => {
    using server = transport();
    using preview = await TestReact.render(<Harness.UI spec={pure} />);
    const { container } = preview;
    await Time.waitFor(async () => {
      await React.act(() => Time.wait(0));
      return !!container.querySelector('[data-passkey-section="actions"]');
    });
    const selector = '[role="note"][id]';
    expect(container.querySelector(selector)).to.eql(null);
    await activate(button(container, 'Signed out • registration hint'));
    const note = element(container, selector);
    const create = actionButton(container, 'create-account');
    expect(create.getAttribute('aria-describedby')).to.eql(note.id);
    expect(valueCell(container, 'events:').textContent).to.eql('0');
    expect(server.fetchCount).to.eql(0);
  });
});

/** Exercise the registered subject and sidebar independently on the real harness context. */
function host() {
  const $ = Rx.subject<Event>();
  const bus = { $, fire: (event: Event) => $.next(event) };
  const events = Harness.Bus.Controller({ instance: { bus, id: 'passkey.lifecycle' } });
  const dispose = () => {
    events.dispose();
    $.complete();
  };
  async function render<T>(renderer?: DevRendererRef) {
    if (!renderer) throw new Error('Missing specimen renderer');
    const { size } = (await events.info.get()).render.props!;
    const el = await renderer.fn({ id: renderer.id, state: {}, size });
    if (!React.isValidElement<T>(el)) throw new Error('Expected a registered React element');
    return el;
  }
  return {
    events,
    dispose,
    [Symbol.dispose]: dispose,
    async load(suite: TestSuiteModel) {
      expect((await events.load.fire(suite)).error).to.eql(undefined);
      expect((await events.run.fire()).info?.run.results?.ok).to.eql(true);
    },
    async subject() {
      return render<t.Controller.Props>((await events.info.get()).render.props!.subject.renderer);
    },
    async sidebar<T = Pick<DebugSignals, 'props'>>() {
      const { debug } = (await events.info.get()).render.props!;
      return render<{ debug: T }>(debug.body.renderers[0]);
    },
  };
}
