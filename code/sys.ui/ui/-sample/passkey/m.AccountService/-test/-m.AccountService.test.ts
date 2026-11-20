import { AccountService } from '../mod.ts';
import { wallClock } from '../../-test/u.fixture.wallClock.ts';
import { beforeAll, describe, expect, expectTypeOf, it, Json, type t, Try } from './common.ts';
import { authenticator, config, fixture, value } from './u.fixture.ts';

let first: t.Authenticator;
let second: t.Authenticator;
describe('AccountService authority', () => {
  beforeAll(async () => {
    first = await authenticator();
    second = await authenticator();
  });
  it('public construction → disposable instance; unsupported algorithms fail construction', () => {
    using service = AccountService.create(config());
    expect(service.dispose).to.equal(service[Symbol.dispose]);
    expect(() => AccountService.create({ ...config(), algorithms: [-999] })).to.throw(TypeError);
  });

  it('public factory → fresh System clock reads expire a challenge and permit recovery', async () => {
    const options = config();
    using clock = wallClock(1_800_000_000_000);
    using service = AccountService.create(options);
    const handlers = service.handlers({});
    const ctx = {
      id: 'req-public-clock',
      signal: new AbortController().signal,
      emit() {},
    } as const;
    clock.set(clock.now + 100); // Advance after construction: a captured snapshot is not a clock.
    const begin = value(
      await handlers['account.create.begin']({}, {
        ...ctx,
        name: 'account.create.begin',
      }),
    );
    expect(begin.expiresAt).to.equal(clock.now + options.lifetimes.challenge);
    const input = { transaction: begin.transaction, response: first.registration(begin.options) };
    clock.set(begin.expiresAt);
    expect(
      await handlers['account.create.finish'](input, {
        ...ctx,
        name: 'account.create.finish',
      }),
    ).to.eql({ kind: 'rejected', code: 'invalid-transaction' });
    const fresh = value(
      await handlers['account.create.begin']({}, {
        ...ctx,
        name: 'account.create.begin',
      }),
    );
    expect(fresh.expiresAt).to.equal(clock.now + options.lifetimes.challenge);
    value(
      await handlers['account.create.finish']({
        transaction: fresh.transaction,
        response: first.registration(fresh.options),
      }, { ...ctx, name: 'account.create.finish' }),
    );
  });

  for (const purpose of ['create', 'add'] as const) {
    it(`${purpose} options → resident credential, UV, no attestation, and credProps`, async () => {
      using host = fixture();
      const begin = value(await host.call('account.create.begin', {}));
      let options = begin.options;
      if (purpose === 'add') {
        const grant = value(
          await host.call('account.create.finish', {
            transaction: begin.transaction,
            response: first.registration(begin.options),
          }),
        );
        options = value(await host.call('passkey.add.begin', {}, grant.credential)).options;
      }
      expectTypeOf(options).toMatchTypeOf<PublicKeyCredentialCreationOptionsJSON>();
      expect(options.authenticatorSelection?.residentKey).to.equal('required');
      expect(options.authenticatorSelection?.userVerification).to.equal('required');
      expect(options.attestation).to.equal('none');
      expect(options.extensions).to.eql({ credProps: true });
    });
  }

  it('sign-in options → identifier-free discovery with required UV', async () => {
    using host = fixture();
    const begin = value(await host.call('account.create.begin', {}));
    value(
      await host.call('account.create.finish', {
        transaction: begin.transaction,
        response: first.registration(begin.options),
      }),
    );
    const signIn = value(await host.call('session.signIn.begin', {}));
    expectTypeOf(signIn.options).toMatchTypeOf<PublicKeyCredentialRequestOptionsJSON>();
    expect(signIn.options.allowCredentials ?? []).to.eql([]);
    expect(signIn.options.userVerification).to.equal('required');
  });

  it('session observation → immutable facts without bearer or ceremony material', async () => {
    using host = fixture();
    const begin = value(await host.call('account.create.begin', {}));
    const grant = value(
      await host.call('account.create.finish', {
        transaction: begin.transaction,
        response: first.registration(begin.options),
      }),
    );
    const observation = value(await host.call('session.inspect', {}, grant.credential))!;
    expect(observation).to.eql(grant.session);
    expect(Reflect.set(observation.account, 'credentialCount', 0)).to.equal(false);
    expect(Json.stringify(observation)).not.to.contain(grant.credential);
    expect(Json.stringify(observation)).not.to.contain(begin.options.challenge);
    expect(value(await host.call('session.inspect', {}, grant.credential))).to.eql(grant.session);
  });

  it('create → enroll → revoke → identifier-free sign-in with the new credential', async () => {
    using host = fixture();
    const begin = value(await host.call('account.create.begin', {}));
    const grant = value(
      await host.call('account.create.finish', {
        transaction: begin.transaction,
        response: first.registration(begin.options),
      }),
    );
    expect(grant.session.account.credentialCount).to.equal(1);
    const add = value(await host.call('passkey.add.begin', {}, grant.credential));
    expect(add.options.user.id).to.equal(begin.options.user.id);
    expect(add.options.excludeCredentials?.map((item) => item.id)).to.eql([first.id]);
    host.clock.now += 5;
    const enrolled = value(
      await host.call('passkey.add.finish', {
        transaction: add.transaction,
        response: second.registration(add.options),
      }, grant.credential),
    );
    expect(enrolled.account.credentialCount).to.equal(2);
    expect(enrolled.expiresAt).to.equal(grant.session.expiresAt);
    expect(grant.session.account.credentialCount).to.equal(1); // Point-in-time, not a mutable alias.
    expect(value(await host.call('session.revoke', {}, grant.credential))).to.equal(null);
    expect(value(await host.call('session.inspect', {}, grant.credential))).to.equal(null);
    const signIn = value(await host.call('session.signIn.begin', {}));
    const returned = value(
      await host.call('session.signIn.finish', {
        transaction: signIn.transaction,
        response: await second.assertion(signIn.options, begin.options.user.id),
      }),
    );
    expect(returned.session.account).to.eql(enrolled.account);
    expect(returned.credential).not.to.equal(grant.credential);
    expect(value(await host.call('session.inspect', {}, returned.credential)))
      .to.eql(returned.session);
  });

  it('registration policy mismatch → sanitized failure and permanent transaction consumption', async () => {
    using host = fixture();
    for (
      const changes of [
        { origin: 'https://other.test' },
        { rpId: 'other.test' },
        { challenge: 'different' },
        { userVerified: false },
      ]
    ) {
      const begin = value(await host.call('account.create.begin', {}));
      const { result } = await Try.run(() =>
        host.call('account.create.finish', {
          transaction: begin.transaction,
          response: first.registration(begin.options, changes),
        })
      );
      expect(result.ok).to.equal(false);
      if (result.ok) throw new Error('Expected service failure');
      expect(result.error.message).to.equal('Account service failed.');
      expect(result.error.stack).to.equal(undefined);
      expect(result.error.cause).to.equal(undefined);
      expect(
        await host.call('account.create.finish', {
          transaction: begin.transaction,
          response: first.registration(begin.options),
        }),
      ).to.eql({ kind: 'rejected', code: 'invalid-transaction' });
    }
    const begin = value(await host.call('account.create.begin', {}));
    const response = first.registration(begin.options);
    expect(
      await host.call('account.create.finish', {
        transaction: begin.transaction,
        response: { ...response, id: second.id, rawId: second.id },
      }),
    ).to.eql({ kind: 'rejected', code: 'verification-rejected' });
  });

  it('zero counters work; rejected signatures cannot advance stored counters', async () => {
    using host = fixture();
    const begin = value(await host.call('account.create.begin', {}));
    value(
      await host.call('account.create.finish', {
        transaction: begin.transaction,
        response: first.registration(begin.options),
      }),
    );
    for (const counter of [0, 0]) {
      const signIn = value(await host.call('session.signIn.begin', {}));
      value(
        await host.call('session.signIn.finish', {
          transaction: signIn.transaction,
          response: await first.assertion(signIn.options, begin.options.user.id, { counter }),
        }),
      );
    }
    const bad = value(await host.call('session.signIn.begin', {}));
    expect(
      await host.call('session.signIn.finish', {
        transaction: bad.transaction,
        response: await first.assertion(bad.options, begin.options.user.id, {
          counter: 200,
          badSignature: true,
        }),
      }),
    ).to.eql({ kind: 'rejected', code: 'verification-rejected' });
    const good = value(await host.call('session.signIn.begin', {}));
    value(
      await host.call('session.signIn.finish', {
        transaction: good.transaction,
        response: await first.assertion(good.options, begin.options.user.id, { counter: 1 }),
      }),
    );
    const repeated = value(await host.call('session.signIn.begin', {}));
    const repeatedInput = {
      transaction: repeated.transaction,
      response: await first.assertion(repeated.options, begin.options.user.id, { counter: 1 }),
    };
    const { result } = await Try.run(() => host.call('session.signIn.finish', repeatedInput));
    expect(result.ok).to.equal(false);
    if (result.ok) throw new Error('Expected service failure');
    expect(result.error.message).to.equal('Account service failed.');
    expect(await host.call('session.signIn.finish', repeatedInput))
      .to.eql({ kind: 'rejected', code: 'invalid-transaction' });
  });

  it('wrong user handle or unknown credential cannot select another account', async () => {
    using host = fixture();
    const begin = value(await host.call('account.create.begin', {}));
    value(
      await host.call('account.create.finish', {
        transaction: begin.transaction,
        response: first.registration(begin.options),
      }),
    );
    for (const key of [first, second]) {
      const attempt = value(await host.call('session.signIn.begin', {}));
      expect(
        await host.call('session.signIn.finish', {
          transaction: attempt.transaction,
          response: await key.assertion(attempt.options, 'wrong-handle'),
        }),
      ).to.eql({ kind: 'rejected', code: 'verification-rejected' });
    }
  });

  it('malformed and wrong-purpose requests do not consume a valid transaction', async () => {
    using host = fixture();
    const begin = value(await host.call('account.create.begin', {}));
    const response = first.registration(begin.options);
    expect(
      await host.call(
        'account.create.finish',
        {
          transaction: begin.transaction,
          response,
          extra: 'not allowed',
        } as t.Accounts.Payload['account.create.finish'],
      ),
    ).to.eql({ kind: 'rejected', code: 'invalid-request' });
    expect(
      await host.call('session.signIn.finish', {
        transaction: begin.transaction,
        response: await first.assertion(
          { challenge: 'unused', rpId: 'example.test' },
          begin.options.user.id,
        ),
      }),
    ).to.eql({ kind: 'rejected', code: 'invalid-transaction' });
    value(await host.call('account.create.finish', { transaction: begin.transaction, response }));
  });

  it('global credential uniqueness → conflict, never reassociation', async () => {
    using host = fixture();
    const begin = value(await host.call('account.create.begin', {}));
    const grant = value(
      await host.call('account.create.finish', {
        transaction: begin.transaction,
        response: first.registration(begin.options),
      }),
    );
    const another = value(await host.call('account.create.begin', {}));
    expect(
      await host.call('account.create.finish', {
        transaction: another.transaction,
        response: first.registration(another.options),
      }),
    ).to.eql({ kind: 'rejected', code: 'credential-conflict' });
    expect(value(await host.call('session.inspect', {}, grant.credential))).to.eql(grant.session);
  });
});
