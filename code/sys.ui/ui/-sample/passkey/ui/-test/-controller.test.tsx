import {
  afterAll,
  beforeAll,
  describe,
  DomMock,
  expect,
  it,
  type t,
  TestReact,
  Time,
  WebFixture,
} from './common.ts';
import { accepted, browser, transport } from '../../m.Account.Runtime/-test/u.fixture.ts';
import { snapshotOf } from '../../ui.controller/u.snapshot.ts';
import { pageListeners, valueCell } from './u.fixture.tsx';

const loadController = () => import('../../ui.controller/mod.ts');

describe('passkey panel controller', () => {
  DomMock.init({ beforeAll, afterAll });

  it('import → inert; strict view unmount → releases subscriptions, not the controller', async () => {
    using listeners = pageListeners();
    using server = transport();
    using cleanup = new DisposableStack();
    const { Controller } = await loadController();
    expect(listeners.acquired).to.eql([]);
    const owner = Controller.open();
    cleanup.defer(owner.dispose);
    let subscriptions = 0;
    const track = (subscribe: t.Controller.Instance['subscribe']) => (notify: () => void) => {
      subscriptions++;
      const stop = subscribe(notify);
      return () => {
        subscriptions--;
        stop();
      };
    };
    const borrowed = {
      ...owner,
      subscribe: track(owner.subscribe),
      service: {
        ...owner.service,
        subscribe: track(owner.service.subscribe),
        availability: {
          ...owner.service.availability,
          subscribe: track(owner.service.availability.subscribe),
        },
      },
    };
    {
      using res = await TestReact.render(<Controller.UI controller={borrowed} />, { strict: true });
      expect(valueCell(res.container, 'Authentication').textContent).to.eql('Signed out');
      expect(subscriptions).to.eql(3);
    }
    expect(subscriptions).to.eql(0);
    expect(owner.current().lifecycle).to.eql('active');
    expect(server.fetchCount).to.eql(0);
  });

  it('visibility and page lifetime → poll only while active and visible', async () => {
    using server = transport();
    const fetch = globalThis.fetch;
    const signals: AbortSignal[] = [];
    using _fetch = WebFixture.Fetch.mock((input, init) => {
      signals.push(new Request(input, init).signal);
      return fetch(input, init);
    });
    const page = globalThis.window;
    let hidden = true;
    using _visibility = WebFixture.Property.mock([{
      target: page.document,
      key: 'hidden',
      descriptor: { configurable: true, get: () => hidden },
    }]);
    const setHidden = (value: boolean) => {
      hidden = value;
      page.document.dispatchEvent(new page.Event('visibilitychange'));
    };
    let entered = false;
    const held = Promise.withResolvers<void>();
    const fresh = { accounts: 0, registeredPasskeys: 0, validSessions: 0 };
    server.handlers['service.stats'] = async () => {
      entered = true;
      await held.promise;
      return accepted({ ...fresh, accounts: 1 });
    };
    const { Controller } = await loadController();
    const owner = Controller.open({ observeService: true });
    try {
      expect(server.fetchCount).to.eql(0);
      setHidden(false);
      await Time.waitFor(() => entered);
      expect(signals[0].aborted).to.eql(false);
      setHidden(true);
      expect(owner.current().lifecycle).to.eql('active');
      expect(signals[0].aborted).to.eql(true);
      held.resolve();

      server.handlers['service.stats'] = () => accepted(fresh);
      setHidden(false);
      setHidden(false);
      await Time.waitFor(() => owner.service.current().kind === 'observed');
      expect(owner.service.current()).to.eql({ kind: 'observed', counts: fresh });
      expect(server.fetchCount).to.eql(2);

      pageEvent('pagehide', true);
      expect(owner.service.current()).to.eql({ kind: 'not-observed' });
      pageEvent('pageshow', false);
      expect(owner.current().lifecycle).to.eql('departed');
      expect(server.fetchCount).to.eql(2);
      pageEvent('pageshow', true);
      await Time.waitFor(() => owner.service.current().kind === 'observed');
      expect(server.fetchCount).to.eql(3);
      owner.dispose();
      setHidden(true);
      setHidden(false);
      pageEvent('pageshow', true);
      expect(server.fetchCount).to.eql(3);
    } finally {
      owner.dispose();
      held.resolve();
    }
  });

  it('attempt outcome → projected independently of session authority', () => {
    const state = {
      lifecycle: 'active',
      browser: { kind: 'available' },
      session: { kind: 'signed-out' },
      operation: { kind: 'idle' },
    } as const;
    const cases = [
      [{ kind: 'accepted' }, 'success'],
      [{ kind: 'rejected', code: 'verification-rejected' }, 'failure'],
      [{ kind: 'not-submitted', reason: 'unavailable' }, 'not-submitted'],
      [{ kind: 'indeterminate' }, 'indeterminate'],
    ] as const;
    for (const [outcome, kind] of cases) {
      const view = snapshotOf({ ...state, last: { action: 'sign-in', outcome } });
      expect(view.authentication).to.eql({ kind: 'signed-out' });
      expect(view.result).to.include({ action: 'sign-in', kind });
      if (outcome.kind === 'rejected') expect(view.result?.summary).to.include(outcome.code);
      if (outcome.kind === 'not-submitted') {
        expect(view.result).to.include({ reason: outcome.reason });
      }
    }
  });

  it('inspection and retiring work → distinct operation announcements', async () => {
    const { Controller } = await loadController();
    using cleanup = new DisposableStack();
    const owner = Controller.open();
    cleanup.defer(owner.dispose);
    const state = owner.current();
    const cases = [
      [{ kind: 'pending', action: 'inspect', phase: 'request' }, 'Checking session'],
      [{ kind: 'retiring' }, 'Waiting for previous operation'],
    ] as const;
    for (const [operation, label] of cases) {
      const snapshot = { ...state, operation };
      const controller = { ...owner, current: () => snapshot };
      using res = await TestReact.render(<Controller.UI controller={controller} view='status' />);
      expect(valueCell(res.container, 'Operation').textContent).to.eql(label);
    }
  });

  it('lost sign-in grant → no anonymous inspection or replay', async () => {
    using _native = browser();
    using server = transport(undefined, 'localhost');
    server.faults.lost = 'session.signIn.finish';
    const { Controller } = await loadController();
    const owner = Controller.open();
    try {
      await owner.run('sign-in');
      expect(owner.current().session.kind).to.eql('unknown');
      expect(owner.current().last?.outcome.kind).to.eql('indeterminate');
      const commands = server.requests.map(({ name }) => name);
      expect(commands).to.eql(['session.signIn.begin', 'session.signIn.finish']);
    } finally {
      owner.dispose();
    }
  });

  it('disconnected Add → inspect once, never infer its outcome from the observed count', async () => {
    using _native = browser();
    using server = transport(undefined, 'localhost');
    const held = Promise.withResolvers<void>();
    let live = server.session;
    server.handlers['passkey.add.finish'] = async () => {
      await held.promise;
      live = { ...live, account: { ...live.account, credentialCount: 2 } };
      return accepted(live);
    };
    server.handlers['session.inspect'] = () => accepted(live);
    server.faults.disconnect = 'passkey.add.finish';
    const { Controller } = await loadController();
    const owner = Controller.open();
    try {
      await owner.run('sign-in');
      await owner.run('add-passkey');
      held.resolve();
      await Time.waitFor(() => live.account.credentialCount === 2);
      const { session, last } = owner.current();
      expect(session.kind === 'signed-in' && session.value.account.credentialCount).to.eql(1);
      expect(last).to.eql({ action: 'add-passkey', outcome: { kind: 'indeterminate' } });
      const commands = server.requests.slice(2).map(({ name }) => name);
      expect(commands).to.eql(['passkey.add.begin', 'passkey.add.finish', 'session.inspect']);
    } finally {
      held.resolve();
      owner.dispose();
    }
  });

  it('failed recovery → mounting the view neither retries nor enables mutations', async () => {
    using _native = browser();
    using server = transport(undefined, 'localhost');
    server.faults.lost = 'session.revoke';
    server.handlers['session.inspect'] = () => ({ kind: 'rejected', code: 'invalid-request' });
    const { Controller } = await loadController();
    const owner = Controller.open();
    try {
      await owner.run('sign-in');
      await owner.run('sign-out');
      using res = await TestReact.render(<Controller.UI controller={owner} />, { strict: true });
      expect(valueCell(res.container, 'Authentication').textContent).to.include('Reload this page');
      expect(valueCell(res.container, 'Last result').textContent).to.include('Outcome unknown');
      expect(res.container.querySelector('[data-passkey-section="actions"]')).to.eql(null);
      const commands = server.requests.slice(2).map(({ name }) => name);
      expect(commands).to.eql(['session.revoke', 'session.inspect']);
    } finally {
      owner.dispose();
    }
  });

  it('dispose one owner → only the surviving owner follows page events', async () => {
    const { Controller } = await loadController();
    using listeners = pageListeners();
    const a = Controller.open();
    const b = Controller.open();
    try {
      a.dispose();
      expect(listeners.attached.size).to.eql(2);
      const page = globalThis.window;
      page.dispatchEvent(new page.Event('blur'));
      expect(b.current().lifecycle).to.eql('active');
      pageEvent('pagehide', true);
      expect(b.current().lifecycle).to.eql('departed');
      pageEvent('pageshow', true);
      expect(a.current().lifecycle).to.eql('disposed');
      expect(b.current().lifecycle).to.eql('active');
    } finally {
      a.dispose();
      b.dispose();
    }
    expect(listeners.attached.size).to.eql(0);
  });
});

/** Synthetic page events prove wiring, not a browser BFCache hit. */
function pageEvent(type: 'pagehide' | 'pageshow', persisted: boolean) {
  const page = globalThis.window;
  page.dispatchEvent(Object.assign(new page.Event(type), { persisted }));
}
