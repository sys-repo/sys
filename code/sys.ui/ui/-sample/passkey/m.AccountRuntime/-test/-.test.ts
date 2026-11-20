import { authenticator, fixture } from '../../m.AccountService/-test/u.fixture.ts';
import { AccountRuntime } from '../mod.ts';
import { describe, expect, it, Json, Time, WebFixture } from './common.ts';
import { accepted, browser, creation, endpoint, token, transport, wallClock } from './u.fixture.ts';

const ok = { kind: 'accepted' };
const uncertain = { kind: 'indeterminate' };
const local = (reason: string) => ({ kind: 'not-submitted', reason });

describe('AccountRuntime', () => {
  it('inert → explicit start with no bearer, no service request, and no ceremony', async () => {
    using native = browser();
    using server = transport();
    using runtime = server.create();
    expect(runtime.state.current.lifecycle).to.equal('inactive');
    expect(await runtime.run('sign-in')).to.eql(local('unavailable'));
    runtime.start();
    await runtime.refresh();
    expect(runtime.state.current).to.eql({
      lifecycle: 'active',
      browser: { kind: 'available' },
      session: { kind: 'signed-out' },
      operation: { kind: 'idle' },
    });
    expect(await runtime.run('sign-out')).to.eql(local('invalid-input'));
    expect(native.calls).to.eql([]);
    expect(server.fetchCount).to.equal(0);
  });

  it('missing native JSON conversion → unavailable before GET, POST, or ceremony', async () => {
    using native = browser();
    using _missing = WebFixture.Property.mock([{
      target: native.Credential,
      key: 'parseRequestOptionsFromJSON',
      descriptor: { value: undefined, configurable: true },
    }]);
    using server = transport();
    using runtime = server.create();
    runtime.start();
    expect(runtime.state.current.browser).to.eql({ kind: 'unavailable', reason: 'unsupported' });
    expect(await runtime.run('create-account')).to.eql(local('unavailable'));
    expect(server.fetchCount).to.equal(0);
    expect(native.calls).to.eql([]);
  });

  it('mismatched RP → no native conversion or finish; fixed endpoint survives caller mutation', async () => {
    using native = browser();
    using server = transport();
    using runtime = server.create();
    server.options.endpoint = 'https://different.example.test/cmd';
    server.options.rpId = 'different.example.test';
    server.handlers['account.create.begin'] = () =>
      accepted({
        transaction: 'tx',
        expiresAt: server.session.expiresAt,
        options: { ...creation(), rp: { id: 'different.example.test', name: 'Other' } },
      });
    runtime.start();
    expect(await runtime.run('create-account')).to.eql(local('invalid-input'));
    expect(native.creation).to.eql([]);
    expect(native.calls).to.eql([]);
    expect(server.requests).to.eql([{
      name: 'account.create.begin',
      url: endpoint,
      authorization: null,
      credentials: 'omit',
      redirect: 'manual',
    }]);
  });

  it('create → signed in; current and events remain live, immutable and secret-free', async () => {
    using native = browser();
    using server = transport();
    const sideEffects: unknown[] = [];
    using _probes = WebFixture.Property.mock([
      ...['log', 'info', 'warn', 'error', 'debug'].map((key) => ({
        target: console,
        key,
        descriptor: { value: (...args: unknown[]) => sideEffects.push(args) },
      })),
      ...['localStorage', 'sessionStorage', 'caches'].map((key) => ({
        target: globalThis,
        key,
        descriptor: { configurable: true, get: () => sideEffects.push(key) },
      })),
    ]);
    using runtime = server.create();
    const state = runtime.state;
    const before = state.current;
    const states: typeof before[] = [];
    const events: unknown[] = [];
    const changes = state.changes$.subscribe((event) => {
      events.push(event);
      states.push(state.current);
    });
    try {
      runtime.start();
      expect(await runtime.run('create-account')).to.eql(ok);
      expect(state.current.session).to.eql({ kind: 'signed-in', value: server.session });
      expect(before.lifecycle).to.equal('inactive');
      const phases = states.map(({ operation }) =>
        operation.kind === 'pending' ? operation.phase : operation.kind
      );
      expect(phases).to.eql(['idle', 'begin', 'ceremony', 'finish', 'idle']);
      expect(events).to.eql([undefined, undefined, undefined, undefined, undefined]);
      expect(Reflect.set(state, 'current', before)).to.equal(false);
      expect(Reflect.set(states[1].operation, 'phase', 'request')).to.equal(false);
      if (state.current.session.kind !== 'signed-in') throw new Error('Expected signed in');
      expect(Reflect.set(state.current.session.value.account, 'principal', 'altered')).to.equal(
        false,
      );
      expect(Reflect.set(state.current.last!.outcome, 'kind', 'rejected')).to.equal(false);
      expect(native.creation.length).to.equal(1);
      expect(server.requests.map((x) => x.authorization)).to.eql([null, null]);
      expect(Json.stringify({ states, events, runtime })).not.to.include('PRIVATE_TEST');
      expect(sideEffects).to.eql([]);
    } finally {
      changes.unsubscribe();
    }
  });

  it('synchronous observer re-entry → one ceremony; cancel does not release the native slot', async () => {
    using native = browser();
    using server = transport();
    using runtime = server.create();
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<null>();
    native.native.create = () => {
      entered.resolve();
      return release.promise;
    };
    runtime.start();
    let duplicate: ReturnType<typeof runtime.run> | undefined;
    const changes = runtime.state.changes$.subscribe(() => {
      const op = runtime.state.current.operation;
      if (op.kind === 'pending' && op.phase === 'begin') duplicate = runtime.run('sign-in');
    });
    try {
      const attempt = runtime.run('create-account');
      await entered.promise;
      runtime.cancel();
      await runtime.refresh();
      expect(await duplicate).to.eql(local('busy'));
      expect(await runtime.run('create-account')).to.eql(local('busy'));
      expect(native.signals.map((x) => x.aborted)).to.eql([true]);
      release.resolve(null);
      expect(await attempt).to.eql(local('cancelled'));
      expect(server.requests.map((x) => x.name)).to.eql(['account.create.begin']);
      expect(runtime.state.current.session.kind).to.equal('signed-out');
    } finally {
      release.resolve(null);
      changes.unsubscribe();
    }
  });

  it('departure from a finish notification → no submission or stale result on restoration', async () => {
    using native = browser();
    using server = transport();
    using runtime = server.create();
    runtime.start();
    const changes = runtime.state.changes$.subscribe(() => {
      const op = runtime.state.current.operation;
      if (op.kind !== 'pending' || op.phase !== 'finish') return;
      runtime.depart();
      runtime.start();
    });
    try {
      expect(await runtime.run('create-account')).to.eql(local('cancelled'));
      expect(native.calls).to.eql(['create']);
      expect(server.requests.map((x) => x.name)).to.eql(['account.create.begin']);
      expect(runtime.state.current.session.kind).to.equal('signed-out');
      expect(runtime.state.current.last).to.equal(undefined);
    } finally {
      changes.unsubscribe();
    }
  });

  it('failed inspection and uncertain enrollment/revoke retain bearer without resolving outcomes', async () => {
    using _native = browser();
    using server = transport();
    using runtime = server.create();
    runtime.start();
    expect(await runtime.run('sign-in')).to.eql(ok);
    server.faults.invalid = 'session.inspect';
    await runtime.refresh();
    expect(runtime.state.current.session.kind).to.equal('unknown');
    expect(await runtime.run('sign-out')).to.eql(local('invalid-input'));
    server.faults.invalid = '';
    await runtime.refresh();
    expect(runtime.state.current.session.kind).to.equal('signed-in');
    server.faults.lost = 'passkey.add.finish';
    expect(await runtime.run('add-passkey')).to.eql(uncertain);
    expect(runtime.state.current.session.kind).to.equal('unknown');
    await runtime.refresh();
    expect(runtime.state.current.session.kind).to.equal('signed-in');
    expect(runtime.state.current.last).to.eql({ action: 'add-passkey', outcome: uncertain });
    server.faults.lost = 'session.revoke';
    expect(await runtime.run('sign-out')).to.eql(uncertain);
    expect(runtime.state.current.session.kind).to.equal('unknown');
    server.handlers['session.inspect'] = () => accepted(null);
    await runtime.refresh();
    expect(runtime.state.current.session.kind).to.equal('signed-out');
    const count = server.requests.length;
    await runtime.refresh();
    expect(server.requests.length).to.equal(count);
    expect(runtime.state.current.last).to.eql({ action: 'sign-out', outcome: uncertain });
    expect(
      server.requests.slice(2).map((x) => x.authorization).every((x) => x === `Bearer ${token}`),
    )
      .to.equal(true);
    expect(Json.stringify(runtime.state.current)).not.to.include('PRIVATE_TEST');
  });

  it('enrollment reply with a different principal → indeterminate without adopting it', async () => {
    using _native = browser();
    using server = transport();
    using runtime = server.create();
    runtime.start();
    expect(await runtime.run('sign-in')).to.eql(ok);
    server.handlers['passkey.add.finish'] = () => {
      const account = { principal: 'another-account', credentialCount: 2 };
      return accepted({ ...server.session, account });
    };
    expect(await runtime.run('add-passkey')).to.eql(uncertain);
    expect(runtime.state.current.session.kind).to.equal('unknown');
    await runtime.refresh();
    expect(runtime.state.current.session).to.eql({ kind: 'signed-in', value: server.session });
    expect(runtime.state.current.last).to.eql({ action: 'add-passkey', outcome: uncertain });
  });

  it('possibly dispatched begin or provably unsent finish → mutation not submitted', async () => {
    using native = browser();
    using server = transport();
    using runtime = AccountRuntime.create({
      ...server.options,
      policy: { ...server.options.policy, maxBytes: { request: 200, response: 32_768 } },
    });
    runtime.start();
    server.faults.lost = 'account.create.begin';
    expect(await runtime.run('create-account')).to.eql(local('unavailable'));
    expect(native.calls).to.eql([]);
    server.faults.lost = '';
    expect(await runtime.run('create-account')).to.eql(local('unavailable'));
    expect(native.calls).to.eql(['create']);
    expect(runtime.state.current.session.kind).to.equal('signed-out');
    expect(server.requests.map((x) => x.name)).to.eql([
      'account.create.begin',
      'account.create.begin',
    ]);
  });

  it('lost creation grant → no implied rollback, retry, or anonymous inspection', async () => {
    using _native = browser();
    using server = transport();
    using runtime = server.create();
    runtime.start();
    server.faults.lost = 'account.create.finish';
    expect(await runtime.run('create-account')).to.eql(uncertain);
    expect(runtime.state.current.session.kind).to.equal('unknown');
    await runtime.refresh();
    expect(await runtime.run('create-account')).to.eql(local('invalid-input'));
    expect(server.requests.map((x) => x.name)).to.eql([
      'account.create.begin',
      'account.create.finish',
    ]);
    using replacement = server.create();
    replacement.start();
    expect(await replacement.run('sign-in')).to.eql(ok);
    expect(server.requests.slice(2).map((x) => x.authorization)).to.eql([null, null]);
  });

  for (const exit of ['depart', 'dispose'] as const) {
    it(`pending finish → ${exit} → client returns indeterminate before the server replies`, async () => {
      using native = browser();
      using server = transport();
      using runtime = server.create();
      const entered = Promise.withResolvers<void>();
      const release = Promise.withResolvers<void>();
      const done = Promise.withResolvers<void>();
      server.handlers['account.create.finish'] = async () => {
        entered.resolve();
        await release.promise;
        done.resolve();
        return accepted({ credential: token, session: server.session });
      };
      runtime.start();
      const attempt = runtime.run('create-account');
      await entered.promise;
      try {
        runtime[exit]();
        runtime.start();
        expect(await attempt).to.eql(uncertain);
      } finally {
        release.resolve();
        await done.promise;
      }
      await runtime.refresh();
      expect(runtime.state.current.session.kind).to.equal(
        exit === 'depart' ? 'signed-out' : 'unknown',
      );
      expect(runtime.state.current.last).to.equal(undefined);
      expect(server.requests.map((x) => x.name)).to.eql([
        'account.create.begin',
        'account.create.finish',
      ]);
      expect(native.calls).to.eql(['create']);
    });
  }

  it('stale inspection after departure → restoration opens no ceremony and sends no retained bearer', async () => {
    using native = browser();
    using server = transport();
    using runtime = server.create();
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    server.handlers['session.inspect'] = async () => {
      entered.resolve();
      await release.promise;
      return accepted(server.session);
    };
    runtime.start();
    expect(await runtime.run('sign-in')).to.eql(ok);
    const inspection = runtime.refresh();
    await entered.promise;
    expect(await runtime.run('sign-out')).to.eql(local('busy'));
    runtime.depart();
    runtime.start();
    release.resolve();
    await inspection;
    await runtime.refresh();
    expect(runtime.state.current.session.kind).to.equal('signed-out');
    expect(native.calls).to.eql(['get']);
    expect(server.requests.map((x) => x.authorization)).to.eql([null, null, `Bearer ${token}`]);
  });

  it('two live runtimes on one origin → each bearer stays with its issuing endpoint', async () => {
    using _native = browser();
    using server = transport();
    using first = server.create();
    first.start();
    expect(await first.run('sign-in')).to.eql(ok);
    const secondEndpoint = 'https://accounts.example.test/second/cmd';
    using second = AccountRuntime.create({ ...server.options, endpoint: secondEndpoint });
    second.start();
    await second.refresh();
    expect(second.state.current.session.kind).to.equal('signed-out');
    expect(server.fetchCount).to.equal(2); // Only the first sign-in's begin and finish.

    const secondToken = 'PRIVATE_TEST_SECOND_BEARER';
    server.handlers['session.signIn.finish'] = () =>
      accepted({ credential: secondToken, session: server.session });
    expect(await second.run('sign-in')).to.eql(ok);
    await first.refresh();
    await second.refresh();
    const sent = server.requests.map(({ name, url, authorization }) => [name, url, authorization]);
    expect(sent).to.eql([
      ['session.signIn.begin', endpoint, null],
      ['session.signIn.finish', endpoint, null],
      ['session.signIn.begin', secondEndpoint, null],
      ['session.signIn.finish', secondEndpoint, null],
      ['session.inspect', endpoint, `Bearer ${token}`],
      ['session.inspect', secondEndpoint, `Bearer ${secondToken}`],
    ]);
  });

  it('session expires while enrollment begins → no credential creation or finish', async () => {
    using clock = wallClock();
    using native = browser();
    using server = transport();
    using runtime = server.create();
    runtime.start();
    expect(await runtime.run('sign-in')).to.eql(ok);
    server.handlers['passkey.add.begin'] = () => {
      clock.set(server.session.expiresAt);
      const expiresAt = server.session.expiresAt + 1_000;
      return accepted({ transaction: 'tx', expiresAt, options: creation() });
    };
    expect(await runtime.run('add-passkey')).to.eql(local('invalid-input'));
    expect(native.creation).to.eql([]);
    expect(runtime.state.current.session.kind).to.equal('signed-out');
    expect(server.requests.slice(2).map((x) => x.name)).to.eql(['passkey.add.begin']);
  });

  it('accepted already-expired grant cannot establish local authority', async () => {
    using _native = browser();
    using server = transport();
    using runtime = server.create();
    server.handlers['session.signIn.finish'] = () =>
      accepted({
        credential: token,
        session: { ...server.session, expiresAt: Time.now.timestamp - 1 },
      });
    runtime.start();
    expect(await runtime.run('sign-in')).to.eql(ok);
    expect(runtime.state.current.session.kind).to.equal('signed-out');
    await runtime.refresh();
    expect(server.requests.length).to.equal(2);
  });

  it('reference service + bounded transport → create, enroll, revoke and native signature sign-in', async () => {
    using reference = fixture();
    reference.clock.now = Time.now.timestamp;
    using native = browser();
    using server = transport(reference.service.handlers);
    using runtime = server.create();
    const first = await authenticator();
    const second = await authenticator();
    const keys = [first, second];
    native.native.create = () => {
      const options = native.creation.at(-1)!;
      return Promise.resolve(keys.shift()!.registration(options));
    };
    native.native.get = () => second.assertion(native.request.at(-1)!, native.creation[0].user.id);
    runtime.start();
    expect(await runtime.run('create-account')).to.eql(ok);
    expect(await runtime.run('add-passkey')).to.eql(ok);
    const enrolled = runtime.state.current.session;
    if (enrolled.kind !== 'signed-in') {
      throw new Error(`Expected signed-in after enrollment, got ${enrolled.kind}`);
    }
    expect(enrolled.value.account.credentialCount).to.equal(2);
    expect(await runtime.run('sign-out')).to.eql(ok);
    expect(runtime.state.current.session.kind).to.equal('signed-out');
    expect(await runtime.run('sign-in')).to.eql(ok);
    const signedIn = runtime.state.current.session;
    if (signedIn.kind !== 'signed-in') {
      throw new Error(`Expected signed-in after sign-in, got ${signedIn.kind}`);
    }
    expect(signedIn.value.account).to.eql(enrolled.value.account);
  });
});
