import { describe, expect, it, type t } from './common.ts';
import {
  accepted,
  afterAdmittedReply,
  browser,
  rpId,
  token,
  transport,
  wallClock,
} from './u.fixture.ts';

const cancelled = { kind: 'not-submitted', reason: 'cancelled' };

describe('AccountRuntime lifetime and cancellation boundaries', () => {
  it('pre-aborted counts read → no request', async () => {
    using _native = browser();
    using server = transport();
    using runtime = server.create();
    runtime.start();
    expect(await runtime.info.readCounts(AbortSignal.abort())).to.equal(undefined);
    expect(server.fetchCount).to.equal(0);
  });

  for (const exit of ['abort', 'restore', 'dispose'] as const) {
    it(`counts reply admitted → ${exit} before observation → discard totals`, async () => {
      using _native = browser();
      using server = transport();
      using runtime = server.create();
      const abort = new AbortController();
      runtime.start();
      let atBoundary: t.AccountRuntime.State.Snapshot | undefined;
      using _boundary = afterAdmittedReply('service.stats', 'accepted', () => {
        if (exit === 'abort') abort.abort();
        if (exit === 'restore') {
          runtime.depart();
          runtime.start();
        }
        if (exit === 'dispose') runtime.dispose();
        atBoundary = runtime.state.current;
      });
      expect(await runtime.info.readCounts(exit === 'abort' ? abort.signal : undefined)).to.equal(
        undefined,
      );
      expect(atBoundary).not.to.equal(undefined);
      expect(runtime.state.current).to.equal(atBoundary);
      expect(server.requests.map((r) => r.name)).to.eql(['service.stats']);
    });
  }

  it('counts read during a held account action → late totals leave Last result intact', async () => {
    using _native = browser();
    using server = transport();
    using runtime = server.create();
    const finishing = Promise.withResolvers<void>();
    const reading = Promise.withResolvers<void>();
    const releaseFinish = Promise.withResolvers<void>();
    const releaseStats = Promise.withResolvers<void>();
    const totals = { accounts: 1, registeredPasskeys: 1, validSessions: 1 };
    const finish = server.handlers['account.create.finish'];
    server.handlers['account.create.finish'] = async (payload, ctx) => {
      finishing.resolve();
      await releaseFinish.promise;
      return finish(payload, ctx);
    };
    server.handlers['service.stats'] = async () => {
      reading.resolve();
      await releaseStats.promise;
      return accepted(totals);
    };

    runtime.start();
    const attempt = runtime.run('create-account');
    let read: ReturnType<typeof runtime.info.readCounts> | undefined;
    try {
      await Promise.race([finishing.promise, attempt]);
      const pending = runtime.state.current;
      expect(pending.operation.kind).to.equal('pending');
      read = runtime.info.readCounts();
      expect(await Promise.race([reading.promise.then(() => 'reading'), read])).to.equal('reading');
      expect(runtime.state.current).to.equal(pending);
      releaseFinish.resolve();
      expect(await attempt).to.eql({ kind: 'accepted' });
      const settled = runtime.state.current;
      expect(settled.last).to.eql({ action: 'create-account', outcome: { kind: 'accepted' } });
      releaseStats.resolve();
      expect(await read).to.eql(totals);
      expect(runtime.state.current).to.equal(settled);
    } finally {
      releaseFinish.resolve();
      releaseStats.resolve();
      await attempt;
      await read;
    }
  });

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
    const sub = runtime.state.changed$.subscribe(() => {
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
      const states: t.AccountRuntime.State.Snapshot[] = [];
      const sub = runtime.state.changed$.subscribe(() => states.push(runtime.state.current));
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
    let restored: t.AccountRuntime.State.Snapshot | undefined;
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
