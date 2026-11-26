import React from 'react';
import { afterAll, beforeAll, describe, DomMock, expect, it, TestReact, Time } from './common.ts';
import {
  accepted,
  afterAdmittedReply,
  browser,
  transport,
  wallClock,
} from '../../m.Account.Runtime/-test/u.fixture.ts';
import {
  actionButton,
  activate,
  buttons,
  element,
  pageListeners,
  press,
  valueCell,
} from './u.fixture.tsx';

const recovery = 'Reload this page, then choose Sign In.';

const loadController = () => import('../../ui.controller/mod.ts');

describe('passkey panel controller', () => {
  DomMock.init({ beforeAll, afterAll });

  it('import is inert; open and render are quiet', async () => {
    using listeners = pageListeners();
    using server = transport();
    using cleanup = new DisposableStack();
    const { Controller } = await loadController();
    expect(listeners.acquired).to.eql([]);
    expect(server.fetchCount).to.eql(0);

    const controller = Controller.open();
    cleanup.defer(controller.dispose);
    expect(listeners.acquired).to.eql(['pagehide', 'pageshow']);
    expect(server.fetchCount).to.eql(0);

    const { current, run } = controller;
    let subscriptions = 0;
    function subscribe(notify: () => void) {
      const unsubscribe = controller.subscribe(notify);
      subscriptions++;
      return () => {
        subscriptions--;
        unsubscribe();
      };
    }
    const res = await TestReact.render(<Controller.UI controller={{ current, subscribe, run }} />, {
      strict: true,
    });
    try {
      expect(valueCell(res.container, 'Authentication').textContent).to.eql('Signed out');
      expect(listeners.acquired).to.eql(['pagehide', 'pageshow']);
      expect(server.fetchCount).to.eql(0);
      expect(subscriptions).to.eql(1);
    } finally {
      React.act(() => res.dispose());
    }
    expect(subscriptions).to.eql(0);
    expect(listeners.attached.size).to.eql(2);
    expect(current().lifecycle).to.eql('active');
  });

  it('attempts are not sessions: lost begin, refused finish, and accepted expired grant', async () => {
    using native = browser();
    using server = transport(undefined, 'localhost');
    const { Controller } = await loadController();
    const controller = Controller.open();
    const res = await TestReact.render(<Controller.UI controller={controller} />);
    const attempt = () => activate(actionButton(res.container, 'sign-in'));
    const result = () => valueCell(res.container, 'Last result').textContent;
    try {
      server.faults.lost = 'session.signIn.begin';
      await attempt();
      expect(result()).to.include('Mutation not submitted');
      expect(native.calls).to.eql([]);
      server.faults.lost = '';
      server.handlers['session.signIn.finish'] = () => ({
        kind: 'rejected',
        code: 'verification-rejected',
      });
      await attempt();
      expect(result()).to.include('Service refused: verification-rejected');
      server.handlers['session.signIn.finish'] = () =>
        accepted({
          credential: 'test-only',
          session: { ...server.session, expiresAt: Time.now.timestamp - 1 },
        });
      await attempt();
      expect(result()).to.include('Accepted by the account service');
      expect(valueCell(res.container, 'Authentication').textContent).to.eql('Signed out');
      expect(valueCell(res.container, 'Principal').textContent).to.eql('-');
      expect(native.calls).to.eql(['get', 'get']);
      expect(server.fetchCount).to.eql(5);
    } finally {
      React.act(() => res.dispose());
      controller.dispose();
    }
  });

  it('expiry on Add activation → signed out with the unsubmitted Add, not the previous success', async () => {
    using clock = wallClock();
    using native = browser();
    using server = transport(undefined, 'localhost');
    const { Controller } = await loadController();
    const controller = Controller.open();
    const res = await TestReact.render(<Controller.UI controller={controller} />);
    const { container } = res;
    try {
      await activate(actionButton(container, 'sign-in'));
      const add = actionButton(container, 'add-passkey');
      clock.set(server.session.expiresAt);
      await activate(add);
      expect(valueCell(container, 'Authentication').textContent).to.eql('Signed out');
      expect(valueCell(container, 'Principal').textContent).to.eql('-');
      const last = valueCell(container, 'Last result').textContent;
      expect(last).to.include(`${add.textContent} — Mutation not submitted`);
      const commands = server.requests.map(({ name }) => name);
      expect(commands).to.eql(['session.signIn.begin', 'session.signIn.finish']);
      expect(native.calls).to.eql(['get']);
    } finally {
      React.act(() => res.dispose());
      controller.dispose();
    }
  });

  for (const action of ['create-account', 'sign-in', 'add-passkey', 'sign-out'] as const) {
    it(`${action} → lost reply after commit; observe at most once, never replay`, async () => {
      using _native = browser();
      using server = transport(undefined, 'localhost');
      using cleanup = new DisposableStack();
      const { Controller } = await loadController();
      const controller = Controller.open();
      cleanup.defer(controller.dispose);
      const retained = action === 'add-passkey' || action === 'sign-out';
      if (retained) await controller.run('sign-in');
      const before = server.fetchCount;
      const res = await TestReact.render(
        <Controller.UI controller={controller} sections={{ context: false }} />,
        { strict: true },
      );
      cleanup.defer(() => React.act(() => res.dispose()));
      const { container } = res;
      const names = {
        'create-account': ['account.create.begin', 'account.create.finish'],
        'add-passkey': ['passkey.add.begin', 'passkey.add.finish'],
        'sign-in': ['session.signIn.begin', 'session.signIn.finish'],
        'sign-out': ['session.revoke'],
      } as const;
      const commands = names[action];
      server.faults.lost = commands.at(-1)!;
      let committed = false;
      const updated = {
        ...server.session,
        account: { ...server.session.account, credentialCount: 2 },
      };
      let live: typeof server.session | null = retained ? server.session : null;
      const grant = { session: updated, credential: 'test-only' };
      server.handlers['account.create.finish'] = server.handlers['session.signIn.finish'] = () => {
        committed = true;
        live = grant.session;
        return accepted(grant);
      };
      server.handlers['passkey.add.finish'] = () => {
        committed = true;
        live = updated;
        return accepted(live);
      };
      server.handlers['session.revoke'] = () => {
        committed = true;
        live = null;
        return accepted(null);
      };
      server.handlers['session.inspect'] = () => {
        expect(committed).to.eql(true);
        return accepted(live);
      };
      const control = actionButton(container, action);
      if (action === 'create-account' || action === 'add-passkey') {
        const note = element(container, '[role="note"][id]:not([id=""])');
        expect(control.getAttribute('aria-describedby')).to.eql(note.id);
      }
      await activate(control);
      expect(committed).to.eql(true);
      expect(valueCell(container, 'Last result').textContent).to.include('Outcome unknown');
      if (!retained) {
        expect(valueCell(container, 'Authentication').textContent).to.include(recovery);
        expect(buttons(container)).to.eql([]);
      } else if (action === 'add-passkey') {
        expect(valueCell(container, 'Registered credentials').textContent).to.eql('2');
      } else expect(valueCell(container, 'Authentication').textContent).to.eql('Signed out');
      expect(server.requests.slice(before).map(({ name }) => name)).to.eql([
        ...commands,
        ...(retained ? ['session.inspect'] : []),
      ]);
    });
  }

  it('inspection before delayed commit → keep the observed count and the unknown result', async () => {
    using _native = browser();
    using server = transport(undefined, 'localhost');
    const release = Promise.withResolvers<void>();
    const events: string[] = [];
    let live = server.session;
    server.handlers['passkey.add.finish'] = async () => {
      await release.promise;
      live = { ...live, account: { ...live.account, credentialCount: 2 } };
      events.push('commit');
      return accepted(live);
    };
    server.handlers['session.inspect'] = () => {
      events.push('inspect');
      return accepted(live);
    };
    server.faults.disconnect = 'passkey.add.finish';
    const { Controller } = await loadController();
    const controller = Controller.open();
    const res = await TestReact.render(<Controller.UI controller={controller} />);
    try {
      await React.act(async () => {
        await controller.run('sign-in');
        await controller.run('add-passkey');
      });
      expect(events).to.eql(['inspect']);
      release.resolve();
      await Time.waitFor(() => events.includes('commit'));
      expect(events).to.eql(['inspect', 'commit']);
      expect(live.account.credentialCount).to.eql(2);
      expect(valueCell(res.container, 'Registered credentials').textContent).to.eql('1');
      expect(valueCell(res.container, 'Last result').textContent).to.include('Outcome unknown');
      expect(server.requests.slice(2).map(({ name }) => name)).to.eql([
        'passkey.add.begin',
        'passkey.add.finish',
        'session.inspect',
      ]);
    } finally {
      release.resolve();
      React.act(() => res.dispose());
      controller.dispose();
    }
  });

  it('departure after admitted grant → both owners restore without credentials or a stale result', async () => {
    using _native = browser();
    using server = transport(undefined, 'localhost');
    using cleanup = new DisposableStack();
    const { Controller } = await loadController();
    const a = Controller.open();
    const b = Controller.open();
    cleanup.defer(() => {
      a.dispose();
      b.dispose();
    });
    await b.run('sign-in');
    let waiting = false;
    using _grant = afterAdmittedReply('account.create.finish', 'accepted', () => {
      pageEvent('pagehide', true);
      pageEvent('pageshow', false);
      expect(a.current().lifecycle).to.eql('departed');
      pageEvent('pageshow', true);
      waiting = a.current().operation.kind === 'retiring';
    });
    const res = await TestReact.render(<Controller.UI controller={a} />, { strict: true });
    cleanup.defer(() => React.act(() => res.dispose()));
    await activate(actionButton(res.container, 'create-account'));
    expect(waiting).to.eql(true);
    expect(valueCell(res.container, 'Operation').textContent).to.eql('Idle');
    expect(valueCell(res.container, 'Last result').textContent).to.eql('-');
    expect(valueCell(res.container, 'Principal').textContent).to.eql('-');
    expect(valueCell(res.container, 'Authentication').textContent).to.eql('Signed out');
    expect(b.current().session.kind).to.eql('signed-out');
    expect(server.requests.map(({ name }) => name)).to.eql([
      'session.signIn.begin',
      'session.signIn.finish',
      'account.create.begin',
      'account.create.finish',
    ]);
  });

  it('page listeners → one pair per owner; dispose detaches those exact callbacks', async () => {
    const { Controller } = await loadController();
    using listeners = pageListeners();
    const { attached } = listeners;
    const a = Controller.open();
    const b = Controller.open();
    try {
      expect([...attached.values()]).to.eql(['pagehide', 'pageshow', 'pagehide', 'pageshow']);
      a.dispose();
      expect([...attached.values()]).to.eql(['pagehide', 'pageshow']);
      pageEvent('pagehide', true);
      expect(b.current().lifecycle).to.eql('departed');
      pageEvent('pageshow', true);
      expect(a.current().lifecycle).to.eql('disposed');
      expect(b.current().lifecycle).to.eql('active');
    } finally {
      a.dispose();
      b.dispose();
    }
    expect(attached.size).to.eql(0);
  });

  it('native work held across restore → keep slot through strict reattachment; suppress pointer and keyboard', async () => {
    using native = browser();
    using server = transport(undefined, 'localhost');
    const held = Promise.withResolvers<null>();
    native.native.create = () => held.promise;
    const { Controller } = await loadController();
    const controller = Controller.open();
    const first = await TestReact.render(<Controller.UI controller={controller} />);
    try {
      await activate(actionButton(first.container, 'create-account'));
      expect(native.calls).to.eql(['create']);
      const page = globalThis.window;
      page.dispatchEvent(new page.Event('blur'));
      expect(controller.current().operation.kind).to.eql('pending');
      React.act(() => {
        pageEvent('pagehide', true);
        pageEvent('pageshow', true);
      });
      const next = await TestReact.render(
        <Controller.UI controller={controller} debug theme='Dark' />,
        { strict: true },
      );
      try {
        expect(valueCell(next.container, 'Operation').textContent).to.eql(
          'Waiting for previous operation',
        );
        for (const el of buttons(next.container)) {
          expect(el.getAttribute('aria-disabled')).to.eql('true');
          press(el, 'Enter');
          React.act(() => DomMock.Mouse.activate(el));
        }
        await React.act(() => {
          held.resolve(null);
          return held.promise;
        });
        expect(valueCell(next.container, 'Operation').textContent).to.eql('Idle');
        expect(valueCell(next.container, 'Last result').textContent).to.eql('-');
        expect(actionButton(next.container, 'sign-in').tabIndex).to.eql(0);
        expect(server.requests.map(({ name }) => name)).to.eql(['account.create.begin']);
      } finally {
        React.act(() => next.dispose());
      }
    } finally {
      held.resolve(null);
      React.act(() => first.dispose());
      controller.dispose();
    }
  });

  it('held inspection fails → no mutations, no second inspection on redraw or reattachment', async () => {
    using _native = browser();
    using server = transport(undefined, 'localhost');
    const held = Promise.withResolvers<void>();
    const entered = Promise.withResolvers<void>();
    server.handlers['session.inspect'] = async () => {
      entered.resolve();
      await held.promise;
      return { kind: 'rejected', code: 'invalid-request' };
    };
    server.faults.lost = 'session.revoke';
    const { Controller } = await loadController();
    const controller = Controller.open();
    await controller.run('sign-in');
    const res = await TestReact.render(<Controller.UI controller={controller} />);
    const control = actionButton(res.container, 'sign-out');
    try {
      await React.act(async () => {
        press(control, 'Enter');
        await Time.waitFor(() => entered.promise.then(() => true));
      });
      expect(valueCell(res.container, 'Operation').textContent).to.eql('Checking session');
      expect(buttons(res.container)).to.eql([]);
      press(control, 'Enter');
      React.act(() => DomMock.Mouse.activate(control));
      await React.act(() => {
        held.resolve();
        return held.promise;
      });
      expect(valueCell(res.container, 'Authentication').textContent).to.include(recovery);
      expect(valueCell(res.container, 'Last result').textContent).to.include('Outcome unknown');
      const next = await TestReact.render(
        <Controller.UI controller={controller} debug theme='Dark' />,
        { strict: true },
      );
      try {
        expect(buttons(next.container)).to.eql([]);
      } finally {
        React.act(() => next.dispose());
      }
      expect(server.requests.slice(2).map(({ name }) => name)).to.eql([
        'session.revoke',
        'session.inspect',
      ]);
    } finally {
      held.resolve();
      React.act(() => res.dispose());
      controller.dispose();
    }
  });
});

/** Synthetic wiring event; it is not evidence of a BFCache hit. */
function pageEvent(type: 'pagehide' | 'pageshow', persisted: boolean) {
  const page = globalThis.window;
  page.dispatchEvent(Object.assign(new page.Event(type), { persisted }));
}
