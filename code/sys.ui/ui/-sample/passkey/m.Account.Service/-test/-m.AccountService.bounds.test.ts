import { beforeAll, describe, expect, it, type t } from './common.ts';
import { authenticator, config, fixture, value } from './u.fixture.ts';

let key: t.Authenticator;
let extra: t.Authenticator;

describe('AccountService bounds and isolation', () => {
  beforeAll(async () => {
    key = await authenticator();
    extra = await authenticator();
  });

  for (const field of ['accounts', 'credentials'] as const) {
    it(`${field} capacity → coherent refusal without live-authority eviction`, async () => {
      const options = config();
      options.capacity[field] = 1;
      using host = fixture(options);
      const first = value(await host.call('account.create.begin', {}));
      const grant = value(
        await host.call('account.create.finish', {
          transaction: first.transaction,
          response: key.registration(first.options),
        }),
      );
      const second = value(await host.call('account.create.begin', {}));
      const input = {
        transaction: second.transaction,
        response: extra.registration(second.options),
      };
      expect(await host.call('account.create.finish', input)).to.eql({
        kind: 'rejected',
        code: 'capacity',
      });
      expect(await host.call('account.create.finish', input))
        .to.eql({ kind: 'rejected', code: 'invalid-transaction' });
      expect(value(await host.call('session.inspect', {}, grant.credential))).to.eql(grant.session);
      const signIn = value(await host.call('session.signIn.begin', {}));
      expect(
        await host.call('session.signIn.finish', {
          transaction: signIn.transaction,
          response: await extra.assertion(signIn.options, second.options.user.id),
        }),
      ).to.eql({ kind: 'rejected', code: 'verification-rejected' });
    });
  }

  it('session capacity refusal does not commit the verified counter', async () => {
    const options = config();
    options.capacity.sessions = 1;
    using host = fixture(options);
    const begin = value(await host.call('account.create.begin', {}));
    const grant = value(
      await host.call('account.create.finish', {
        transaction: begin.transaction,
        response: key.registration(begin.options),
      }),
    );
    const full = value(await host.call('session.signIn.begin', {}));
    expect(
      await host.call('session.signIn.finish', {
        transaction: full.transaction,
        response: await key.assertion(full.options, begin.options.user.id, { counter: 1 }),
      }),
    ).to.eql({ kind: 'rejected', code: 'capacity' });
    await host.call('session.revoke', {}, grant.credential);
    const free = value(await host.call('session.signIn.begin', {}));
    value(
      await host.call('session.signIn.finish', {
        transaction: free.transaction,
        response: await key.assertion(free.options, begin.options.user.id, { counter: 1 }),
      }),
    );
  });

  it('expired unused transactions and sessions free their own bounded slots', async () => {
    const options = config();
    options.capacity.transactions = 1;
    options.capacity.sessions = 1;
    using host = fixture(options);
    const old = value(await host.call('account.create.begin', {}));
    expect(await host.call('session.signIn.begin', {})).to.eql({
      kind: 'rejected',
      code: 'capacity',
    });
    host.clock.now = old.expiresAt;
    const fresh = value(await host.call('account.create.begin', {}));
    expect(
      await host.call('account.create.finish', {
        transaction: old.transaction,
        response: key.registration(old.options),
      }),
    ).to.eql({ kind: 'rejected', code: 'invalid-transaction' });
    const grant = value(
      await host.call('account.create.finish', {
        transaction: fresh.transaction,
        response: key.registration(fresh.options),
      }),
    );
    host.clock.now = grant.session.expiresAt;
    expect(value(await host.call('session.inspect', {}, grant.credential))).to.equal(null);
    const signIn = value(await host.call('session.signIn.begin', {}));
    value(
      await host.call('session.signIn.finish', {
        transaction: signIn.transaction,
        response: await key.assertion(signIn.options, fresh.options.user.id),
      }),
    );
  });

  it('another session cannot finish enrollment or consume the initiating session transaction', async () => {
    using host = fixture();
    const begin = value(await host.call('account.create.begin', {}));
    const first = value(
      await host.call('account.create.finish', {
        transaction: begin.transaction,
        response: key.registration(begin.options),
      }),
    );
    const signIn = value(await host.call('session.signIn.begin', {}));
    const second = value(
      await host.call('session.signIn.finish', {
        transaction: signIn.transaction,
        response: await key.assertion(signIn.options, begin.options.user.id),
      }),
    );
    const add = value(await host.call('passkey.add.begin', {}, first.credential));
    const input = { transaction: add.transaction, response: extra.registration(add.options) };
    for (const bearer of [undefined, 'unknown', second.credential]) {
      expect(await host.call('passkey.add.finish', input, bearer))
        .to.eql({ kind: 'rejected', code: 'no-session' });
    }
    expect(
      value(await host.call('passkey.add.finish', input, first.credential)).account.credentialCount,
    )
      .to.equal(2);
  });

  it('request-local bearer capture → mutation and concurrent inspection remain isolated', async () => {
    using host = fixture();
    const first = value(await host.call('account.create.begin', {}));
    const a = value(
      await host.call('account.create.finish', {
        transaction: first.transaction,
        response: key.registration(first.options),
      }),
    );
    const second = value(await host.call('account.create.begin', {}));
    const b = value(
      await host.call('account.create.finish', {
        transaction: second.transaction,
        response: extra.registration(second.options),
      }),
    );
    const authority = { credential: a.credential };
    const handlers = host.service.handlers(authority);
    authority.credential = b.credential;
    const ctx = {
      id: 'req-local' as const,
      name: 'session.inspect' as const,
      signal: new AbortController().signal,
      emit() {},
    };
    const [left, right] = await Promise.all([
      handlers['session.inspect']({}, ctx),
      host.call('session.inspect', {}, b.credential),
    ]);
    expect(value(left)).to.eql(a.session);
    expect(value(right)).to.eql(b.session);
    await host.call('session.revoke', {}, a.credential);
    expect(value(await host.call('session.inspect', {}, b.credential))).to.eql(b.session);
    expect(await host.call('passkey.add.begin', {}, a.credential)).to.eql({
      kind: 'rejected',
      code: 'no-session',
    });
  });

  it('configuration and returned options cannot redirect captured verification authority', async () => {
    const options = config();
    using host = fixture(options);
    options.rp.id = 'other.test';
    options.origins[0] = 'https://other.test';
    const begin = value(await host.call('account.create.begin', {}));
    const response = key.registration(begin.options);
    begin.options.challenge = 'changed';
    begin.options.rp.id = 'other.test';
    value(await host.call('account.create.finish', { transaction: begin.transaction, response }));
  });

  it('new instance forgets old authority without reconstructing it from surviving credentials', async () => {
    using old = fixture();
    const begin = value(await old.call('account.create.begin', {}));
    const grant = value(
      await old.call('account.create.finish', {
        transaction: begin.transaction,
        response: key.registration(begin.options),
      }),
    );
    old.dispose();
    using fresh = fixture();
    expect(value(await fresh.call('session.inspect', {}, grant.credential))).to.equal(null);
    const signIn = value(await fresh.call('session.signIn.begin', {}));
    expect(
      await fresh.call('session.signIn.finish', {
        transaction: signIn.transaction,
        response: await key.assertion(signIn.options, begin.options.user.id),
      }),
    ).to.eql({ kind: 'rejected', code: 'verification-rejected' });
  });
});
