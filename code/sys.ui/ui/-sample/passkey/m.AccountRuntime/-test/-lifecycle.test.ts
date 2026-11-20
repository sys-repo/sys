import { Accounts } from '../../m.Accounts/mod.ts';
import { describe, expect, it, type t, WebFixture } from './common.ts';
import { accepted, browser, rpId, token, transport, wallClock } from './u.fixture.ts';

const cancelled = { kind: 'not-submitted', reason: 'cancelled' };

describe('AccountRuntime lifetime and cancellation boundaries', () => {
  it('departure during expiry notification → only a new intent can sign in', async () => {
    using clock = wallClock();
    using native = browser();
    using server = transport();
    using runtime = server.create();
    runtime.start();
    expect(await runtime.run('sign-in')).to.eql({ kind: 'accepted' });
    clock.set(server.session.expiresAt);
    const expiresAt = server.session.expiresAt + 60_000;
    server.handlers['session.signIn.begin'] = () =>
      accepted({ transaction: 'new', expiresAt, options: { rpId, challenge: 'new' } });
    server.handlers['session.signIn.finish'] = () =>
      accepted({ credential: token, session: { ...server.session, expiresAt } });

    let departed = false;
    const sub = runtime.state.changes$.subscribe(() => {
      if (departed || runtime.state.current.session.kind !== 'signed-out') return;
      departed = true;
      runtime.depart();
      runtime.start();
    });
    try {
      const outcome = await runtime.run('sign-in');
      expect(departed).to.equal(true);
      expect(outcome).to.eql(cancelled);
      const requests = server.requests.map((r) => r.name);
      expect(requests).to.eql(['session.signIn.begin', 'session.signIn.finish']);
      expect(native.calls).to.eql(['get']);
      expect(runtime.state.current.session.kind).to.equal('signed-out');
      expect(runtime.state.current.last).to.equal(undefined);
      expect(await runtime.run('sign-in')).to.eql({ kind: 'accepted' });
      expect(runtime.state.current.session.kind).to.equal('signed-in');
    } finally {
      sub.unsubscribe();
    }
  });

  for (const exit of ['restore', 'dispose'] as const) {
    it(`held native work → ${exit} → release reports availability only to a live host`, async () => {
      using native = browser();
      using server = transport();
      using runtime = server.create();
      const entered = Promise.withResolvers<void>();
      const held = Promise.withResolvers<null>();
      native.native.create = () => {
        entered.resolve();
        return held.promise;
      };
      runtime.start();
      const attempt = runtime.run('create-account');
      await entered.promise;
      runtime.depart();
      runtime.start();
      const states: t.AccountRuntime.Snapshot[] = [];
      const sub = runtime.state.changes$.subscribe(() => states.push(runtime.state.current));
      try {
        expect(runtime.state.current.operation).to.eql({ kind: 'retiring' });
        expect(runtime.state.current.last).to.equal(undefined);
        expect(await runtime.run('sign-in')).to.eql({ kind: 'not-submitted', reason: 'busy' });
        expect(native.calls).to.eql(['create']);
        if (exit === 'dispose') runtime.dispose();
        const beforeRelease = runtime.state.current;
        held.resolve(null);
        expect(await attempt).to.eql(cancelled);
        if (exit === 'dispose') {
          expect(runtime.state.current).to.equal(beforeRelease);
          expect(states.map((s) => s.lifecycle)).to.eql(['disposed']);
        } else {
          expect(states).to.eql([{ ...beforeRelease, operation: { kind: 'idle' } }]);
          expect(runtime.state.current.session.kind).to.equal('signed-out');
          expect(await runtime.run('sign-in')).to.eql({ kind: 'accepted' });
        }
      } finally {
        held.resolve(null);
        await attempt;
        sub.unsubscribe();
      }
    });
  }

  it('grant admitted → depart and restore before adoption → accepted without a local session', async () => {
    using _native = browser();
    using server = transport();
    using runtime = server.create();
    runtime.start();
    let restored: t.AccountRuntime.Snapshot | undefined;
    using _boundary = afterAdmittedReply('account.create.finish', 'accepted', () => {
      runtime.depart();
      runtime.start();
      restored = runtime.state.current;
    });

    expect(await runtime.run('create-account')).to.eql({ kind: 'accepted' });
    expect(restored?.operation.kind).to.equal('retiring');
    const { operation, session, last } = runtime.state.current;
    expect(operation.kind).to.equal('idle');
    expect(session.kind).to.equal('signed-out');
    expect(last).to.equal(undefined);
    await runtime.refresh();
    expect(server.fetchCount).to.equal(2);
    const commands = server.requests.map((r) => r.name);
    expect(commands).to.eql(['account.create.begin', 'account.create.finish']);
  });

  it('cancel after admitted no-session reply → retain the refusal, forget the bearer', async () => {
    using native = browser();
    using server = transport();
    using runtime = server.create();
    runtime.start();
    expect(await runtime.run('sign-in')).to.eql({ kind: 'accepted' });
    const refused = { kind: 'rejected', code: 'no-session' } as const;
    server.handlers['passkey.add.begin'] = () => refused;
    let cancelledDuringBegin = false;
    using _boundary = afterAdmittedReply('passkey.add.begin', 'rejected', () => {
      const op = runtime.state.current.operation;
      cancelledDuringBegin = op.kind === 'pending' && op.phase === 'begin';
      runtime.cancel();
    });
    expect(await runtime.run('add-passkey')).to.eql(refused);
    expect(cancelledDuringBegin).to.equal(true);
    expect(runtime.state.current.last).to.eql({ action: 'add-passkey', outcome: refused });
    expect(runtime.state.current.session.kind).to.equal('signed-out');
    await runtime.refresh();
    expect(server.requests.slice(2).map((r) => r.name)).to.eql(['passkey.add.begin']);
    expect(native.creation).to.eql([]);
  });

  it('cancel before obtaining enrollment begin reply → no confirmed absence', async () => {
    using native = browser();
    using server = transport();
    using runtime = server.create();
    const entered = Promise.withResolvers<void>();
    const held = Promise.withResolvers<void>();
    server.handlers['passkey.add.begin'] = async () => {
      entered.resolve();
      await held.promise;
      return { kind: 'rejected', code: 'no-session' };
    };
    runtime.start();
    expect(await runtime.run('sign-in')).to.eql({ kind: 'accepted' });
    const attempt = runtime.run('add-passkey');
    await entered.promise;
    try {
      runtime.cancel();
      expect(await attempt).to.eql(cancelled);
      expect(runtime.state.current.session.kind).to.equal('signed-in');
      expect(native.creation).to.eql([]);
      expect(server.requests.slice(2).map((r) => r.name)).to.eql(['passkey.add.begin']);
    } finally {
      held.resolve();
    }
  });

  for (const action of ['create-account', 'sign-in'] as const) {
    it(`${action}: native null without abort → unavailable, no finish`, async () => {
      using native = browser();
      using server = transport();
      using runtime = server.create();
      native.native.create = native.native.get = () => Promise.resolve(null);
      runtime.start();
      expect(await runtime.run(action)).to.eql({ kind: 'not-submitted', reason: 'unavailable' });
      expect(native.signals.map((signal) => signal.aborted)).to.eql([false]);
      const begin = action === 'sign-in' ? 'session.signIn.begin' : 'account.create.begin';
      expect(server.requests.map((r) => r.name)).to.eql([begin]);
    });
  }
});

/** Run after the real reader admits this reply, before the workflow resumes from send. */
function afterAdmittedReply(
  command: t.Accounts.Name,
  kind: 'accepted' | 'rejected',
  fn: () => void,
) {
  const original = Accounts.readResult;
  const readResult: typeof original = (name, input) => {
    const reply = original(name, input);
    if (name === command && reply?.kind === kind) queueMicrotask(fn);
    return reply;
  };
  return WebFixture.Property.mock([{
    target: Accounts,
    key: 'readResult',
    descriptor: { value: readResult },
  }]);
}
