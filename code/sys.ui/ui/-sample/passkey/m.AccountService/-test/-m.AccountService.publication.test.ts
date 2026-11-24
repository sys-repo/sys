import { Accounts } from '../../m.Accounts/mod.ts';
import { beforeAll, describe, expect, it, type t, Try, WebFixture } from './common.ts';
import { authenticator, config, fixture, value } from './u.fixture.ts';

let key: t.Authenticator;
let extra: t.Authenticator;

describe('AccountService result validation before publication', () => {
  beforeAll(async () => {
    key = await authenticator();
    extra = await authenticator();
  });

  for (const mode of ['throw', 'refuse'] as const) {
    it(`create result ${mode} → consumed attempt, no account/credential/session`, async () => {
      const options = config();
      options.capacity = { accounts: 1, credentials: 1, sessions: 1, transactions: 1 };
      using host = fixture(options);
      const begin = value(await host.call('account.create.begin', {}));
      const input = { transaction: begin.transaction, response: key.registration(begin.options) };
      await resultFailure(
        'account.create.finish',
        mode,
        () => host.call('account.create.finish', input),
      );
      expect(await host.call('account.create.finish', input))
        .to.eql({ kind: 'rejected', code: 'invalid-transaction' });
      const unknown = value(await host.call('session.signIn.begin', {}));
      expect(
        await host.call('session.signIn.finish', {
          transaction: unknown.transaction,
          response: await key.assertion(unknown.options, begin.options.user.id),
        }),
      ).to.eql({ kind: 'rejected', code: 'verification-rejected' });
      const fresh = value(await host.call('account.create.begin', {}));
      value(
        await host.call('account.create.finish', {
          transaction: fresh.transaction,
          response: key.registration(fresh.options),
        }),
      );
    });

    it(`enrollment result ${mode} → no association or credential-count change`, async () => {
      const options = config();
      options.capacity.credentials = 2;
      using host = fixture(options);
      const begin = value(await host.call('account.create.begin', {}));
      const grant = value(
        await host.call('account.create.finish', {
          transaction: begin.transaction,
          response: key.registration(begin.options),
        }),
      );
      const add = value(await host.call('passkey.add.begin', {}, grant.credential));
      const input = { transaction: add.transaction, response: extra.registration(add.options) };
      await resultFailure(
        'passkey.add.finish',
        mode,
        () => host.call('passkey.add.finish', input, grant.credential),
      );
      expect(await host.call('passkey.add.finish', input, grant.credential))
        .to.eql({ kind: 'rejected', code: 'invalid-transaction' });
      expect(value(await host.call('session.inspect', {}, grant.credential))).to.eql(grant.session);
      const fresh = value(await host.call('passkey.add.begin', {}, grant.credential));
      expect(
        value(
          await host.call('passkey.add.finish', {
            transaction: fresh.transaction,
            response: extra.registration(fresh.options),
          }, grant.credential),
        ).account.credentialCount,
      ).to.equal(2);
    });

    it(`sign-in result ${mode} → unchanged counter and last session slot`, async () => {
      const options = config();
      options.capacity.sessions = 2;
      using host = fixture(options);
      const begin = value(await host.call('account.create.begin', {}));
      const grant = value(
        await host.call('account.create.finish', {
          transaction: begin.transaction,
          response: key.registration(begin.options),
        }),
      );
      const attempt = value(await host.call('session.signIn.begin', {}));
      const input = {
        transaction: attempt.transaction,
        response: await key.assertion(attempt.options, begin.options.user.id, { counter: 1 }),
      };
      await resultFailure(
        'session.signIn.finish',
        mode,
        () => host.call('session.signIn.finish', input),
      );
      expect(await host.call('session.signIn.finish', input))
        .to.eql({ kind: 'rejected', code: 'invalid-transaction' });
      expect(value(await host.call('session.inspect', {}, grant.credential))).to.eql(grant.session);
      const fresh = value(await host.call('session.signIn.begin', {}));
      value(
        await host.call('session.signIn.finish', {
          transaction: fresh.transaction,
          response: await key.assertion(fresh.options, begin.options.user.id, { counter: 1 }),
        }),
      );
    });

    it(`revoke result ${mode} → session remains live until a validated revocation`, async () => {
      using host = fixture();
      const begin = value(await host.call('account.create.begin', {}));
      const grant = value(
        await host.call('account.create.finish', {
          transaction: begin.transaction,
          response: key.registration(begin.options),
        }),
      );
      await resultFailure(
        'session.revoke',
        mode,
        () => host.call('session.revoke', {}, grant.credential),
      );
      expect(value(await host.call('session.inspect', {}, grant.credential))).to.eql(grant.session);
      value(await host.call('session.revoke', {}, grant.credential));
      expect(value(await host.call('session.inspect', {}, grant.credential))).to.equal(null);
    });

    for (
      const name of ['account.create.begin', 'session.signIn.begin', 'passkey.add.begin'] as const
    ) {
      it(`${name} result ${mode} → no retained transaction capacity`, async () => {
        const options = config();
        options.capacity.transactions = 1;
        using host = fixture(options);
        const begin = value(await host.call('account.create.begin', {}));
        const grant = value(
          await host.call('account.create.finish', {
            transaction: begin.transaction,
            response: key.registration(begin.options),
          }),
        );
        await resultFailure(name, mode, () => host.call(name, {}, grant.credential));
        expect((await host.call(name, {}, grant.credential)).kind).to.equal('accepted');
      });
    }
  }
});

/** Fail the production reader, not the authority/verifier seam; always restore it. */
async function resultFailure(
  name: t.Accounts.Name,
  mode: 'throw' | 'refuse',
  run: () => Promise<unknown>,
) {
  const original = Accounts.readResult;
  let calls = 0;
  const readResult: t.Accounts.Lib['readResult'] = (operation, input) => {
    if (operation !== name) return original(operation, input);
    calls++;
    if (mode === 'throw') throw new Error('SECRET_RESULT_DEFECT');
    return undefined;
  };
  using _mock = WebFixture.Property.mock([{
    target: Accounts,
    key: 'readResult',
    descriptor: { value: readResult },
  }]);
  const completion = (await Try.run(run)).result;
  expect(calls).to.equal(1);
  expect(completion.ok).to.equal(false);
  if (completion.ok) throw new Error('Expected service failure');
  expect(completion.error.message).to.equal('Account service failed.');
  expect(completion.error.stack).to.equal(undefined);
  expect(completion.error.cause).to.equal(undefined);
}
